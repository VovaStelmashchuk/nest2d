#!/bin/sh

if [ -f /run/secrets/nest2d_discord_token ]; then
  export NUXT_DISCORD_TOKEN="$(cat /run/secrets/nest2d_discord_token)"
fi

if [ -f /run/secrets/nest2d_gmail_app_password ]; then
  export NUXT_GMAIL_APP_PASSWORD="$(cat /run/secrets/nest2d_gmail_app_password)"
fi

exec node .output/server/index.mjs