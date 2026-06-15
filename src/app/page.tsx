"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type ActivePanel = "join" | "schedule";

interface ScheduledMeeting {
  id: string;
  title: string;
  time: string;
  link: string;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [creating, setCreating] = useState(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  
  const [activePanel, setActivePanel] = useState<ActivePanel>("join");
  const [joinValue, setJoinValue] = useState("");
  const [joinError, setJoinError] = useState("");
  
  // Schedule form states
  const [scheduleTitle, setScheduleTitle] = useState("Orbit Meeting");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [schedulePeriod, setSchedulePeriod] = useState<"AM" | "PM">("PM");
  const [scheduledLink, setScheduledLink] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Persistent meetings states
  const [upcomingMeetings, setUpcomingMeetings] = useState<ScheduledMeeting[]>([]);
  const [tick, setTick] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const { profile, updateProfile } = useUser();
  const theme = profile?.theme || "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Load default schedule values and persistent meetings on client mount
  useEffect(() => {
    setIsMounted(true);
    const defaultDateTime = getDefaultScheduleTime(); // "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = defaultDateTime.split("T");
    const [initialHour24, initialMinute] = timePart.split(":");

    const initialHour = parseInt(initialHour24, 10);
    const initialPeriod = initialHour >= 12 ? "PM" : "AM";
    const hour12Val = initialHour % 12 === 0 ? 12 : initialHour % 12;
    const initialHour12 = String(hour12Val).padStart(2, "0");

    const minNum = parseInt(initialMinute, 10);
    const roundedMin = Math.round(minNum / 5) * 5;
    const initialMinuteRounded = String(roundedMin === 60 ? 55 : roundedMin).padStart(2, "0");

    setScheduleDate(datePart);
    setScheduleHour(initialHour12);
    setScheduleMinute(initialMinuteRounded);
    setSchedulePeriod(initialPeriod);
    
    loadUpcomingMeetings();
  }, []);

  // Update countdown display every 30 seconds
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Redirect unauthenticated users to the login page.
  // Skip redirect if Supabase isn't configured (anonymous usage).
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setAuthCheckDone(true);
      return;
    }
    if (authLoading) return;
    setAuthCheckDone(true);
    if (!user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  function loadUpcomingMeetings() {
    try {
      const existing = window.localStorage.getItem("orbit.scheduled_meetings");
      if (!existing) {
        setUpcomingMeetings([]);
        return;
      }
      const list = JSON.parse(existing);
      
      const now = Date.now();
      const fortyEightHoursFromNow = now + 48 * 60 * 60 * 1000;
      const oneHourAgo = now - 1 * 60 * 60 * 1000; // Keep visible for 1h after starting
      
      const filtered = list.filter((m: ScheduledMeeting) => {
        const mTime = new Date(m.time).getTime();
        return mTime >= oneHourAgo && mTime <= fortyEightHoursFromNow;
      });
      
      filtered.sort((a: ScheduledMeeting, b: ScheduledMeeting) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setUpcomingMeetings(filtered);
    } catch (err) {
      console.error("Error loading upcoming meetings:", err);
    }
  }

  function deleteMeeting(id: string) {
    try {
      const existing = window.localStorage.getItem("orbit.scheduled_meetings");
      if (!existing) return;
      const list = JSON.parse(existing);
      const updated = list.filter((m: ScheduledMeeting) => m.id !== id);
      window.localStorage.setItem("orbit.scheduled_meetings", JSON.stringify(updated));
      loadUpcomingMeetings();
    } catch (err) {
      console.error("Error deleting meeting:", err);
    }
  }

  // Show nothing while auth state is loading or redirecting.
  if (!authCheckDone) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">Orbit Meeting</h1>
        </div>
      </main>
    );
  }
  if (!user && process.env.NEXT_PUBLIC_SUPABASE_URL) return null; // Redirecting

  function createSession() {
    setCreating(true);
    const sessionId = crypto.randomUUID();
    window.sessionStorage.setItem("orbitHostRoom", sessionId);
    router.push(`/session/${sessionId}`);
  }

  function parseMeetingId(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      const sessionIndex = parts.indexOf("session");
      if (sessionIndex !== -1 && parts[sessionIndex + 1]) {
        return parts[sessionIndex + 1];
      }
    } catch {
      // Plain room names are handled below.
    }

    return trimmed
      .replace(/^\/+|\/+$/g, "")
      .replace(/^session\//, "")
      .replace(/\/room$/, "");
  }

  function joinMeeting() {
    const meetingId = parseMeetingId(joinValue);
    if (!meetingId) {
      setJoinError("Enter a meeting link or meeting ID.");
      return;
    }
    setJoinError("");
    router.push(`/session/${encodeURIComponent(meetingId)}`);
  }

  function showSchedulePanel() {
    setActivePanel("schedule");
    setCopied(false);
    setIsScheduled(false);
    setScheduledLink(`${window.location.origin}/session/${crypto.randomUUID()}`);
  }

  // Computes the combined 24-hour scheduleTime
  const scheduleTime = (() => {
    if (!scheduleDate) return "";
    const hour24 = (() => {
      const hr = parseInt(scheduleHour, 10);
      if (schedulePeriod === "PM") {
        return hr === 12 ? 12 : hr + 12;
      } else {
        return hr === 12 ? 0 : hr;
      }
    })();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${scheduleDate}T${pad(hour24)}:${scheduleMinute}`;
  })();

  function saveAndScheduleMeeting() {
    if (!scheduleTime) return;
    
    const newMeeting: ScheduledMeeting = {
      id: crypto.randomUUID(),
      title: scheduleTitle.trim() || "Orbit Meeting",
      time: scheduleTime,
      link: scheduledLink,
    };

    try {
      const existing = window.localStorage.getItem("orbit.scheduled_meetings");
      const list = existing ? JSON.parse(existing) : [];
      list.push(newMeeting);
      window.localStorage.setItem("orbit.scheduled_meetings", JSON.stringify(list));
      
      setIsScheduled(true);
      loadUpcomingMeetings();
    } catch (err) {
      console.error("Error scheduling meeting:", err);
    }
  }

  async function copyScheduleLink() {
    if (!scheduledLink) return;
    await navigator.clipboard.writeText(scheduledLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleTheme() {
    updateProfile({ theme: theme === "dark" ? "light" : "dark" });
  }

  // Prefilled share handlers
  function shareViaMail() {
    const subject = `Orbit Meeting Invitation: ${scheduleTitle}`;
    const body = `You are invited to join an Orbit Meeting.\n\nTopic: ${scheduleTitle}\nTime: ${formatScheduleTime(scheduleTime)}\nJoin Link: ${scheduledLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function shareViaGmail() {
    const subject = `Orbit Meeting Invitation: ${scheduleTitle}`;
    const body = `You are invited to join an Orbit Meeting.\n\nTopic: ${scheduleTitle}\nTime: ${formatScheduleTime(scheduleTime)}\nJoin Link: ${scheduledLink}`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareViaWhatsApp() {
    const text = `*Orbit Meeting Invitation*\n*Topic:* ${scheduleTitle}\n*Time:* ${formatScheduleTime(scheduleTime)}\n*Join Link:* ${scheduledLink}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function downloadIcsFile() {
    const date = new Date(scheduleTime);
    if (Number.isNaN(date.getTime())) return;
    
    const startStr = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const endDate = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration
    const endStr = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Orbit Meeting//NONSGML Event//EN",
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${scheduleTitle}`,
      `DESCRIPTION:Join Orbit Meeting: ${scheduledLink}`,
      `URL;VALUE=URI:${scheduledLink}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${scheduleTitle.replace(/\s+/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getCountdownText(targetTimeStr: string) {
    const now = Date.now();
    const target = new Date(targetTimeStr).getTime();
    const diff = target - now;
    
    if (diff < 0) {
      const minsAgo = Math.floor(Math.abs(diff) / (60 * 1000));
      if (minsAgo < 60) {
        return `Started ${minsAgo}m ago`;
      } else {
        return `Started`;
      }
    }
    
    const totalMins = Math.floor(diff / (60 * 1000));
    if (totalMins < 60) {
      return `Starts in ${totalMins}m`;
    }
    
    const totalHours = Math.floor(totalMins / 60);
    const remainingMins = totalMins % 60;
    if (totalHours < 24) {
      return `Starts in ${totalHours}h ${remainingMins}m`;
    }
    
    const totalDays = Math.floor(totalHours / 24);
    return `Starts in ${totalDays}d`;
  }

  return (
    <main className="entry-shell" data-theme={theme}>
      {/* Top Sticky Navigation Bar */}
      <header className="entry-navbar">
        <Link href="/" className="entry-navbar-brand">
          <img src="/icon-eburon.svg" alt="Eburon AI" className="entry-brand-logo" />
          <span>Orbit Meeting</span>
        </Link>
        <div className="entry-navbar-right">
          <div className="entry-navbar-user">
            <button
              className="entry-navbar-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <Link href="/settings" className="entry-navbar-btn">
              Settings
            </Link>
            {user ? (
              <>
                <span className="entry-navbar-email" title={user.email ?? ""}>{user.email}</span>
                <button className="entry-navbar-btn" onClick={() => signOut()}>Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="entry-navbar-btn">Sign in</Link>
                <Link href="/auth/signup" className="entry-navbar-btn">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content Area */}
      <div className="entry-main-container">
        <div className="entry-grid">
          <div className="entry-main-column">
            {/* Action Deck */}
            <section className="entry-actions" aria-label="Meeting actions">
              <button
                className="meeting-action meeting-action--create"
                onClick={createSession}
                disabled={creating}
                id="create-session-btn"
                aria-pressed={false}
              >
                <span className="meeting-action-icon" aria-hidden>
                  <VideoPlusIcon />
                </span>
                <span>{creating ? "Creating..." : "Create"}</span>
              </button>

              <button
                className={`meeting-action meeting-action--join`}
                onClick={() => {
                  setActivePanel("join");
                  setJoinError("");
                }}
                aria-pressed={activePanel === "join"}
              >
                <span className="meeting-action-icon" aria-hidden>
                  <JoinIcon />
                </span>
                <span>Join</span>
              </button>

              <button
                className={`meeting-action meeting-action--schedule`}
                onClick={showSchedulePanel}
                aria-pressed={activePanel === "schedule"}
              >
                <span className="meeting-action-icon" aria-hidden>
                  <CalendarIcon />
                </span>
                <span>Schedule meeting</span>
              </button>
            </section>

            {/* Interactive Panel */}
            <section className="entry-panel" aria-live="polite">
              {activePanel === "join" ? (
                <form
                  className="entry-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    joinMeeting();
                  }}
                >
                  <div>
                    <p className="entry-panel-eyebrow">Join meeting</p>
                    <h2>Enter a meeting link or ID</h2>
                  </div>
                  <label className="entry-field">
                    <span>Meeting link or ID</span>
                    <input
                      value={joinValue}
                      onChange={(event) => {
                        setJoinValue(event.target.value);
                        setJoinError("");
                      }}
                      placeholder="https://.../session/room-id"
                      autoComplete="off"
                    />
                  </label>
                  {joinError && <p className="entry-error">{joinError}</p>}
                  <button className="entry-primary" type="submit">
                    Join meeting
                  </button>
                </form>
              ) : (
                <div className="entry-form">
                  <div>
                    <p className="entry-panel-eyebrow">Schedule meeting</p>
                    <h2>Create an invite link</h2>
                  </div>
                  <label className="entry-field">
                    <span>Topic</span>
                    <input
                      value={scheduleTitle}
                      onChange={(event) => setScheduleTitle(event.target.value)}
                      maxLength={60}
                    />
                  </label>
                  
                  <div className="schedule-date-time-row">
                    <label className="entry-field">
                      <span>Date</span>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(event) => setScheduleDate(event.target.value)}
                      />
                    </label>
                    
                    <div className="entry-field">
                      <span>Time</span>
                      <div className="time-select-container">
                        <select
                          value={scheduleHour}
                          onChange={(e) => setScheduleHour(e.target.value)}
                          className="time-select-dropdown"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="time-select-separator">:</span>
                        <select
                          value={scheduleMinute}
                          onChange={(e) => setScheduleMinute(e.target.value)}
                          className="time-select-dropdown"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="time-period-toggle"
                          onClick={() => setSchedulePeriod(prev => prev === "AM" ? "PM" : "AM")}
                        >
                          {schedulePeriod}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    className="entry-primary"
                    type="button"
                    onClick={saveAndScheduleMeeting}
                  >
                    Schedule Meeting
                  </button>
                  
                  {isScheduled && scheduledLink && (
                    <div className="schedule-invite-section">
                      <div className="schedule-link">
                        <span>{scheduledLink}</span>
                      </div>
                      <button
                        className="entry-secondary-btn"
                        type="button"
                        onClick={copyScheduleLink}
                      >
                        {copied ? "Copied!" : "Copy Link"}
                      </button>
                      <div className="schedule-invite-label">Share invitation</div>
                      <div className="schedule-invite-bar">
                        <button onClick={shareViaMail} title="Share via Email" className="share-btn">
                          <MailIcon />
                        </button>
                        <button onClick={shareViaGmail} title="Share via Gmail Web" className="share-btn">
                          <GmailIcon />
                        </button>
                        <button onClick={shareViaWhatsApp} title="Share via WhatsApp" className="share-btn">
                          <WhatsAppIcon />
                        </button>
                        <button onClick={downloadIcsFile} title="Export Calendar (.ics)" className="share-btn">
                          <CalendarPlusIcon />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Upcoming Meetings Sidebar */}
          <aside className="entry-upcoming" aria-label="Upcoming meetings">
            <div>
              <p className="entry-panel-eyebrow">Next up</p>
              <h2>Upcoming Meetings</h2>
            </div>
            
            {upcomingMeetings.length === 0 ? (
              <div className="upcoming-empty">
                <p>No upcoming meetings scheduled within 48 hours.</p>
                <p className="upcoming-subtext">Create a room now or schedule a meeting to get started.</p>
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="upcoming-item">
                    <div className="upcoming-item-info">
                      <h3 className="upcoming-item-title">{meeting.title}</h3>
                      <p className="upcoming-item-time">{formatScheduleTime(meeting.time)}</p>
                      <p className="upcoming-item-countdown">{getCountdownText(meeting.time)}</p>
                    </div>
                    <div className="upcoming-item-actions">
                      <button
                        onClick={() => router.push(meeting.link)}
                        className="upcoming-join-btn"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => deleteMeeting(meeting.id)}
                        className="upcoming-delete-btn"
                        title="Delete meeting"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function getDefaultScheduleTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);
  date.setSeconds(0, 0);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatScheduleTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function VideoPlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h7A2.5 2.5 0 0 1 16 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 4 16.5z" />
      <path d="m16 10 4-2.5v9L16 14" />
      <path d="M10 9v6" />
      <path d="M7 12h6" />
    </svg>
  );
}

function JoinIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h11" />
      <path d="m11 8 4 4-4 4" />
      <path d="M15 5h2.5A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5H15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4.5 8.5h15" />
      <path
        d="M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5z"
      />
      <path d="M9 13h6" />
      <path d="M9 16h3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4H2v16h20V4z" />
      <path d="M22 4L12 13 2 4" />
      <path d="M2 20l7-7" />
      <path d="M22 20l-7-7" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CalendarPlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
