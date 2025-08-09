# syntax=docker/dockerfile:1.4
# check=error=true

ARG USER_UID=1000
ARG USER_GID=1000

FROM --platform=${BUILDPLATFORM:-linux/amd64} mirror.gcr.io/node:lts

ENV DEBIAN_FRONTEND=noninteractive

# Update OS packages to reduce vulnerabilities
RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get update \
  && apt-get full-upgrade -y \
  && npm install -g npm@latest
