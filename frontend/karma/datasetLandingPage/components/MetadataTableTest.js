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

  it('rends a contact dataset owner button if disableContactDatasetOwner is true or undefined', function() {
    var element = renderComponent(MetadataTable, getProps());
    expect(element.querySelector('.contact-dataset-owner')).to.exist;
  });

  it('does not render a contact dataset owner button if disableContactDatasetOwner is true', function() {
    var element = renderComponent(MetadataTable, getProps({
      view: {
        disableContactDatasetOwner: true
      }
    }));
    expect(element.querySelector('.contact-dataset-owner')).to.not.exist;
  });
});
