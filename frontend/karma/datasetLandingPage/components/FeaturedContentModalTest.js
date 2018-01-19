import { expect, assert } from 'chai';
import { FeaturedContentModal } from 'datasetLandingPage/components/FeaturedContentModal';

describe('components/FeaturedContentModal', function() {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      onCloseModal: _.noop,
      isEditing: false,
      editType: null
    });
  }

  it('renders an element', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps());
    assert.ok(element);
  });

  it('renders FeaturedItemSelector when isEditing is false', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: false
    }));

    assert.ok(element.querySelector('.featured-content'));
  });

  it('renders ExternalResourceForm when isEditing is true and editType is externalResource', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: true,
      editType: 'externalResource'
    }));

    assert.ok(element.querySelector('.external-resource form'));
  });

  it('renders StoryForm when isEditing is true and editType is story', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: true,
      editType: 'story'
    }));

    assert.ok(element.querySelector('.story form'));
  });
});
