#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${CURSOR_REPO_DIR:-${REPO_ROOT}}"

export PATH="${HOME}/.local/bin:${PATH}"
export MISE_EXPERIMENTAL=1
export MISE_YES=1

if command -v mise >/dev/null 2>&1; then
  eval "$(mise activate bash)"
else
  exec bash "${SCRIPT_DIR}/setup.sh"
fi

mise trust --yes
# shellcheck source=mise-upgrade.sh
source "${SCRIPT_DIR}/mise-upgrade.sh"
upgrade_mise
mise install --yes
mise deps
