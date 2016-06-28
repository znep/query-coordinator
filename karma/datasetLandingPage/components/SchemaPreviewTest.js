import { SchemaPreview } from 'components/SchemaPreview';
import mockView from 'data/mockView';

describe('components/SchemaPreview', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      onExpandColumn: _.noop,
      onExpandSchemaTable: _.noop,
      view: mockView
    });
  }

  it('renders an element', function() {
    var element = renderComponent(SchemaPreview, getProps());

    expect(element).to.exist;
  });

  it('does not render an element if the view has no columns', function() {
    var element = renderComponent(SchemaPreview, getProps({
      view: { columns: [] }
    }));
    expect(element).to.not.exist;
  });

  it('does not render an element if the view has no rows', function() {
    var element = renderComponent(SchemaPreview, getProps({
      view: { rowCount: 0 }
    }));
    expect(element).to.not.exist;
  });
});
