#!/usr/bin/env bash
#
# Installs talespire-url-relay and makes it the talespire:// handler.
# The handler is registered under its own name in ~/.config/mimeapps.list,
# so TaleSpire regenerating its broken talespire-scheme-handler.desktop on
# launch doesn't override it.

set -eu

here=$(cd "$(dirname "$0")" && pwd)
bin_dir="$HOME/.local/bin"
apps_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
desktop=demispire-talespire-relay.desktop

install -Dm755 "$here/talespire-url-relay" "$bin_dir/talespire-url-relay"

mkdir -p "$apps_dir"
cat >"$apps_dir/$desktop" <<EOF
[Desktop Entry]
Type=Application
Name=TaleSpire URL Relay (Proton)
NoDisplay=true
StartupNotify=false
MimeType=x-scheme-handler/talespire;
Exec="$bin_dir/talespire-url-relay" %u
EOF

update-desktop-database "$apps_dir" 2>/dev/null || true
xdg-mime default "$desktop" x-scheme-handler/talespire

echo "talespire:// handler: $(xdg-mime query default x-scheme-handler/talespire)"
