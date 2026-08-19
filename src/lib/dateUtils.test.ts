import assert from 'node:assert/strict';
import test from 'node:test';
import { formatLocalDate } from './dateUtils';

test('formatLocalDate preserves a positive-offset calendar date', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'Asia/Singapore';

  try {
    const selectedDate = new Date(2026, 7, 1);

    assert.equal(selectedDate.toISOString().split('T')[0], '2026-07-31');
    assert.equal(formatLocalDate(selectedDate), '2026-08-01');
  } finally {
    process.env.TZ = previousTimezone;
  }
});
