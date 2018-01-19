import { assert } from 'chai';
import {
  validateFieldName,
  validateDisplayName
} from 'datasetManagementUI/containers/AddColFormContainer';

describe('AddColFormContainer', () => {
  it('returns an empty list of errors for a valid field name', () => {
    const actual = validateFieldName('reasonable_name', []);
    assert.equal(actual.length, 0);
  });

  it('returns an empty list of errors for a valid display name', () => {
    const actual = validateDisplayName('reasonable name', []);
    assert.equal(actual.length, 0);
  });

  it('returns an error if the field name is not unique', () => {
    const actual = validateFieldName('reasonable_name', ['reasonable_name']);
    assert.deepEqual(actual, ['not unique']);
  });

  it('returns an error if the field name has no value', () => {
    const actual = validateFieldName('', []);
    assert.deepEqual(actual, ['no value', 'invalid name']);
  });

  it('returns an error if the field name contains non-alphanumeric chars', () => {
    const actual = validateFieldName('B@d==n@me', []);
    assert.deepEqual(actual, ['invalid name']);
  });

  it('returns an error if the display name is not unique', () => {
    const actual = validateDisplayName('id', ['id']);
    assert.deepEqual(actual, ['not unique']);
  });

  it('returns an error if the display name has no value', () => {
    const actual = validateFieldName('', []);
    assert.deepEqual(actual, ['no value', 'invalid name']);
  });
});
