#!/usr/bin/env bash
set -euo pipefail

cd "${CODEX_REPO_DIR:-$PWD}"

MISE_BIN="${HOME}/.local/bin/mise"
MISE_SHIMS="${HOME}/.local/share/mise/shims"

if ! command -v mise >/dev/null 2>&1; then
  curl https://mise.run | sh
fi

if [ ! -x "${MISE_BIN}" ] && command -v mise >/dev/null 2>&1; then
  MISE_BIN="$(command -v mise)"
fi

export PATH="${HOME}/.local/bin:${MISE_SHIMS}:${PATH}"
export MISE_EXPERIMENTAL=1
export MISE_YES=1

if [ -x "${MISE_BIN}" ]; then
  eval "$("${MISE_BIN}" activate bash)"
fi

touch "${HOME}/.bashrc"
grep -qxF 'export PATH="${HOME}/.local/bin:${HOME}/.local/share/mise/shims:${PATH}"' "${HOME}/.bashrc" ||
  echo 'export PATH="${HOME}/.local/bin:${HOME}/.local/share/mise/shims:${PATH}"' >>"${HOME}/.bashrc"
grep -qxF 'export MISE_EXPERIMENTAL=1' "${HOME}/.bashrc" ||
  echo 'export MISE_EXPERIMENTAL=1' >>"${HOME}/.bashrc"
grep -qxF 'eval "$(mise activate bash)"' "${HOME}/.bashrc" ||
  echo 'eval "$(mise activate bash)"' >>"${HOME}/.bashrc"

mise trust --yes
sudo apt update && sudo apt install --only-upgrade mise
mise install --yes
pnpm install --frozen-lockfile
