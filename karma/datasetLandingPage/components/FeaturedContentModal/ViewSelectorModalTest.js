import { ViewSelectorModal } from 'components/FeaturedContentModal/ViewSelectorModal';
import { Simulate } from 'react-addons-test-utils';
import mockViewWidget from 'data/mockViewWidget';

describe('components/FeaturedContentModal/ViewSelectorModal', function() {
  function getProps(props) {
    return _.defaults({}, props, {
      hasSaveError: false,
      hasViewFetchError: false,
      isLoading: false,
      isSaving: false,
      isSavingViewUid: '',
      nbeId: 'test-test',
      onClickCancel: _.noop,
      onClickChoose: _.noop,
      fetchViews: _.noop,
      resetFocus: _.noop,
      viewList: _.fill(Array(2), mockViewWidget)
    });
  }

  describe('basic markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(ViewSelectorModal, getProps());
    });

    it('uses the scoped class names', function() {
      expect(element.getAttribute('class')).to.include('internal-resource-contents');
    });

    it('renders the title', function() {
      expect(element.querySelector('.modal-content > h2')).to.exist;
    });

    it('renders the footer', function() {
      expect(element.querySelector('.modal-footer')).to.exist;
    });

    it('renders a back button', function() {
      expect(element.querySelector('.modal-content > .back-button')).to.exist;
    });

    it('does not render spinner', function() {
      expect(element.querySelector('.spinner-default')).to.not.exist;
      expect(element.querySelector('.spinner')).to.not.exist;
    });

    it('does not render alert', function() {
      expect(element.querySelector('.alert')).to.not.exist;
    })
  });

  describe('while loading', function() {
    it('renders the spinner', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        isLoading: true
      }));
      expect(element.querySelector('.spinner-default')).to.exist;
    });
  });

  describe('when cannot fetch views', function() {
    it('renders a warning', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        hasViewFetchError: true
      }));
      expect(element.querySelector('.alert')).to.exist;
    });
  });

  describe('when given views', function() {
    it('renders the ViewSelector with views', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        viewList: _.fill(Array(2), mockViewWidget)
      }));
      expect(element.querySelectorAll('.view-widget')).to.have.length(2);
    });
  });
});
