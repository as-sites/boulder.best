# Codex Cloud

Use these files in the Codex cloud environment settings:

- Setup script: `.codex/setup.sh`
- Maintenance script: `.codex/maintenance.sh`

The setup script installs `mise` when missing, persists the `mise` shell activation for the agent phase, self-updates `mise` when supported, installs the tool versions from `mise.toml`, and runs `pnpm install --frozen-lockfile` for workspace dependencies.

The maintenance script is for cached containers. It refreshes `mise` when supported, re-applies the pinned tool versions, and runs a frozen dependency install after Codex checks out the task branch.
