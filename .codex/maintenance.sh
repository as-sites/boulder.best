#!/usr/bin/env bash
set -euo pipefail

cd "${CODEX_REPO_DIR:-$PWD}"

export PATH="${HOME}/.local/bin:${HOME}/.local/share/mise/shims:${PATH}"
export MISE_EXPERIMENTAL=1
export MISE_YES=1

if command -v mise >/dev/null 2>&1; then
  eval "$(mise activate bash)"
fi

mise trust --yes
mise self-update --yes || echo "mise self-update skipped; continuing with installed mise"
mise install --yes
pnpm install --frozen-lockfile
