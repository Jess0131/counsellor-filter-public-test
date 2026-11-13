#!/usr/bin/env bash
# Run from repo root before git push. Confirms personal account isolation.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Not a git repository."
  exit 1
}
cd "$ROOT"

if [[ "$ROOT" == *"/GS"* ]] || [[ "$ROOT" == *"/GS/"* ]]; then
  echo "ERROR: This script is for the personal public-test repo only."
  exit 1
fi

echo "=== Local commit identity (this repo only) ==="
git config --local user.name
git config --local user.email

echo ""
echo "=== HTTPS username hint (this repo only) ==="
git config --local credential.https://github.com.username || echo "(not set)"

echo ""
echo "=== SSH command (this repo only) ==="
git config --local core.sshCommand || echo "(not set)"

echo ""
echo "=== Remotes ==="
if git remote | grep -q .; then
  git remote -v
else
  echo "(no remote yet — OK before first push)"
fi

echo ""
echo "=== GitHub SSH identity (Jess0131 key) ==="
SSH_CMD=$(git config --local core.sshCommand)
# shellcheck disable=SC2086
if [[ -n "${SSH_CMD:-}" ]]; then
  eval "$SSH_CMD -T git@github.com" 2>&1 || true
else
  echo "No core.sshCommand set."
fi

echo ""
echo "=== Active gh CLI account (informational; may still be company) ==="
if command -v gh >/dev/null 2>&1; then
  gh auth status 2>&1 || true
  echo "Note: pushes from this repo use SSH + local config, not necessarily the active gh account."
else
  echo "gh not installed."
fi

echo ""
echo "=== GS connection check ==="
if git log --oneline 2>/dev/null | head -1 | grep -qi greenshield; then
  echo "WARN: commit messages mention GreenShield."
else
  echo "No GreenShield refs in recent commit subjects (or no commits yet)."
fi
