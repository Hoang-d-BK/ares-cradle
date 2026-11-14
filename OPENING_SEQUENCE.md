# Ares Cradle — Opening Sequence

## Narrative purpose

The player should understand why the rover has arrived, what is at stake today, and what action begins play. The opening is a short playable handoff into Sol 1, not a separate lore dump.

## Continuity premise

The automated habitat shell reached Elysium Planitia earlier and entered safe mode after its solar mast was buried in dust. The CRADLE-01 cargo lander now delivers the exploration rover, a reserve battery, and Chipi-Bot. Cadet Leo is the on-site operator. Restoring the solar array turns the dormant shell into the first functioning outpost and starts the 20-sol countdown before Ares-1 arrives.

This reconciles the existing pre-deployed habitat with the new landing scene: the structure exists, but it is not yet a working base.

## Opening beats

| Beat | Player sees/hears | Narrative change | Player action |
| --- | --- | --- | --- |
| 1. Cinematic landing | CRADLE-01 descends through red dust across a few automatic camera shots; short telemetry subtitles carry the scene. | The pre-deployed habitat is dark, and the rover is on the lander. | Watch, or skip. |
| 2. Touchdown and deployment | Engines cut; the dust settles; the ramp opens and the rover is revealed. | Leo has mobility and Chipi-Bot, but the base still has no reliable power. | Continue to the briefing. |
| 3. First objective | One compact card appears after touchdown: restore the solar mast, with only the needed drive and clean controls. | Restoring the array will bring the habitat online and establish the outpost. | Start Sol 1 and drive. |

## Dialogue

- **Earth Command:** “CRADLE-01 is down. The habitat shell is safe, but its solar mast is offline. Leo, bring the rover online.”
- **Chipi-Bot:** “Rover link restored. One clean solar array should wake the base.”
- **Mission directive:** “Drive to the solar mast. Clear the dust. Bring the outpost online before sunset.”

## UI/UX rules

- Let the landing play hands-free like a short video cutscene. Show telemetry/subtitles, letterbox framing, and a visible skip control; do not show gameplay instructions during flight.
- After touchdown, show one compact instruction card for the Sol 1 goal and the controls needed to begin. Skipping the cinematic goes to this same card.
- Use a single persistent primary objective after the handoff. Avoid stacking the story briefing, a tutorial modal, and HUD instructions at once.
- Teach controls at the moment of use: `WASD / arrows` to drive, touch joystick on mobile, `R` to leave the rover near the base.
- Show just the useful starting telemetry (battery, daylight, destination). Reveal oxygen, temperature, and power routing after the player reaches the habitat.
- Respect reduced-motion preferences, keep touch targets at least 44px, and use text/icons with color rather than color alone.

## Handoff and success condition

The player explicitly starts Sol 1 from the post-landing card. The rover becomes controllable and the existing Sol 1 solar-array objective becomes active. The objective remains the first gameplay task; the cinematic establishes its context and gives the player a clear start.
