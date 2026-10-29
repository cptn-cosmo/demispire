# Demispire

Firefox extension that watches Daggerheart character sheets on Demiplane
(`app.demiplane.com/nexus/*/character-sheet/*`) for roll results and replays
them in TaleSpire through its `talespire://dice/` link scheme.

Demiplane saves each sheet's last few rolls in the page's localStorage under
`<characterId>-dice-history` (newest first, with every die tagged `hope`,
`fear`, `advantage`, …). The content script polls that key and forwards each
new entry:

| Demiplane roll                    | TaleSpire link                                               |
| --------------------------------- | ------------------------------------------------------------ |
| Agility +1                        | `talespire://dice/Hope:1d12/Fear:1d12/Agility:0d6+1`         |
| Agility +1 with advantage         | `talespire://dice/Hope:1d12/Fear:1d12/Agility:1d6+1`         |
| Presence −1 with disadvantage     | `talespire://dice/Hope:1d12/Fear:1d12/Presence:-1d6-1`       |
| Strength +0                       | `talespire://dice/Hope:1d12/Fear:1d12/Strength:0d6+0`        |
| Improved Hand Runes damage 2d10+3 | `talespire://dice/Improved%20Hand%20Runes:2d10+3`            |

TaleSpire rolls its own dice; the result Demiplane rolled is only shown in the
on-page toast. TaleSpire's dice links can't carry a total or outcome, so the
`symbiote/` folder holds a small TaleSpire Symbiote that announces both in chat:

> Agility: 12, With Hope (Hope 7, Fear 4, Agility +1)

It reacts to any roll with exactly one `Hope` and one `Fear` group, and only
on the roller's client, so the message isn't posted once per player. GM-only
rolls are announced to GMs only.

To install it, copy `symbiote/` into TaleSpire's Symbiotes folder
(`%AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\Demispire`;
`linux/install.sh` does this for Proton). Then enable Symbiotes in TaleSpire's
settings and start **Demispire Duality** from the Symbiotes panel.

## Install (development)

1. Open `about:debugging#/runtime/this-firefox` and choose **Load Temporary Add-on…**.
2. Select `manifest.json`.
3. Click the toolbar icon. **Dry run** is on by default, so rolls show a toast
   with the link but don't launch TaleSpire. Turn it off to send rolls.
4. The first time a link is sent, Firefox asks whether to open TaleSpire.
   Tick **Always allow** for app.demiplane.com.

### Linux with TaleSpire under Proton

TaleSpire registers its `talespire://` handler from inside Proton, so the
`.desktop` file it writes points at a Windows path (`S:/steamapps/...`) and
nothing happens when Firefox opens a link. Its relay script also looks for
`bin/wine64`, which newer Proton builds don't ship. Run:

```sh
linux/install.sh
```

This installs `~/.local/bin/talespire-url-relay` and makes it the
`talespire://` handler. TaleSpire needs to be running for rolls to arrive.
The last relay run is logged to `~/.cache/talespire-url-relay.log`.

**Debug logging** in the popup prints each raw history entry and its parsed
form to the page console.

## Tests

```sh
node --test test/
```
