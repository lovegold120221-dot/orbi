"""Unit tests for the TranslationRouter's pure demand-computation logic.

These do not exercise LiveKit connectivity or Gemini sessions; they verify that
the router computes the correct (speaker, target_lang) set given fake room
state.
"""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

# Make `src/` importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from config import NATIVE_LANG, PARTICIPANT_LANG_ATTR
from router import TranslationRouter


def _fake_participant(identity: str, lang: str | None, *, mic_muted: bool = False):
    p = MagicMock()
    p.identity = identity
    p.attributes = {PARTICIPANT_LANG_ATTR: lang} if lang else {}
    # one fake audio publication
    pub = MagicMock()
    pub.kind = _AUDIO_KIND
    pub.muted = mic_muted
    pub.track = MagicMock(name="track")
    pub.track.sid = "pub-sid"
    pub.track.source = rtc.TrackSource.SOURCE_MICROPHONE
    p.track_publications = {"pub-sid": pub}
    return p


def _fake_screen_share_participant(identity: str, lang: str):
    """Participant with an unmuted screen share audio track."""
    p = MagicMock()
    p.identity = identity
    p.attributes = {PARTICIPANT_LANG_ATTR: lang}
    pub = MagicMock()
    pub.kind = _AUDIO_KIND
    pub.muted = False
    pub.source = rtc.TrackSource.SOURCE_SCREENSHARE_AUDIO
    pub.track = MagicMock(name="screen-audio")
    pub.track.sid = "ss-aud-1"
    p.track_publications = {"ss-aud-1": pub}
    return p


def _fake_room(participants):
    room = MagicMock()
    room.remote_participants = {p.identity: p for p in participants}
    return room


# Import the actual TrackKind enum value the router compares against.
from livekit import rtc  # noqa: E402

_AUDIO_KIND = rtc.TrackKind.KIND_AUDIO


def _router_with(participants):
    room = _fake_room(participants)
    router = TranslationRouter(room=room, gemini_api_key="test-key")
    # Skip room.on() wiring; emulate the "tracks already subscribed" backfill.
    for p in participants:
        for pub in p.track_publications.values():
            if pub.kind == _AUDIO_KIND and pub.track:
                router._speaker_tracks.setdefault(p.identity, {})[pub.track.sid] = (
                    pub.track
                )
    return router


def test_no_listeners_means_no_sessions():
    router = _router_with([])
    assert router._compute_desired_sessions() == set()


def test_native_only_listener_no_sessions():
    """A listener with lang='none' implies they want native passthrough."""
    p1 = _fake_participant("alice", NATIVE_LANG)
    router = _router_with([p1])
    assert router._compute_desired_sessions() == set()


def test_same_language_pair_no_sessions():
    """Two German speakers → multi-user mode, same-language skip applies."""
    p1 = _fake_participant("p1", "de")
    p2 = _fake_participant("p2", "de")
    router = _router_with([p1, p2])
    assert router._compute_desired_sessions() == set()


def test_single_user_always_creates_session():
    """One user alone → single-user mode, always translate to their target lang."""
    p1 = _fake_participant("p1", "es")
    router = _router_with([p1])
    assert router._compute_desired_sessions() == {("p1", "pub-sid", "es")}


def test_two_different_languages_creates_pair():
    """English speaker + Spanish speaker → 2 sessions (one each direction)."""
    p1 = _fake_participant("p1", "en")
    p2 = _fake_participant("p2", "es")
    router = _router_with([p1, p2])
    assert router._compute_desired_sessions() == {
        ("p1", "pub-sid", "es"),
        ("p2", "pub-sid", "en"),
    }


def test_grill_example_four_participants():
    """P1=en, P2=es, P3=de, P4=de. P3↔P4 stays native (same lang)."""
    p1 = _fake_participant("p1", "en")
    p2 = _fake_participant("p2", "es")
    p3 = _fake_participant("p3", "de")
    p4 = _fake_participant("p4", "de")
    router = _router_with([p1, p2, p3, p4])
    sid = "pub-sid"
    expected = {
        ("p1", sid, "es"),
        ("p1", sid, "de"),
        ("p2", sid, "en"),
        ("p2", sid, "de"),
        ("p3", sid, "en"),
        ("p3", sid, "es"),
        ("p4", sid, "en"),
        ("p4", sid, "es"),
    }
    assert router._compute_desired_sessions() == expected


def test_muted_speaker_does_not_produce_outgoing_sessions():
    """A speaker with muted mic isn't translated FROM, but their language still
    counts as listener demand."""
    p1 = _fake_participant("p1", "en", mic_muted=True)
    p2 = _fake_participant("p2", "es")
    router = _router_with([p1, p2])
    # p1 muted -> no ("p1", *) session. p2 unmuted -> ("p2", "en") to serve p1.
    assert router._compute_desired_sessions() == {("p2", "pub-sid", "en")}


def test_all_speakers_muted_no_sessions():
    """Demand exists but nobody is speaking -> nothing to translate."""
    p1 = _fake_participant("p1", "en", mic_muted=True)
    p2 = _fake_participant("p2", "es", mic_muted=True)
    router = _router_with([p1, p2])
    assert router._compute_desired_sessions() == set()


def test_listener_with_native_does_not_block_others():
    """A listener with lang='none' shouldn't add to target_langs, but their
    presence shouldn't suppress sessions either."""
    p1 = _fake_participant("p1", "en")
    p2 = _fake_participant("p2", "es")
    p3 = _fake_participant("p3", NATIVE_LANG)
    router = _router_with([p1, p2, p3])
    # p3 wants native; the en<->es pair still needs translation.
    assert router._compute_desired_sessions() == {
        ("p1", "pub-sid", "es"),
        ("p2", "pub-sid", "en"),
    }


@pytest.mark.parametrize(
    "speaker_lang,listener_lang,expected_session",
    [
        ("en", "es", True),
        ("de", "de", False),
        ("fr", NATIVE_LANG, False),
    ],
)
def test_single_pair(speaker_lang, listener_lang, expected_session):
    speaker = _fake_participant("speaker", speaker_lang)
    listener = _fake_participant("listener", listener_lang, mic_muted=True)
    router = _router_with([speaker, listener])
    sessions = router._compute_desired_sessions()
    if expected_session:
        assert ("speaker", "pub-sid", listener_lang) in sessions
    else:
        assert sessions == set()


def test_screen_share_audio_always_translated():
    """Screen share audio is always translated into every listener's language."""
    sharer = _fake_screen_share_participant("sharer", "en")
    listener = _fake_participant("listener", "en", mic_muted=True)
    router = _router_with([sharer, listener])
    sessions = router._compute_desired_sessions()
    assert ("sharer", "ss-aud-1", "en") in sessions


def test_screen_share_audio_to_different_lang():
    """Screen share audio translation to a different target language should also
    work (same as before, but with new session key format)."""
    sharer = _fake_screen_share_participant("sharer", "en")
    listener = _fake_participant("listener", "es", mic_muted=True)
    router = _router_with([sharer, listener])
    sessions = router._compute_desired_sessions()
    assert ("sharer", "ss-aud-1", "es") in sessions


def test_screen_share_audio_with_mic_mixed():
    """A participant sharing screen with audio AND has an active mic should
    produce sessions for both tracks. Screen share always translated;
    mic only when target differs from source."""
    sharer = _fake_screen_share_participant("sharer", "en")
    mic_pub = MagicMock()
    mic_pub.kind = _AUDIO_KIND
    mic_pub.muted = False
    mic_pub.track = MagicMock(name="mic")
    mic_pub.track.sid = "mic-1"
    mic_pub.source = rtc.TrackSource.SOURCE_MICROPHONE
    sharer.track_publications["mic-1"] = mic_pub

    listener = _fake_participant("listener", "en", mic_muted=True)
    router = _router_with([sharer, listener])
    sessions = router._compute_desired_sessions()

    # Screen share audio -> translated even to same lang
    assert ("sharer", "ss-aud-1", "en") in sessions
    # Mic audio -> NOT translated to same lang (same-language skip)
    assert ("sharer", "mic-1", "en") not in sessions
