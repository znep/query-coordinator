import { ResultCount } from 'components/ResultCount';

describe('components/ResultCount', function() {
  function defaultProps() {
    return {
      currentPage: 1,
      resultsPerPage: 6,
      total: 100
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('shows "1 View" when there is only 1 result', function() {
    var element = renderPureComponent(ResultCount(getProps({ total: 1 })));
    expect(element).to.exist;
    expect(element.className).to.match(/result-count/);
    expect(element.textContent).to.eq('1-1 of 1 View');
  });

  it('shows "[n] Views" when n is not 1', function() {
    var element = renderPureComponent(ResultCount(getProps({
      total: 50
    })));
    expect(element.textContent).to.eq('1-6 of 50 Views');
  });

  it('uses numerical abbreviations for large counts', function() {
    var element = renderPureComponent(ResultCount(getProps({
      total: 238430
    })));
    expect(element.textContent).to.eq('1-6 of 238K Views');

    var element = renderPureComponent(ResultCount(getProps({
      total: 23843000
    })));
    expect(element.textContent).to.eq('1-6 of 23.8M Views');
  });
});
