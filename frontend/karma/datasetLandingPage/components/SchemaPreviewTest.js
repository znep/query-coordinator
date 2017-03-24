import { SchemaPreview } from 'components/SchemaPreview';
import mockView from 'data/mockView';

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

    expect(element).to.exist;
  });

  it('does not render an element if the view has no columns', function() {
    var element = renderComponent(SchemaPreview, getProps({
      columns: []
    }));
    expect(element).to.not.exist;
  });
});
