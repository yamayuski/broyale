#!/usr/bin/env bash

set -euo pipefail

CAROOT="${MKCERT_CAROOT:-/certs/ca}"
CERT_DIR="/certs"
CA_LINK="/certs/rootCA.pem"
SERVER_CERT="${CERT_DIR}/localhost.pem"
SERVER_KEY="${CERT_DIR}/localhost-key.pem"

mkdir -p "${CAROOT}"

# Generate root CA if not exists
if [ ! -f "${CAROOT}/rootCA.pem" ]; then
  echo "[gen-certs] Generating root CA (dev only)..."
  # update local trust store, host is later
  MKCERT_CAROOT="${CAROOT}" mkcert -install
fi

# Generate certificate(SAN: localhost / 127.0.0.1 / ::1 / broyale.localhost / *.broyale.localhost)
if [ ! -f "${SERVER_CERT}" ] || [ ! -f "${SERVER_KEY}" ]; then
  echo "[gen-certs] Generating server cert for localhost..."
  MKCERT_CAROOT="${CAROOT}" mkcert \
    -cert-file "${SERVER_CERT}" \
    -key-file "${SERVER_KEY}" \
    localhost 127.0.0.1 ::1 "broyale.localhost" "*.broyale.localhost"
fi

# Change permissions
chmod 600 "${SERVER_KEY}"
chmod 644 "${SERVER_CERT}"

# symbolic link
cp -f "${CAROOT}/rootCA.pem" "${CA_LINK}"

echo "[gen-certs] Root CA: ${CAROOT}/rootCA.pem (shortcut: ${CA_LINK})"
echo "[gen-certs] To export rootCA.pem from host:"
echo "  Option A (devcontainer terminal): devcontainer exec --workspace-folder . cat /certs/rootCA.pem > rootCA.pem"
echo "  Option B (docker run): docker run --rm -v webtransport-certs:/certs busybox cat /certs/rootCA.pem > rootCA.pem"
echo "  Option C (docker cp): docker cp \$(docker ps --filter name=field.broyale.localhost -q):/certs/rootCA.pem ./rootCA.pem"
echo "Then trust it per OS instructions."
