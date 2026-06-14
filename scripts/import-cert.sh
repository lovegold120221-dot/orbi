#!/usr/bin/env bash
# Orbit Meeting — Decode macOS signing certificate for electron-builder
# CI sets CSC_LINK + CSC_KEY_PASSWORD; electron-builder handles the rest.
#
# Required env var:
#   MACOS_CERTIFICATE_P12_BASE64  — base64-encoded Developer ID Application .p12
#
# Output: /tmp/certificate.p12 (used by CSC_LINK)
#
# Usage: bash scripts/import-cert.sh

set -euo pipefail

if [[ -z "${MACOS_CERTIFICATE_P12_BASE64:-}" ]]; then
  echo "::warning::MACOS_CERTIFICATE_P12_BASE64 not set — skipping cert import"
  exit 0
fi

echo "$MACOS_CERTIFICATE_P12_BASE64" | base64 --decode > /tmp/certificate.p12

echo "::notice::Certificate decoded to /tmp/certificate.p12"
