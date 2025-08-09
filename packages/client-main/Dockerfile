# syntax=docker/dockerfile:1.4
# check=error=true

# @link https://hub.docker.com/r/denoland/deno
ARG DENO_VERSION=2.4.3

FROM --platform=${BUILDPLATFORM:-linux/amd64} mirror.gcr.io/denoland/deno:debian-${DENO_VERSION} AS development

WORKDIR /app
USER deno

VOLUME [ "/app" ]

ENV DENO_ENV=development

CMD [ "run", "--unstable-net", "--allow-net", "--watch", "main.ts" ]

FROM --platform=${BUILDPLATFORM:-linux/amd64} mirror.gcr.io/denoland/deno:debian-${DENO_VERSION} AS builder

WORKDIR /app
USER deno

ENV DENO_ENV=production

COPY deps.ts .
RUN deno install --entrypoint deps.ts
COPY . .
RUN deno cache main.ts

FROM --platform=${BUILDPLATFORM:-linux/amd64} mirror.gcr.io/denoland/deno:bin-${DENO_VERSION} AS production

WORKDIR /app
USER deno

ENV DENO_ENV=production

COPY --from=builder /app .

CMD [ "run", "--unstable-net", "--allow-net", "main.ts" ]
