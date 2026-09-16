#!/bin/sh
set -eu

# 🚀 Starting Documenso...
printf "🚀 Starting Documenso...\n\n"

# 🔐 Check certificate configuration
printf "🔐 Checking certificate configuration...\n"

CERT_PATH="${NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH:-/opt/documenso/cert.p12}"

if [ -n "${NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS:-}" ]; then
    printf "✅ Signing certificate supplied through environment\n"
elif [ -f "$CERT_PATH" ] && [ -r "$CERT_PATH" ]; then
    printf "✅ Certificate file found and readable - document signing is ready!\n"
else
    printf "Signing certificate is required for this instance\n" >&2
    exit 1
fi

printf "🗄️  Running database migrations...\n"
npx prisma migrate deploy --schema ../../packages/prisma/schema.prisma

printf "🌟 Starting Documenso server...\n"
HOSTNAME=0.0.0.0 exec node build/server/main.js
