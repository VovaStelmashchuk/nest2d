#!/bin/sh

if [ -f /run/secrets/discord_token ]; then
  export NUXT_DISCORD_TOKEN="$(cat /run/secrets/discord_token)"
fi

if [ -f /run/secrets/gmail_app_password ]; then
  export NUXT_GMAIL_APP_PASSWORD="$(cat /run/secrets/gmail_app_password)"
fi

if [ -f /run/secrets/mongo_uri ]; then
  export NUXT_MONGO_URI="$(cat /run/secrets/mongo_uri)"
fi

exec node .output/server/index.mjs