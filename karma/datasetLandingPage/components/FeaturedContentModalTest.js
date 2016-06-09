import { FeaturedContentModal } from 'components/FeaturedContentModal';
import { Simulate } from 'react-addons-test-utils';

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
    expect(element).to.exist;
  });

  it('calls onCloseModal when the close icon is clicked', function() {
    var spy = sinon.spy();

    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      onCloseModal: spy
    }));

    expect(spy.callCount).to.equal(0);
    Simulate.click(element.querySelector('.btn.modal-header-dismiss'));
    expect(spy.callCount).to.equal(1);
  });

  it('renders FeaturedItemSelector when isEditing is false', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: false
    }));

    expect(element.querySelector('.featured-content')).to.exist;
  });

  it('renders ExternalResourceForm when isEditing is true and editType is externalResource', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: true,
      editType: 'externalResource'
    }));

    expect(element.querySelector('.external-resource form')).to.exist;
  });

  it('renders StoryForm when isEditing is true and editType is story', function() {
    var element = renderComponentWithStore(FeaturedContentModal, getProps({
      isEditing: true,
      editType: 'story'
    }));

    expect(element.querySelector('.story form')).to.exist;
  });
});
