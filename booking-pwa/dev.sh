#!/usr/bin/env bash
# Run from WSL:  bash dev.sh
# Or from Windows: wsl.exe -e bash ~/dev/projects/booking-tracker/booking-pwa/dev.sh
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "Starting dev server at http://localhost:5173"
"$HOME/.bun/bin/bun" run dev -- --host 0.0.0.0 --port 5173
