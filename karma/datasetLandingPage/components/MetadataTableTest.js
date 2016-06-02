import { MetadataTable } from 'components/MetadataTable';
import mockView from 'data/mockView';

describe('components/MetadataTable', function() {
  it('renders an element', function() {
    var element = renderComponent(MetadataTable, {
      onExpandMetadataTable: _.noop,
      onExpandTags: _.noop,
      view: mockView
    });

    expect(element).to.exist;
  });
});
