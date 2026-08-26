# Troll Golf — Level design rules

The campaign is authored by humans. Procedural generation is a prototyping tool only.

## Acceptance gate
A hole does not enter the player-facing campaign until it passes all of these:

1. **Unique silhouette** — it must not be a mirror/rotation/re-skin of another campaign hole.
2. **Unique strategic question** — the player should need a different idea, not merely the same shot with a different modifier.
3. **Purposeful objects** — every obstacle/mechanic must change route, power, angle, timing, risk or setup. Decorative gameplay objects are removed.
4. **No invalid overlaps** — walls, voids, surfaces, portals, ramps and other mechanics may touch only when the interaction is intentionally designed and tested.
5. **Readable first attempt** — the intended problem can be understood visually. HARD may deceive, but its trap must make sense after discovery.
6. **Difficulty band** — difficulty is evaluated with best strokes, robustness, number of decisions and manual playtesting. Solver stroke count alone never defines difficulty.
7. **Mastery is allowed** — a clever HIO/shortcut may survive if it is deliberate, narrow and uses the level's idea. Wide accidental bypasses are redesigned.
8. **Manual approval** — solver/audits can reject or flag a hole, but they cannot approve it by themselves.

## Campaign pacing
- Classic 01–03: immediate satisfaction and learn the shot; HIO is expected.
- Classic 04–10: geometry, setup, alternative routes; difficulty climbs toward a chapter exam.
- New mechanics get breathing room: introduction -> practice -> combination -> exam.
- HARD is not Classic plus more walls. Each hole creates an expectation, breaks it with a learnable troll, then asks for a stronger execution after discovery.

## Beta workflow
1. Design/edit a draft in Beta Lab.
2. Playtest repeatedly on mobile.
3. Export JSON.
4. Run physics/course/originality audits.
5. Collect beta feedback.
6. Iterate the individual hole.
7. Only then move it into the campaign source.

The target is not 80 green audit lines. The target is a campaign where players want to play one more hole.
