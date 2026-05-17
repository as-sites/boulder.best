# Cursor Cloud Agents

Environment configuration for [Cursor Cloud Agents](https://cursor.com/docs/cloud-agent/setup).

## In-repo configuration

Committed [`.cursor/environment.json`](environment.json) sets the VM **install** (update) command to [`.cursor/maintenance.sh`](maintenance.sh). Cursor runs this from the repository root on each agent start so cached machines refresh tool versions and dependencies after checkout.

## Scripts

| Script                                     | When to use                                                                                                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`.cursor/setup.sh`](setup.sh)             | First-time environment setup (agent-driven setup in the dashboard, or `RUN` in a `.cursor/Dockerfile`). Installs `mise` when missing, persists shell activation, upgrades `mise` via apt when available, installs pinned tools from `mise.toml`, and runs `pnpm install --frozen-lockfile`. |
| [`.cursor/maintenance.sh`](maintenance.sh) | Every agent run via `environment.json` `install`. Re-trusts `mise`, refreshes tools, and reinstalls workspace deps. If `mise` is missing (e.g. snapshot fallback), delegates to `setup.sh`.                                                                                                 |

## Dashboard vs code

1. **Recommended:** Create an environment in [Cloud Agents → Environments](https://cursor.com/dashboard/cloud-agents#environments). During agent-driven setup, run `bash .cursor/setup.sh` once, then save a VM snapshot. Future runs use the committed `environment.json` install hook automatically.
2. **Advanced:** Add a `.cursor/Dockerfile` and reference it from `environment.json` `build.dockerfile`; run `setup.sh` in the image build, keep `install` pointed at `maintenance.sh`.

Resolution order: repo `.cursor/environment.json` overrides personal/team defaults unless you intentionally use a dashboard-only environment without this file.

## Secrets

Add API keys and `.env` values in the Cloud Agents **Secrets** tab (or environment-scoped secrets). Do not commit credentials. See [environment variables and secrets](https://cursor.com/docs/cloud-agent/setup#environment-variables-and-secrets).

## Parity with Codex

| Codex                                     | Cursor                                                                |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `.codex/setup.sh`                         | `.cursor/setup.sh`                                                    |
| `.codex/maintenance.sh`                   | `.cursor/maintenance.sh` (referenced by `environment.json` `install`) |
| Dashboard setup/maintenance script fields | `environment.json` + optional snapshot / Dockerfile                   |
