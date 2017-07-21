import sinon from 'sinon';
import { expect, assert } from 'chai';
import { RelatedViewList } from 'components/RelatedViewList';
import mockServerConfig from 'data/mockServerConfig';
import mockRelatedView from 'data/mockRelatedView';

describe('components/RelatedViewList', function() {
  function resetServerConfig() {
    window.serverConfig = _.cloneDeep(mockServerConfig);
  }

  var defaultProps;
  beforeEach(function() {
    defaultProps = {
      bootstrapUrl: 'bootstrapUrl',
      viewList: _.fill(Array(3), mockRelatedView),
      hasMore: false,
      hasError: false,
      isLoading: false,
      isCollapsed: false,
      isDesktop: true,
      dismissError: _.noop,
      loadMore: _.noop,
      onClickWidget: _.noop,
      onScrollList: _.noop,
      toggleList: _.noop
    };

    resetServerConfig();
  });

  afterEach(resetServerConfig);

  it('renders an element with the expected structure', function() {
    var element = renderComponent(RelatedViewList, defaultProps);
    assert.ok(element);
    assert.ok(element.webkitMatchesSelector('section'));
    assert.ok(element.querySelector('.dataset-landing-page-header'));
  });

  it('does not render if the user is not logged in and the list is empty', function() {
    window.serverConfig.currentUser = null;
    var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
      viewList: []
    }));

    assert.isNull(element);
  });

  it('does not render if the user is not an admin or publisher and the list is empty', function() {
    window.serverConfig.currentUser = { roleName: 'wizard', rights: [ ] };
    var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
      viewList: []
    }));

    assert.isNull(element);
  });

  describe('contents', function() {
    it('renders an alert if the viewList of related views is empty and the user is privileged', function() {
      window.serverConfig.currentUser = { rights: [ 'edit_others_datasets' ] };
      var element = renderComponentWithStore(RelatedViewList, _.assign(defaultProps, {
        viewList: []
      }));

      assert.ok(element.querySelector('.alert.default'));
      assert.ok(element.querySelector('.alert.default .btn'));
    });

    it('renders a result-card for each related view', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        viewList: _.take(defaultProps.viewList, 2)
      }));

      expect(element.querySelectorAll('.result-card')).to.have.length(2);
    });
  });

  describe('load more button', function() {
    it('renders a button to load more related views if hasMore is true', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: true
      }));

      assert.ok(element.querySelector('.load-more-button'));
    });

    it('does not render a button to load more related views on a mobile device', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: true,
        isDesktop: false
      }));

      assert.isNull(element.querySelector('.load-more-button'));
    });

    it('renders an error alert if hasError is true', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasError: true
      }));

      assert.ok(element.querySelector('.alert.error'));
    });

    it('dispatches an action to dismiss the error when the close icon is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasError: true,
        dismissError: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.alert-dismiss'));
      expect(spy.callCount).to.equal(1);
    });

    it('does not render a button to load more related views if hasMore is false', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: false
      }));

      assert.isNull(element.querySelector('.load-more-button'));
    });

    it('dispatches an action to load more related views if the button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: true,
        loadMore: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.load-more-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('does not dispatch an action to load more related views if a request is in progress', function() {
      var spy = sinon.spy();

      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: true,
        isLoading: true,
        loadMore: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.load-more-button'));
      expect(spy.callCount).to.equal(0);
    });
  });

  describe('collapse button', function() {
    it('does not render the button if there are still views to load', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: true
      }));

      assert.isNull(element.querySelector('.collapse-button'));
    });

    it('does not render the button if there are at most 3 views', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(3), mockRelatedView)
      }));

      assert.isNull(element.querySelector('.collapse-button'));
    });

    it('renders the button if all views are loaded and there are at least 4 views', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockRelatedView)
      }));

      assert.ok(element.querySelector('.collapse-button'));
    });

    it('does not render the button on a mobile device', function() {
      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockRelatedView),
        isDesktop: false
      }));

      assert.isNull(element.querySelector('.collapse-button'));
    });

    it('dispatches an action to toggle isCollapsed when the button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(RelatedViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockRelatedView),
        toggleList: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.collapse-button'));
      expect(spy.callCount).to.equal(1);
    });
  });
});
