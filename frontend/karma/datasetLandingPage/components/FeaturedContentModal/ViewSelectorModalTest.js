import { expect, assert } from 'chai';
import { ViewSelectorModal } from 'datasetLandingPage/components/FeaturedContentModal/ViewSelectorModal';
import { Simulate } from 'react-dom/test-utils';
import mockRelatedView from '../../data/mockRelatedView';

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
      viewList: _.fill(Array(2), mockRelatedView)
    });
  }

  describe('basic markup', function() {
    var element;

    beforeEach(function() {
      element = renderComponent(ViewSelectorModal, getProps());
    });

    it('renders the header', function() {
      assert.ok(element.querySelector('.modal-header'));
    });

    it('renders the title', function() {
      assert.ok(element.querySelector('.modal-content h2'));
    });

    it('renders the footer', function() {
      assert.ok(element.querySelector('.modal-footer'));
    });

    it('renders a back button', function() {
      assert.ok(element.querySelector('.modal-content .back-button'));
    });

    it('does not render spinner', function() {
      assert.isNull(element.querySelector('.spinner-default'));
      assert.isNull(element.querySelector('.spinner'));
    });

    it('does not render alert', function() {
      assert.isNull(element.querySelector('.alert'));
    })
  });

  describe('while loading', function() {
    it('renders the spinner', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        isLoading: true
      }));
      assert.ok(element.querySelector('.spinner-default'));
    });
  });

  describe('when cannot fetch views', function() {
    it('renders a warning', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        hasViewFetchError: true
      }));
      assert.ok(element.querySelector('.alert'));
    });
  });

  describe('when given views', function() {
    it('renders the ViewSelector with views', function() {
      var element = renderComponent(ViewSelectorModal, getProps({
        viewList: _.fill(Array(2), mockRelatedView)
      }));
      expect(element.querySelectorAll('.view-card')).to.have.length(2);
    });
  });
});
