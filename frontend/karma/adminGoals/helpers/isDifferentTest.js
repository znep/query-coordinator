import { expect, assert } from 'chai';
import isDifferent from 'adminGoals/helpers/isDifferent';

describe('helpers/isDifferent', () => {
  const leftObject = { key: 'value', deep: { key: 'value' } };

  it('should return false if right object doesnt override the values', () => {
    expect(isDifferent(leftObject, {})).to.eq(false);
    expect(isDifferent(leftObject, { key: 'value' })).to.eq(false);
    expect(isDifferent(leftObject, { deep: { key: 'value' } })).to.eq(false);
    expect(isDifferent(leftObject, { key: 'value', deep: { key: 'value' } })).to.eq(false);
    expect(isDifferent(leftObject, { deep: { unknownKey: 'value' } })).to.eq(false);
  });

  it('should return true if right object overrides the left hand values', () => {
    expect(isDifferent(leftObject, { key: 'updated' })).to.eq(true);
    expect(isDifferent(leftObject, { deep: { key: 'updated' } })).to.eq(true);
  });
});
