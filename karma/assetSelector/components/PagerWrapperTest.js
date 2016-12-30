import { PagerWrapper } from 'components/PagerWrapper';
import _ from 'lodash';

describe('components/PagerWrapper', function() {
  function defaultProps() {
    return {
      onPageChange: _.noop,
      viewCount: 1000
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  // TODO! useful tests regarding the number of pager .pageLink's rendered based on viewCount
  it('renders', function() {
    var element = renderComponent(PagerWrapper, getProps());
    expect(element).to.exist;
    expect(element.className).to.match(/results-pagination-controls/);
  });
});
