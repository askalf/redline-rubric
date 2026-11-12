# Security Policy

This repository holds a starter rubric for Redline, a small script that checks a rubric against
Redline's contract, and the workflow callers that run Redline on its own pull requests, on a
self-hosted runner. A report that gets one of this repository's secrets out
of a run, a fork's code onto that runner, or an approval onto a pull request nobody reviewed, gets
priority.

## Reporting a vulnerability

Please **do not open a public issue** for security reports.

- **Preferred:** [GitHub private vulnerability reporting](https://github.com/askalf/redline-rubric/security/advisories/new),
  which opens a private advisory only the maintainers see.
- **Email:** support@askalf.org with `redline-rubric security` in the subject.

You'll get an acknowledgement within 72 hours. Please include a minimal reproduction where you can.

A vulnerability in Redline's own workflows or scripts belongs to
[askalf/ci's security policy](https://github.com/askalf/ci/security/policy).

## Supported versions

Only `main` receives fixes; there are no release branches.

## In scope

- A workflow in this repository exposing one of its secrets, such as either reviewer account's
  token, to a log, a run page or a pull request
- A pull request from a fork whose review job starts on the self-hosted runner
- A pull request that gets an approval from `sprayberry-redline` or `sprayberry-secondread`
  without that reviewer having read its head commit
- A pull request that changes the workflow its own posted review ran from

## Out of scope

- The reusable workflows and scripts this repository calls (report those to askalf/ci)
- The wording of `rubric.md`: open an issue or a pull request
- Findings that need write access to this repository already
