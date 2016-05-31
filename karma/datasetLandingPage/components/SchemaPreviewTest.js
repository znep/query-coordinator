import { SchemaPreview } from 'components/SchemaPreview';
import mockView from 'data/mockView';

describe('components/SchemaPreview', function() {
  it('renders an element', function() {
    var element = renderComponent(SchemaPreview, {
      onExpandColumn: _.noop,
      onExpandSchemaTable: _.noop,
      view: mockView
    });

    expect(element).to.exist;
  });
});
