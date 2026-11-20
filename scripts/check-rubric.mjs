#!/usr/bin/env node
// Checks a rubric against the parts of Redline's contract that a rewrite can break without anyone
// noticing until a review ends with no verdict:
//
//   - it must fit in a GitHub secret (48 KB), because that is where a hosted review reads it from;
//   - every `redline_` tool it names must be one Redline gives the model. A rubric that tells the
//     reviewer to call a tool that does not exist costs it turns it does not have;
//   - it must name `redline_submit`, the call that ends a review. A review that never makes it
//     ends without a verdict;
//   - it must not name one of GitHub's other review words (COMMENT, APPROVED, ...) in capitals,
//     anywhere in it. redline_submit takes APPROVE or REQUEST_CHANGES and sends anything else back,
//     so a rubric that teaches the reviewer to submit COMMENT costs it a turn on every review that
//     does. The check does not read what a sentence asks for: it fails such a word wherever it
//     stands, even in a sentence that says it is not a verdict. A rubric that must mention one
//     writes it in lower case.
//
// The tool names and the verdicts are those of askalf/ci's scripts/redline/tools.json. If Redline
// adds a tool or a verdict, add it here in the same change that teaches rubric.md to use it.
//
// Usage: node scripts/check-rubric.mjs [file]   (default: rubric.md)
// Exit 0 when the rubric holds, 1 when it does not, 2 when the file cannot be read.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const TOOLS = Object.freeze(['redline_diff', 'redline_list', 'redline_read', 'redline_search', 'redline_submit']);
export const SUBMIT_TOOL = 'redline_submit';
export const MAX_BYTES = 48 * 1024;
// redline_submit's `verdict`, an enum in tools.json.
export const VERDICTS = Object.freeze(['APPROVE', 'REQUEST_CHANGES']);
// The rest of GitHub's words for a review: of its three review events (APPROVE, REQUEST_CHANGES,
// COMMENT) the one redline_submit refuses, and all five of its review states. A rubric written from
// GitHub's API can name any of them as the verdict to give.
export const NOT_VERDICTS = Object.freeze(['CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'APPROVED', 'PENDING', 'COMMENT']);

// A tool name as the model would read it: `redline_` and what follows, not part of a longer word.
// Case matters, since a tool call is matched by its exact name, so REDLINE_PROMPT (the usual name
// of the secret) is not a tool name and Redline_Submit is not the submit tool. The bare prefix,
// as in "the `redline_` tools", names no tool and is left alone.
const TOOL_NAME = /(?<![A-Za-z0-9_])redline_[A-Za-z0-9_]+/g;
// One of those words, whole and in capitals, anywhere in the text. In lower case, as in "a comment"
// or "approved changes", it is left alone.
const NOT_VERDICT = new RegExp(`(?<![A-Za-z0-9_])(?:${NOT_VERDICTS.join('|')})(?![A-Za-z0-9_])`, 'g');

/**
 * @param {string} text the rubric
 * @returns {{ ok: boolean, bytes: number, tools: string[], verdicts: string[], problems: { code: string, message: string }[] }}
 */
export function checkRubric(text) {
  if (typeof text !== 'string') throw new TypeError('checkRubric takes the rubric as a string');
  const problems = [];
  const bytes = Buffer.byteLength(text, 'utf8');
  const tools = [...new Set(text.match(TOOL_NAME) ?? [])].sort();
  const verdicts = [...new Set(text.match(NOT_VERDICT) ?? [])].sort();

  if (text.trim() === '') {
    problems.push({ code: 'empty', message: 'the rubric is empty' });
  }
  if (bytes > MAX_BYTES) {
    problems.push({ code: 'too-large', message: `the rubric is ${bytes} bytes; a GitHub secret holds ${MAX_BYTES}` });
  }
  for (const name of tools) {
    if (!TOOLS.includes(name)) {
      problems.push({ code: 'unknown-tool', message: `the rubric names ${name}, which is not a Redline tool (${TOOLS.join(', ')})` });
    }
  }
  if (!tools.includes(SUBMIT_TOOL)) {
    problems.push({ code: 'no-submit', message: `the rubric never names ${SUBMIT_TOOL}, the call that ends a review` });
  }
  for (const word of verdicts) {
    problems.push({ code: 'not-a-verdict', message: `the rubric names ${word}, which is not a verdict ${SUBMIT_TOOL} takes (${VERDICTS.join(', ')})` });
  }
  return { ok: problems.length === 0, bytes, tools, verdicts, problems };
}

function main(argv) {
  const file = argv[0] ?? 'rubric.md';
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`check-rubric: cannot read ${file}: ${err.code ?? err.message}`);
    return 2;
  }
  const result = checkRubric(text);
  for (const p of result.problems) console.error(`check-rubric: ${file}: ${p.message}`);
  if (result.ok) console.log(`check-rubric: ${file} holds (${result.bytes} bytes, tools named: ${result.tools.join(', ')})`);
  return result.ok ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
