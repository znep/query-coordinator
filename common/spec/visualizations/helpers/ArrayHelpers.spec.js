import _ from 'lodash';

import * as ArrayHelpers from 'common/visualizations/helpers/ArrayHelpers';


describe('array chunking by maximum chunk length behavior', () => {

  it('chunks into one long segment correctly', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['one', 'two', 'three'], 2000, false),
      [['one', 'two', 'three']]
    );
  });

  it('chunks into three small segments correctly', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['one', 'two', 'three'], 3, false),
      [['one'], ['two'], ['three']]
    );
  });

  it('chunks into two medium segments correctly', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['one', 'two', 'three'], 6, false),
      [['one', 'two'], ['three']]
    );
  });

  it('handles 2-byte characters correctly by true length', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['раз', 'два', 'три'], 3, false),
      [['раз'], ['два'], ['три']]
    );
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['раз', 'два', 'три'], 6, false),
      [['раз', 'два'], ['три']]
    );
  });

  it('handles 4-byte characters correctly by true length', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['一', '二', '三', '四', '五'], 3, false),
      [['一', '二', '三'], ['四', '五']]
    );
  });

  it('handles 4-byte characters correctly by byte length', () => {
    assert.deepEqual(
      ArrayHelpers.chunkArrayByLength(['一', '二', '三', '四', '五'], 9, true),
      [['一', '二', '三'], ['四', '五']]
    );
  });

});
