# Demispire

Roll your Daggerheart dice from a [Demiplane](https://app.demiplane.com)
character sheet and have them land in [TaleSpire](https://talespire.com), with
the total and outcome announced in chat:

> **Improved Hand Runes**  
> Hope 4 + Fear 4 + 3  
> **11 Critical Success**

Hope is shown in gold, Fear in purple, and the outcome in the matching color
(mint green for Critical Success).

## You need both parts

Demispire has two halves, and rolls only work end to end with both installed:

| Part | Where it runs | What it does |
| --- | --- | --- |
| **Firefox extension** (repo root) | Firefox, on Demiplane | Notices each roll you make on a Daggerheart character sheet and sends it to TaleSpire. |
| **Demispire Duality Symbiote** (`symbiote/`) | Inside TaleSpire | Rolls the dice it receives, hides TaleSpire's own result for duality rolls, and posts the total with With Hope / With Fear / Critical Success to chat. |

Without the Symbiote, rolls sent by the extension go nowhere. If you can't run
it, untick **Roll through Symbiote** in the extension's popup to fall back to
plain `talespire://dice/` links: TaleSpire then shows its normal roll result,
with no total or outcome announcement.

## Install

### 1. Firefox extension

Install Demispire from addons.mozilla.org, or for development open
`about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on…**
and select `manifest.json`. Requires Firefox 140 or newer.

The first time a roll is sent, Firefox asks whether to open TaleSpire. Tick
**Always allow** for app.demiplane.com.

### 2. TaleSpire Symbiote

1. In TaleSpire's settings, enable Symbiotes.
2. Copy the `symbiote/` folder to TaleSpire's Symbiotes folder as
   `Symbiotes\Demispire` (**Open Symbiotes Directory** in the Symbiote panel
   takes you there; on Windows it is
   `%AppData%\..\LocalLow\BouncyRock Entertainment\TaleSpire\Symbiotes\`).
3. Start **Demispire Duality** from the Symbiotes panel and keep it running
   while you play.

### Linux with TaleSpire under Proton

TaleSpire registers its `talespire://` handler from inside Proton, so the
`.desktop` file it writes points at a Windows path (`S:/steamapps/...`) and
nothing happens when Firefox opens a link. Its relay script also looks for
`bin/wine64`, which newer Proton builds don't ship. Run:

```sh
linux/install.sh
```

This installs `~/.local/bin/talespire-url-relay`, makes it the
`talespire://` handler, and copies the Symbiote into the game's Proton prefix.
The last relay run is logged to `~/.cache/talespire-url-relay.log`.

## How it works

Demiplane saves each sheet's last few rolls in the page's localStorage under
`<characterId>-dice-history` (newest first, with every die tagged `hope`,
`fear`, `advantage`, …). The extension polls that key and sends each new roll
to the Symbiote's URL, `talespire://symbiote/AQDNSujbTp2_TJziv9464Asa/`, which
TaleSpire derives from the interop id in `symbiote/manifest.json`:

| Demiplane roll                    | Sent after the prefix                          |
| --------------------------------- | ---------------------------------------------- |
| Agility +1                        | `Hope:1d12/Fear:1d12/Agility:0d6+1`            |
| Agility +1 with advantage         | `Hope:1d12/Fear:1d12/Agility:1d6+1`            |
| Presence −1 with disadvantage     | `Hope:1d12/Fear:1d12/Presence:-1d6-1`          |
| Strength +0                       | `Hope:1d12/Fear:1d12/Strength:0d6+0`           |
| Improved Hand Runes damage 2d10+3 | `Improved%20Hand%20Runes:2d10+3`               |

TaleSpire rolls its own dice; the result Demiplane rolled is only shown in the
on-page toast. TaleSpire only accepts constants as a suffix on a die term,
which is why bare modifiers ride on `0d6`.

The Symbiote hides TaleSpire's result only for duality rolls (exactly one
`Hope` and one `Fear` group), since those get its announcement; damage rolls
show TaleSpire's normal result. Players don't see hidden results; GMs get an
indicator they can click to reveal them. Only the roller's client posts the
announcement, so it isn't repeated once per player, and GM-only rolls are
announced to GMs only. TaleSpire's Symbiote API has no way to clear dice, so
rolled dice stay on the table until removed in-game.

The extension's popup also has **Dry run** (show the link in a toast instead
of sending it) and **Debug logging** (print each roll to the page console).

## Development

```sh
node --test test/      # unit tests
npx web-ext lint       # validate the extension
npx web-ext build      # package it to web-ext-artifacts/ for AMO
(cd symbiote && python3 -m zipfile -c ../web-ext-artifacts/demispire-symbiote-0.2.0.zip *)   # package the Symbiote
```

## License

[MIT](LICENSE)
