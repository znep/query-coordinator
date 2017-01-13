import { Pager } from 'components/Pager';
import _ from 'lodash';

describe('components/Pager', function() {
  function defaultProps() {
    return {
      onPageChange: _.noop,
      resultCount: 1000,
      resultsPerPage: 6
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  function goToPage(element, pageNumber) {
    var input = element.querySelector('.current-page-input input');
    input.value = pageNumber;
    TestUtils.Simulate.change(input);
    TestUtils.Simulate.blur(input);
  }

  it('renders', function() {
    var element = renderComponent(Pager, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('pager');
    expect(element.querySelectorAll('.prev-link').length).to.eq(1);
    expect(element.querySelectorAll('.next-link').length).to.eq(1);
    expect(element.querySelectorAll('.current-page-input').length).to.eq(1);
    expect(element.querySelectorAll('.last-page-link').length).to.eq(1);
  });

  describe('prev link', function() {
    it('is disabled by default', function() {
      var element = renderComponent(Pager, getProps());
      var prevLink = element.querySelector('.prev-link');
      expect(prevLink.className).to.match(/disabled/);
    });

    it('is not disabled when you are past first page', function() {
      var element = renderComponent(Pager, getProps());
      var prevLink = element.querySelector('.prev-link');
      var nextLink = element.querySelector('.next-link');
      TestUtils.Simulate.click(nextLink);
      expect(prevLink.className).to.not.match(/disabled/);
    });

    it('decrements the currentPage', function() {
      var pager = React.createElement(Pager, getProps());
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var prevLink = element.querySelector('.prev-link');

      expect(renderedPager.state.currentPage).to.eq(1);
      goToPage(element, 20);
      expect(renderedPager.state.currentPage).to.eq(20);
      TestUtils.Simulate.click(prevLink);
      expect(renderedPager.state.currentPage).to.eq(19);
      TestUtils.Simulate.click(prevLink);
      expect(renderedPager.state.currentPage).to.eq(18);
    });

    it('calls the onPageChange prop function when clicked', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ onPageChange: spy }));
      var prevLink = element.querySelector('.prev-link');
      goToPage(element, 20);
      TestUtils.Simulate.click(prevLink);
      expect(spy).to.have.been.called;
    });
  });

  describe('next link', function() {
    it('is not disabled by default', function() {
      var element = renderComponent(Pager, getProps());
      var nextLink = element.querySelector('.next-link');
      expect(nextLink.className).to.not.match(/disabled/);
    });

    it('is disabled on the last page', function() {
      var element = renderComponent(Pager, getProps({ resultCount: 10, resultsPerPage: 20 }));
      var nextLink = element.querySelector('.next-link');
      expect(nextLink.className).to.match(/disabled/);
    });

    it('increments the currentPage', function() {
      var pager = React.createElement(Pager, getProps());
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var nextLink = element.querySelector('.next-link');

      expect(renderedPager.state.currentPage).to.eq(1);
      TestUtils.Simulate.click(nextLink);
      expect(renderedPager.state.currentPage).to.eq(2);
      TestUtils.Simulate.click(nextLink);
      expect(renderedPager.state.currentPage).to.eq(3);
    });

    it('calls the onPageChange prop function when clicked', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ onPageChange: spy }));
      var nextLink = element.querySelector('.next-link');
      TestUtils.Simulate.click(nextLink);
      expect(spy).to.have.been.called;
    });
  });

  describe('last page link', function() {
    it('is a link that takes users to the last page', function() {
      var pager = React.createElement(Pager, getProps({ resultCount: 200, resultsPerPage: 20 }));
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var lastPageLink = element.querySelector('.last-page-link');

      expect(lastPageLink.textContent).to.eq('10Last page');
      TestUtils.Simulate.click(lastPageLink);
      expect(renderedPager.state.currentPage).to.eq(10);
    });

    it('calls the onPageChange prop function when clicked', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ onPageChange: spy }));
      var lastPageLink = element.querySelector('.last-page-link');
      TestUtils.Simulate.click(lastPageLink);
      expect(spy).to.have.been.called;
    });
  });

  describe('current page input', function() {
    it('is 1 by default', function() {
      var element = renderComponent(Pager, getProps());
      var input = element.querySelector('.current-page-input input');
      expect(input.value).to.eq('1');
    });

    it('updates the state.currentPage when changed to a valid value', function() {
      var pager = React.createElement(Pager, getProps());
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var input = element.querySelector('.current-page-input input');

      expect(renderedPager.state.currentPage).to.eq(1);
      goToPage(element, 20);
      expect(renderedPager.state.currentPage).to.eq(20);
    });

    it('does not update the state.currentPage when changed to an invalid value', function() {
      var pager = React.createElement(Pager, getProps());
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var input = element.querySelector('.current-page-input input');

      expect(renderedPager.state.currentPage).to.eq(1);
      goToPage(element, 999999999); // larger than the last page
      expect(renderedPager.state.currentPage).to.eq(1);
      goToPage(element, 'i am batman'); // not a number
      expect(renderedPager.state.currentPage).to.eq(1);
      goToPage(element, null);
      expect(renderedPager.state.currentPage).to.eq(1);
    });

    it('calls the onPageChange prop function when the page is changed', function() {
      var spy = sinon.spy();
      var pager = React.createElement(Pager, getProps({ onPageChange: spy }));
      var renderedPager = TestUtils.renderIntoDocument(pager);
      var element = ReactDOM.findDOMNode(renderedPager);
      var input = element.querySelector('.current-page-input input');

      goToPage(element, 20);
      expect(spy).to.have.been.called;
    });
  });
});
