import { expect, assert } from 'chai';
import RowDetails from 'components/RowDetails';

describe('components/RowDetails', function() {
  it('renders an element', function() {
    const element = renderPureComponent(RowDetails({
      rowLabel: 'row',
      columnCount: 5,
      rowCount: 62
    }));

    assert.isNotNull(element);
  });

  describe('row label', function() {
    it('renders for a non-default value', function() {
      const element = renderPureComponent(RowDetails({
        rowLabel: 'thingamabob',
        columnCount: 5,
        rowCount: 62
      }));

      assert.lengthOf(element.querySelectorAll('.metadata-pair'), 3);
    });

    it('does not render for a default value', function() {
      const element = renderPureComponent(RowDetails({
        rowLabel: 'row',
        columnCount: 5,
        rowCount: 62
      }));

      assert.lengthOf(element.querySelectorAll('.metadata-pair'), 2);
    });
  });
});
