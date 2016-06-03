import { PopularViewList } from 'components/PopularViewList';
import mockViewWidget from 'data/mockViewWidget';

describe('components/PopularViewList', function() {
  var defaultProps;

  beforeEach(function() {
    defaultProps = {
      viewList: _.fill(Array(3), mockViewWidget),
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
  });

  it('renders an element with the expected structure', function() {
    var element = renderComponent(PopularViewList, defaultProps);
    expect(element).to.exist;
    expect(element.webkitMatchesSelector('section')).to.be.ok;
    expect(element.querySelector('.dataset-landing-page-header')).to.exist;
  });

  describe('contents', function() {
    it('renders an alert if the viewList of featured views is empty', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        viewList: []
      }));

      expect(element.querySelector('.alert.default')).to.exist;
    });

    it('renders a result-card for each featured view', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        viewList: _.take(defaultProps.viewList, 2)
      }));

      expect(element.querySelectorAll('.result-card')).to.have.length(2);
    });
  });

  describe('load more button', function() {
    it('renders a button to load more featured views if hasMore is true', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: true
      }));

      expect(element.querySelector('.load-more-button')).to.exist;
    });

    it('does not render a button to load more featured views on a mobile device', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: true,
        isDesktop: false
      }));

      expect(element.querySelector('.load-more-button')).to.not.exist;
    });

    it('renders an error alert if hasError is true', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasError: true
      }));

      expect(element.querySelector('.alert.error')).to.exist;
    });

    it('dispatches an action to dismiss the error when the close icon is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasError: true,
        dismissError: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.alert-dismiss'));
      expect(spy.callCount).to.equal(1);
    });

    it('does not render a button to load more featured views if hasMore is false', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: false
      }));

      expect(element.querySelector('.load-more-button')).to.not.exist;
    });

    it('dispatches an action to load more featured views if the button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: true,
        loadMore: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.load-more-button'));
      expect(spy.callCount).to.equal(1);
    });

    it('does not dispatch an action to load more featured views if a request is in progress', function() {
      var spy = sinon.spy();

      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
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
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: true
      }));

      expect(element.querySelector('.collapse-button')).to.not.exist;
    });

    it('does not render the button if there are at most 3 views', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(3), mockViewWidget)
      }));

      expect(element.querySelector('.collapse-button')).to.not.exist;
    });

    it('renders the button if all views are loaded and there are at least 4 views', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockViewWidget)
      }));

      expect(element.querySelector('.collapse-button')).to.exist;
    });

    it('does not render the button on a mobile device', function() {
      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockViewWidget),
        isDesktop: false
      }));

      expect(element.querySelector('.collapse-button')).to.not.exist;
    });

    it('dispatches an action to toggle isCollapsed when the button is clicked', function() {
      var spy = sinon.spy();

      var element = renderComponent(PopularViewList, _.assign(defaultProps, {
        hasMore: false,
        viewList: _.fill(Array(4), mockViewWidget),
        toggleList: spy
      }));

      expect(spy.callCount).to.equal(0);
      TestUtils.Simulate.click(element.querySelector('.collapse-button'));
      expect(spy.callCount).to.equal(1);
    });
  });
});
