import { MetadataTable } from 'components/MetadataTable';
import mockView from 'data/mockView';

describe('components/MetadataTable', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      view: mockView,
      onExpandMetadataTable: _.noop,
      onExpandTags: _.noop
    });
  }

  it('renders an element', function() {
    var element = renderComponent(MetadataTable, getProps());
    expect(element).to.exist;
  });
});
