#!/usr/bin/env bash
# Upgrade mise when installed via curl (Cloud Agents) or apt (local dev VMs).
upgrade_mise() {
  if mise self-update -y --no-plugins 2>/dev/null; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1 &&
    dpkg-query -W -f='${Status}' mise 2>/dev/null | grep -q 'install ok installed'; then
    sudo apt-get update -qq
    sudo apt-get install -y --only-upgrade mise
  fi
}
