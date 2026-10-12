import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { activityDays } from './activity-days.mjs';

test('today includes a payment after local midnight in a positive UTC offset', () => {
  const code = `import { activityDays } from './lib/hosted/activity-days.mjs';
    const days = activityDays([{kind:'private_transfer', time:'2026-10-11T23:30:00Z'}], new Date('2026-10-12T12:00:00Z'));
    process.stdout.write(JSON.stringify(days.at(-1)));`;
  const today = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('../..', import.meta.url), env: { ...process.env, TZ: 'Africa/Lagos' }, encoding: 'utf8'
  }));
  assert.equal(today.key, '2026-10-12');
  assert.equal(today.payments, 1);
});

test('counts deposits and payments from status timestamps without counting other actions', () => {
  const days = activityDays([
    { kind: 'deposit', time: '2026-10-12T09:00:00Z' },
    { kind: 'private_transfer', time: '2026-10-12T10:00:00Z' },
    { kind: 'register', time: '2026-10-12T11:00:00Z' }
  ], new Date('2026-10-12T12:00:00Z'));
  assert.equal(days.at(-1).deposits, 1);
  assert.equal(days.at(-1).payments, 1);
});
