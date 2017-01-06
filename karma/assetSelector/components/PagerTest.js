import { Pager } from 'components/Pager';
import _ from 'lodash';

describe.only('components/Pager', function() {
  function defaultProps() {
    return {
      onPageChange: _.noop,
      resultCount: 100
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderComponent(Pager, getProps());
    expect(element).to.exist;
    expect(element.className).to.eq('results-pagination-controls');
  });

  it('shows at most 9 page links', function() {
    var element = renderComponent(Pager, getProps({
      resultCount: 100000
    }));
    expect(element.querySelectorAll('.pageLink').length).to.equal(9)
  });

  describe('active page', function() {
    it('defaults to the first page', function() {
      var element = renderComponent(Pager, getProps());
      expect(element.querySelectorAll('.pageLink')[0].className).to.match(/active/);
    });

    it('changes to the clicked page', function() {
      var element = renderComponent(Pager, getProps());
      var thirdPageLink = element.querySelectorAll('.pageLink')[2];
      expect(thirdPageLink.className).to.not.match(/active/);
      TestUtils.Simulate.click(thirdPageLink);
      expect(thirdPageLink.className).to.match(/active/);
    });

    // Note: there may be more logic added to this, so active page can be based off a url param or something.
    // Once we try to use this a drop-in replacement for the catalog, that will be necessary.
  });

  describe('pagerEnd', function() {
    it('does not exceed the max number of pages', function() {
      var element = renderComponent(Pager, getProps({
        resultCount: 12
      }));
      // We expect there to only be two pages, since there are 9 results per page
      var pageLinks = element.querySelectorAll('.pageLink');
      expect(pageLinks.length).to.equal(2)
      expect(pageLinks[pageLinks.length - 1].textContent).to.equal('Page2');
    });

    it('shows 4 page links past the currentPage', function() {
      // TODO

      // var element = renderComponent(Pager, getProps({
      //   resultCount: 1000
      // }));

      // element.setState({ currentPage: 25 });

    });
  });
});
