#!/bin/bash

# from https://github.com/denoland/deno/blob/main/tests/testdata/tls/README.md

set -eux

if ! command -v openssl > /dev/null; then
  echo "You need to install openssl"
  exit 1
fi

if [ ! -f RootCA.pem ]; then
  # Generate EC parameters
  openssl genpkey -genparam -algorithm EC -pkeyopt ec_paramgen_curve:secp384r1 -out EC-PARAM.pem

  # Generate RootCA
  openssl req -x509 -nodes -new -sha256 -days 1024 -newkey ec:EC-PARAM.pem -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=Example-Root-CA"

  # Generate crt
  openssl x509 -outform pem -in RootCA.pem -out RootCA.crt

  # Generate key
  openssl req -new -nodes -newkey ec:EC-PARAM.pem -keyout localhost.key -out localhost.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=localhost"

  # Generate crt for localhost
  openssl x509 -req -sha256 -days 1024 -in localhost.csr -CA RootCA.pem -CAkey RootCA.key -CAcreateserial -extfile domains.ext -out localhost.crt
fi

# Install RootCA to host

UNAME=$(uname -s)
CA_FILE="${PWD}/RootCA.pem"

if [ -f /.dockerenv ]; then
  echo "You are in a Docker container. You should install the Root CA to host machine."
  exit 1
fi

case "${UNAME}" in
  Linux)
    if command -v powershell.exe >/dev/null 2>&1; then
      # on WSL2
      echo "Install from WSL2 to Windows Root CA store"
      powershell.exe -Command "Start-Process -FilePath 'certutil.exe' -ArgumentList '-addstore','-f','Root','${CA_FILE}' -Verb RunAs"
    elif command -v update-ca-certificates >/dev/null 2>&1; then
      echo "Install to Debian/Ubuntu"
      sudo cp "${CA_FILE}" /usr/local/share/ca-certificates/broyale-webtransport.crt
      sudo update-ca-certificates
      echo "[install-root-ca] Installed to system trust (Debian/Ubuntu)。"
    elif command -v trust >/dev/null 2>&1; then
      echo "Install to Fedora"
      sudo trust anchor "${CA_FILE}"
      echo "[install-root-ca] Installed via trust anchor (Fedora)。"
    else
      echo "You should install ca manually: ${CA_FILE}"
      exit 1
    fi
    ;;
  Darwin)
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${CA_FILE}"
    echo "[install-root-ca] Added to macOS System Keychain."
    ;;
  *)
    echo "You should install ca manually: ${CA_FILE}"
    exit 1
    ;;
esac

echo "[install-root-ca] Root CA installed successfully."
