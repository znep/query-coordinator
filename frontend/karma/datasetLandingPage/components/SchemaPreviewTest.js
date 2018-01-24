import { expect, assert } from 'chai';
import { SchemaPreview } from 'datasetLandingPage/components/SchemaPreview';
import mockView from '../data/mockView';

describe('components/SchemaPreview', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      onExpandColumn: _.noop,
      onExpandSchemaTable: _.noop,
      columns: mockView.columns
    });
  }

  it('renders an element', function() {
    var element = renderComponent(SchemaPreview, getProps());

    assert.ok(element);
  });

  it('does not render an element if the view has no columns', function() {
    var element = renderComponent(SchemaPreview, getProps({
      columns: []
    }));
    assert.isNull(element);
  });
});
