FROM node:20-slim

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create a non-root user (claude-code refuses to run as root with --dangerously-skip-permissions)
RUN useradd -m -s /bin/bash agent

# Create workspace mount point and give the user ownership
RUN mkdir -p /workspace && chown agent:agent /workspace

# MCP config MUST live at ~/.claude.json — the ~/.claude/ directory is silently ignored
COPY claude.json /home/agent/.claude.json
RUN chown agent:agent /home/agent/.claude.json

USER agent
WORKDIR /workspace

CMD ["bash"]