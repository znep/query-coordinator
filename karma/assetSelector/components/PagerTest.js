import { Pager } from 'components/Pager';
import _ from 'lodash';

describe('components/Pager', function() {
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
  });
});
