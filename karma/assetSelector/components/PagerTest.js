import { Pager } from 'components/Pager';
import _ from 'lodash';

describe('components/Pager', function() {
  function defaultProps() {
    return {
      onPageChange: _.noop,
      resultCount: 1000
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
    var element = renderComponent(Pager, getProps());
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
  });

  describe('page links', function() {
    it('update when the page changes', function() {
      var element = renderComponent(Pager, getProps());
      var pageLinks = element.querySelectorAll('.pageLink');
      expect(pageLinks[0].textContent).to.eq('Page1');
      expect(pageLinks[pageLinks.length - 1].textContent).to.eq('Page9');
      TestUtils.Simulate.click(pageLinks[pageLinks.length - 1]);
      var pageLinks = element.querySelectorAll('.pageLink');
      expect(pageLinks[0].textContent).to.eq('Page5');
      expect(pageLinks[pageLinks.length - 1].textContent).to.eq('Page13');
    });
  });
});
