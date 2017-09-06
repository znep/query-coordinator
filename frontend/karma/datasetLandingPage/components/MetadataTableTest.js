import { expect, assert } from 'chai';
import { MetadataTable } from 'components/MetadataTable';
import mockView from 'data/mockView';

describe('components/MetadataTable', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      viewlikeObject: mockView,
      onExpandMetadataTable: _.noop,
      onExpandTags: _.noop
    });
  }

  it('renders an element', function() {
    var element = renderComponent(MetadataTable, getProps());
    assert.ok(element);
  });

  it('rends a contact dataset owner button if disableContactDatasetOwner is true or undefined', function() {
    var element = renderComponent(MetadataTable, getProps());
    assert.ok(element.querySelector('.contact-dataset-owner'));
  });

  it('does not render a contact dataset owner button if disableContactDatasetOwner is true', function() {
    var element = renderComponent(MetadataTable, getProps({
      viewlikeObject: {
        disableContactDatasetOwner: true
      }
    }));
    assert.isNull(element.querySelector('.contact-dataset-owner'));
  });
});
