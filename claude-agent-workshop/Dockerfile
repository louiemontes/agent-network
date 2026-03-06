FROM node:20-slim

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create workspace mount point
RUN mkdir -p /workspace

# Drop in the MCP config so Claude Code auto-connects to the gateway
RUN mkdir -p /root/.claude
COPY mcp_config.json /root/.claude/mcp_config.json

WORKDIR /workspace

CMD ["bash"]
