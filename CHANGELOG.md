# Changelog

What changed in the rubric and around it, newest first. Dependency and pin-bump pull requests are
left out.

## Versioning

There are no releases and no tags. An adopter copies `rubric.md` as it stands on `main` and edits
the copy, so the commit they copied from is the version; this log names the pull requests since.

## November 2026

- The OpenSSF Best Practices badge, at the passing level, is shown in the README (#9).
- A contributing guide and this changelog (#8).
- A checker for edited rubrics. `node scripts/check-rubric.mjs your-rubric.md` fails a rubric that
  would not fit in a GitHub secret, one that names a `redline_` tool Redline does not have, and one
  that never names `redline_submit`. `rubric.md` is held to it on every pull request, and the
  checker has plain and property tests (#7).
- This repository's own pull requests are reviewed on the askalf runner host, as the other askalf
  repositories' are. The hosted callers it ran before are the ones the README and the hosted
  quickstart describe; they did not change (#6).
- The Scorecard result and the license are shown in the README (#5).
- CodeQL on the workflows, Scorecard, the public text check, Dependabot for the action pins and a
  security policy (#4).
- README: the model this repository's reviews read on, and the two callers it runs (#2, #3).
- This repository's pull requests are reviewed by Redline in hosted mode, with `rubric.md` as the
  reviewer's prompt (#1).
- `rubric.md`, a starter rubric written from Redline's public contract: the tools the reviewer is
  given, what a finding must quote, and how a verdict follows from the findings.
