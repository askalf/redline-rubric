# redline-rubric

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

This repository runs that setup on its own pull requests, with `rubric.md` unedited as the prompt:
[`redline.yml`](.github/workflows/redline.yml) and
[`redline-post.yml`](.github/workflows/redline-post.yml) are a working copy of the two callers.

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
