# RC6 beta UX + i18n candidate

Branch: `feature/beta-input-i18n`
Base: `dev`

## Scope

- Fix Phaser DOM overlay alignment so the existing player-name input, Community comment editor, support textarea and report-detail textareas share the same visual coordinate system as the canvas.
- Add persistent `ES / EN` selection in the main menu.
- Default fresh Spanish/Catalan browser locales to Spanish and other locales to English.
- Localise the normal external-tester path: menu, campaign navigation/objectives, control/mechanic onboarding, results/post-hole survey, player profile/support, global survey and Community browse/play/comments/reports.
- Keep campaign geometry, physics, save schema, backend schema and `hole-in-what-beta-rc6` build ID unchanged.

## Root cause of missing fields

The HTML inputs already existed through `this.add.dom(...)`, and Phaser already had `dom.createContainer=true`. CSS was additionally centering/padding `#game` and the canvas while Phaser ScaleManager separately positions its absolute DOM overlay. That made the overlay and canvas disagree spatially, making inputs appear missing/off-screen.

The fix removes the competing parent flex/padding centering and leaves ScaleManager as the single layout authority for canvas + DOM overlay.

## Artificial validation

Normal feature smoke must pass typecheck, build, hole physics, mechanic contracts, authored geometry and persistent-state clearance. No Full Campaign Audit is required because this change is presentation/UI only.

## Required human validation on `dev`

Mobile/touch first, then desktop:

- profile input visible and focusable; keyboard opens; alias can be changed/saved;
- Assistance textarea visible/writable;
- Community comment textarea visible/writable; save + edit work;
- Results and Community report-detail textarea visible/writable;
- no browser `prompt()` appears;
- ES/EN selector changes player-facing UI and survives reload;
- fresh Spanish/Catalan locale defaults ES; fresh other locale defaults EN;
- English onboarding/objectives/results/surveys/Community are understandable;
- HARD preview/spoiler protections remain intact.

DOM visibility/focus is intentionally a human `dev` gate: CI can validate compilation/regressions but cannot prove a real mobile keyboard/focus experience.
