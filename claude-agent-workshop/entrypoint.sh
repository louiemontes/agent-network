#!/bin/bash
set -e

if [ -n "$AGENT_GITHUB_TOKEN" ]; then
  git config --global credential.helper store
  echo "https://oauth2:${AGENT_GITHUB_TOKEN}@github.com" > /home/agent/.git-credentials
  chmod 600 /home/agent/.git-credentials
fi

exec "$@"