# Contributing to redline-rubric

Thanks for your interest in improving **redline-rubric**, a starter rubric for
[Redline](https://github.com/askalf/ci) and the script that checks an edited copy against Redline's
contract.

## Ground rules

- Found a security issue? **Do not open a public issue**: follow [SECURITY.md](SECURITY.md) to
  report it privately.
- A problem with Redline itself (the review, its tools, the workflows this repository calls)
  belongs in [askalf/ci](https://github.com/askalf/ci/issues).
- Changes to the wording of `rubric.md` are welcome. Say in the pull request what the reviewer did
  wrong, or missed, with the wording as it was; a rubric change with no review behind it is hard
  to judge.

## Development setup

You need Node.js **20** or newer. The checker has no dependencies; its tests have one, fast-check,
installed from the lockfile.

```bash
git clone https://github.com/askalf/redline-rubric.git
cd redline-rubric
npm ci
npm test
node scripts/check-rubric.mjs rubric.md
```

`npm test` runs `test/check-rubric.test.js`: plain cases, then property tests that hold each rule
of the checker against generated text. `RUBRIC_FUZZ_RUNS=20000 npm test` runs each property that
many times.

## Making a change

1. Branch off `main`.
2. Keep the change focused: one concern per pull request.
3. A change to `scripts/check-rubric.mjs` needs a test in `test/check-rubric.test.js`. A new rule
   needs a plain case and a property; a changed rule needs the test that would have failed before.
4. A change to `rubric.md` must still pass `node scripts/check-rubric.mjs rubric.md`.
5. If Redline gains or loses a tool, change `TOOLS` in the checker and the tool list in `rubric.md`
   in the same pull request, and name the askalf/ci change in the description.
6. Add a line to [CHANGELOG.md](CHANGELOG.md) for anything an adopter of the rubric would want to
   know.
7. Run `npm test` before pushing, then open a pull request against `main`.

## What a pull request must pass

- An approving review. Redline reads pull requests from a branch of this repository only, so a
  pull request from a fork waits for a maintainer.
- `public-text / check`: the added lines, title, description and commit messages must not lean on
  em or en dashes, and the title, description and commit messages must not credit a model or an AI
  tool.
- CodeQL on the workflows, `analyze (actions)`.

The `test` job and CodeQL on the JavaScript, `analyze (javascript-typescript)`, run on every pull
request as well.

Each head Redline approves is also read once more by a second reviewer, `sprayberry-secondread`,
for security and supply chain only. Its review is posted on the pull request. It does not hold a
merge yet: read it, and fix what it finds, as you would Redline's.
