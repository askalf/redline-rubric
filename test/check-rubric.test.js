// Tests of scripts/check-rubric.mjs. The checker reads text someone else wrote (an adopter's
// edited rubric), so beside the plain cases each rule is held against generated input with
// fast-check, which shrinks any counterexample to a small one.
//
// More runs locally: RUBRIC_FUZZ_RUNS=20000 npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';

import { checkRubric, TOOLS, SUBMIT_TOOL, MAX_BYTES } from '../scripts/check-rubric.mjs';

const RUNS = Number(process.env.RUBRIC_FUZZ_RUNS) > 0 ? Number(process.env.RUBRIC_FUZZ_RUNS) : undefined;
const runs = (n) => ({ numRuns: RUNS ?? n });
const CODES = new Set(['empty', 'too-large', 'unknown-tool', 'no-submit']);
const codes = (text) => checkRubric(text).problems.map((p) => p.code);
const at = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const script = at('../scripts/check-rubric.mjs');
const rubric = at('../rubric.md');

// Text that cannot hold a tool name by accident: no underscore, so `redline_` never forms.
const plain = fc.string({ unit: 'grapheme', maxLength: 400 }).map((s) => s.replaceAll('_', ' '));
// What can follow `redline_` in a name.
const suffix = fc.stringMatching(/^[A-Za-z0-9_]{1,24}$/);

test('the rubric this repository ships holds', () => {
  const result = checkRubric(readFileSync(rubric, 'utf8'));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.tools, [...TOOLS].sort(), 'it names every tool, and only tools that exist');
  assert.ok(result.bytes < MAX_BYTES);
});

test('plain cases', () => {
  assert.deepEqual(codes(''), ['empty', 'no-submit']);
  assert.deepEqual(codes(' \n\t'), ['empty', 'no-submit']);
  assert.deepEqual(codes('Review the change.'), ['no-submit']);
  assert.deepEqual(codes('End with `redline_submit`.'), []);
  assert.deepEqual(codes('Call redline_run, then redline_submit.'), ['unknown-tool']);
  assert.deepEqual(codes('The review is redline_submitted.'), ['unknown-tool', 'no-submit']);
  assert.deepEqual(codes('Call Redline_Submit.'), ['no-submit'], 'a tool call is matched by its exact name');
  assert.deepEqual(codes('Call redline_Submit, then redline_submit.'), ['unknown-tool']);
  assert.deepEqual(codes('Stored as REDLINE_PROMPT. End with redline_submit.'), [], 'the secret name is not a tool');
  assert.deepEqual(codes('See myredline_tool and redline_submit.'), [], 'part of a longer word is not a tool name');
  assert.deepEqual(codes('The `redline_` tools end with redline_submit.'), [], 'the bare prefix names no tool');
  assert.deepEqual(codes('redline_x and redline_submit'), ['unknown-tool']);
  assert.throws(() => checkRubric(undefined), TypeError);
  assert.throws(() => checkRubric(Buffer.from('redline_submit')), TypeError);
});

test('the size limit is counted in bytes, at the limit and one past it', () => {
  const head = `${SUBMIT_TOOL}\n`;
  const fits = head + 'a'.repeat(MAX_BYTES - head.length);
  assert.deepEqual(codes(fits), []);
  assert.deepEqual(codes(`${fits}a`), ['too-large']);
  // Two bytes each in UTF-8, so half as many characters reach the limit. The head is 15 bytes,
  // which leaves an odd number: one more ASCII byte makes the rest divide evenly.
  const wide = `${head}a` + 'é'.repeat((MAX_BYTES - head.length - 1) / 2);
  assert.equal(checkRubric(wide).bytes, MAX_BYTES);
  assert.deepEqual(codes(wide), []);
  assert.deepEqual(codes(`${wide}é`), ['too-large']);
});

test('property: any string is checked without throwing, and the result is well formed', () => {
  const any = fc.oneof(fc.string({ unit: 'binary', maxLength: 2000 }), fc.string({ unit: 'grapheme', maxLength: 2000 }));
  fc.assert(fc.property(any, (text) => {
    const result = checkRubric(text);
    assert.equal(result.ok, result.problems.length === 0);
    assert.equal(result.bytes, Buffer.byteLength(text, 'utf8'));
    for (const p of result.problems) {
      assert.ok(CODES.has(p.code), `unknown code ${p.code}`);
      assert.ok(typeof p.message === 'string' && p.message.length > 0);
    }
    assert.deepEqual(result.tools, [...new Set(result.tools)].sort(), 'tools are unique and sorted');
    for (const name of result.tools) assert.ok(text.includes(name));
    assert.deepEqual(checkRubric(text), result, 'the same text gives the same result');
  }), runs(1000));
});

test('property: text with no tool name fails only for the missing submit call, and naming it fixes that', () => {
  fc.assert(fc.property(plain, plain, (before, after) => {
    const without = `${before} ${after}`;
    const expected = without.trim() === '' ? ['empty', 'no-submit'] : ['no-submit'];
    assert.deepEqual(codes(without), expected);
    assert.deepEqual(codes(`${before} ${SUBMIT_TOOL} ${after}`), []);
  }), runs(500));
});

test('property: a tool name Redline does not have is always reported, by name', () => {
  fc.assert(fc.property(plain, suffix, plain, (before, tail, after) => {
    const name = `redline_${tail}`;
    fc.pre(!TOOLS.includes(name));
    const result = checkRubric(`${before} ${name} ${after} ${SUBMIT_TOOL}`);
    const unknown = result.problems.filter((p) => p.code === 'unknown-tool');
    assert.equal(unknown.length, 1);
    assert.ok(unknown[0].message.includes(`names ${name},`));
    assert.ok(result.tools.includes(name));
  }), runs(500));
});

test('property: every real tool is accepted wherever it stands between other text', () => {
  const some = fc.subarray([...TOOLS], { minLength: 1 });
  const gaps = fc.array(plain, { minLength: 6, maxLength: 6 });
  fc.assert(fc.property(some, gaps, (names, gap) => {
    const text = names.map((n, i) => `${gap[i]} ${n} `).join('') + gap[5];
    const result = checkRubric(text);
    assert.deepEqual(result.tools, [...names].sort());
    assert.deepEqual(result.problems.map((p) => p.code), names.includes(SUBMIT_TOOL) ? [] : ['no-submit']);
  }), runs(500));
});

test('property: the size rule follows the byte length and nothing else', () => {
  const near = fc.integer({ min: MAX_BYTES - 64, max: MAX_BYTES + 64 });
  const unit = fc.constantFrom('a', 'é', '中', '😀');
  fc.assert(fc.property(near, unit, (target, ch) => {
    const each = Buffer.byteLength(ch, 'utf8');
    const text = `${SUBMIT_TOOL}\n` + ch.repeat(Math.floor((target - SUBMIT_TOOL.length - 1) / each));
    const result = checkRubric(text);
    assert.equal(result.problems.some((p) => p.code === 'too-large'), result.bytes > MAX_BYTES);
  }), runs(300));
});

test('the command line: exit 0 on a rubric that holds, 1 on one that does not, 2 on a missing file', () => {
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  const good = run(rubric);
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /holds \(\d+ bytes, tools named: /);
  const broken = run(at('../LICENSE'));
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /never names redline_submit/);
  const missing = run(at('./no-such-rubric.md'));
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /cannot read .*no-such-rubric\.md: ENOENT/);
});
