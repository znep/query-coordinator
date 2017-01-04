import { Pager } from 'components/Pager';
import _ from 'lodash';

describe('components/Pager', function() {
  function defaultProps() {
    return {
      onPageChange: _.noop,
      pagerStart: 1,
      pagerEnd: 9
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

  it('creates the correct number of page links', function() {
    var element = renderComponent(Pager, getProps({
      pagerStart: 1,
      pagerEnd: 14
    }));
    expect(element.querySelectorAll('.pageLink').length).to.equal(14)
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
});
