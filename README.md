# redline-rubric

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/askalf/redline-rubric/badge)](https://scorecard.dev/viewer/?uri=github.com/askalf/redline-rubric)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A starter rubric for [Redline](https://github.com/askalf/ci), the AI code review that gates a pull
request. Redline's hosted mode runs the review on a GitHub-hosted runner and takes the reviewer's
system prompt from a repository secret. The review workflow ships no prompt of its own, so this is
one to start from.

[`rubric.md`](rubric.md) is the whole prompt.

## Use it

1. Copy `rubric.md` and edit it for your repository: what counts as blocking, what your project
   forbids, what the reviewer should leave alone.
2. Store your edited copy as a repository secret, for example `REDLINE_PROMPT`:

   ```sh
   gh secret set REDLINE_PROMPT < rubric.md
   ```

3. Pass it to the review as `reviewer-prompt`. The caller is in the Redline README, under
   [Without a runner host](https://github.com/askalf/ci#without-a-runner-host).

The [hosted quickstart](https://github.com/askalf/ci/blob/main/docs/hosted-quickstart.md) walks
through the whole setup, the two callers included.

## Check your edited copy

Before you store an edited rubric, run it through the checker. It needs Node 20 or newer and
nothing else:

```sh
node scripts/check-rubric.mjs path/to/your-rubric.md
```

It fails a rubric that would not fit in a GitHub secret, one that names a `redline_` tool Redline
does not have, and one that never names `redline_submit`. It does not judge what the rubric asks
the reviewer to look for; that part is yours. [`rubric.md`](rubric.md) is held to the same check on
every pull request here, and the checker has its own tests in [`test/`](test/), run with
`npm ci && npm test`.

This repository's own pull requests are read the way the other askalf repositories' are, on our
runner host, so [`redline.yml`](.github/workflows/redline.yml) and
[`redline-post.yml`](.github/workflows/redline-post.yml) here are the runner-host callers, not a
copy of the hosted ones.

Keep your edited copy out of the repository it reviews. A rubric the author of a pull request can
read is one they can write to, and one they can change in the pull request is no rubric at all. A
GitHub secret holds up to 48 KB; this file is about 6 KB.

## What it is written against

The rubric talks to the contract Redline gives the model, which is public:

- the tools in [`scripts/redline/tools.json`](https://github.com/askalf/ci/blob/main/scripts/redline/tools.json):
  `redline_diff`, `redline_list`, `redline_read`, `redline_search`, and `redline_submit`, which
  ends the review;
- the rules `review.mjs` enforces whatever a rubric says: a finding must quote text from the diff,
  the pull request's text or a commit message; a blocking finding always requests changes; a
  `reads-as-generated` finding, and a `misleading-text` finding on the description, never block.

If you rewrite the rubric, keep those parts: a review that never calls `redline_submit`, or whose
findings quote nothing, ends without a verdict.

## What it is not

It is not the rubric the askalf repositories run. That one lives on our runner hosts and is not
published. This one was written from the public contract alone, and has had less use: read the
first few reviews it produces before you let it hold a merge.

## License

[MIT](LICENSE)
