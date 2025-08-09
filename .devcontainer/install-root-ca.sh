#!/usr/bin/env bash
# You MUST run this script on the host OS, not inside the container.
set -euo pipefail

CA_FILE="certs/ca/rootCA.pem"

if [ ! -f "${CA_FILE}" ]; then
  echo "rootCA.pem Not found. Please start the DevContainer once to generate the certificate."
  exit 1
fi

UNAME=$(uname -s)

echo "[install-root-ca] Detected OS: ${UNAME}"
case "${UNAME}" in
  Linux)
    if command -v update-ca-certificates >/dev/null 2>&1; then
      sudo cp "${CA_FILE}" /usr/local/share/ca-certificates/webtransport-dev.crt
      sudo update-ca-certificates
      echo "[install-root-ca] Installed to system trust (Debian/Ubuntu系)。"
    elif command -v trust >/dev/null 2>&1; then
      sudo trust anchor "${CA_FILE}"
      echo "[install-root-ca] Installed via trust anchor (Fedora系)。"
    else
      echo "You should install ca manually: ${CA_FILE}"
    fi
    ;;
  Darwin)
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${CA_FILE}"
    echo "[install-root-ca] Added to macOS System Keychain."
    ;;
  *)
    if command -v powershell.exe >/dev/null 2>&1; then
      powershell.exe -Command "Start-Process -FilePath 'certutil.exe' -ArgumentList '-addstore','-f','Root','${CA_FILE}' -Verb RunAs"
    else
      echo "You should install ca manually: ${CA_FILE}"
      echo "Or use PowerShell to add it to the Windows Root store:"
      echo "  Start-Process -FilePath 'certutil.exe' -ArgumentList '-addstore','-f','Root','${CA_FILE}' -Verb RunAs"
    fi
    ;;
esac

echo "[install-root-ca] Root CA installed successfully."
