# Repository rename — 2026-08-29

The repository was renamed from `troll-golf` to `hole-in-what` before the Reddit beta wave.

## Compatibility

- GitHub Pages now builds with a repository-aware Vite base path and should publish at `https://papimatcoding.github.io/hole-in-what/`.
- Legacy `troll-golf-*` localStorage keys remain intentionally unchanged to preserve anonymous tester identity, progression, surveys, attempts and community drafts.
- Product name remains **Hole in What?**.

This commit intentionally triggers the first post-rename `dev` CI/Pages run so the new public path can be validated before it is shared externally.
