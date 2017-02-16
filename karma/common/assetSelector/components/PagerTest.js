import { Pager } from 'Pager';
import _ from 'lodash';

describe('Pager', function() {
  const defaultProps = {
    currentPage: 1,
    changePage: _.noop,
    resultCount: 1000,
    resultsPerPage: 6
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('renders', function() {
    var element = renderComponent(Pager, getProps());
    assert.isDefined(element);
    assert.equal(element.className, 'pager');
    assert.equal(element.querySelectorAll('.prev-link').length, 1);
    assert.equal(element.querySelectorAll('.next-link').length, 1);
    assert.equal(element.querySelectorAll('.current-page-input').length, 1);
    assert.equal(element.querySelectorAll('.last-page-link').length, 1);
  });

  describe('prev link', function() {
    it('is disabled on the first page', function() {
      var element = renderComponent(Pager, getProps());
      var prevLink = element.querySelector('.prev-link');
      assert.match(prevLink.className, /disabled/);
    });

    it('is not disabled when you are past first page', function() {
      var element = renderComponent(Pager, getProps({ currentPage: 2 }));
      var prevLink = element.querySelector('.prev-link');
      assert.notMatch(prevLink.className, /disabled/);
    });

    it('calls changePage and decrements the currentPage', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ currentPage: 10, changePage: spy }));
      var prevLink = element.querySelector('.prev-link');
      TestUtils.Simulate.click(prevLink);
      sinon.assert.calledWith(spy, 9);
    });
  });

  describe('next link', function() {
    it('is not disabled by default', function() {
      var element = renderComponent(Pager, getProps());
      var nextLink = element.querySelector('.next-link');
      assert.notMatch(nextLink.className, /disabled/);
    });

    it('is disabled on the last page', function() {
      var element = renderComponent(Pager, getProps({ resultCount: 10, resultsPerPage: 20 }));
      var nextLink = element.querySelector('.next-link');
      assert.match(nextLink.className, /disabled/);
    });

    it('calls changePage and increments the currentPage', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ currentPage: 10, changePage: spy }));
      var nextLink = element.querySelector('.next-link');
      TestUtils.Simulate.click(nextLink);
      sinon.assert.calledWith(spy, 11);
    });
  });

  describe('last page link', function() {
    it('calls changePage with the last page', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ changePage: spy, resultCount: 200, resultsPerPage: 6 }));
      var lastPageLink = element.querySelector('.last-page-link');
      TestUtils.Simulate.click(lastPageLink);
      sinon.assert.calledWith(spy, Math.ceil(200/6));
    });
  });

  describe('current page input', function() {
    it('is 1 by default', function() {
      var element = renderComponent(Pager, getProps());
      var input = element.querySelector('.current-page-input input');
      assert.equal(input.value, '1');
    });

    it('calls changePage with the entered pageNumber when changed to a valid value', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ changePage: spy }));
      var input = element.querySelector('.current-page-input input');

      input.value = '5';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);
      sinon.assert.calledWith(spy, 5);

      input.value = '7';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);
      sinon.assert.calledWith(spy, 7);
    });

    it('does not call changePage when changed to an invalid value', function() {
      var spy = sinon.spy();
      var element = renderComponent(Pager, getProps({ changePage: spy }));
      var input = element.querySelector('.current-page-input input');

      input.value = '999999999';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);

      input.value = '0';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);

      input.value = '-5';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);

      input.value = 'adsf';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);

      input.value = '';
      TestUtils.Simulate.change(input);
      TestUtils.Simulate.blur(input);

      sinon.assert.notCalled(spy);
    });
  });
});
