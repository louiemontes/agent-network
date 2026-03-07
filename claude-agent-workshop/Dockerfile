FROM node:20-slim

# Install Claude Code globally + git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g @anthropic-ai/claude-code

# Bake in git identity — commits show as this user only, no co-author trace
ENV GIT_AUTHOR_NAME="Alexander Wu"
ENV GIT_AUTHOR_EMAIL="alexallwins@gmail.com"
ENV GIT_COMMITTER_NAME="Alexander Wu"
ENV GIT_COMMITTER_EMAIL="alexallwins@gmail.com"

# Create a non-root user (claude-code refuses to run as root with --dangerously-skip-permissions)
RUN useradd -m -s /bin/bash agent

# Create workspace mount point and give the user ownership
RUN mkdir -p /workspace && chown agent:agent /workspace

# MCP config MUST live at ~/.claude.json
COPY claude.json /home/agent/.claude.json
RUN chown agent:agent /home/agent/.claude.json

# Entrypoint script to wire GitHub token into git credential store at runtime
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER agent
WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]