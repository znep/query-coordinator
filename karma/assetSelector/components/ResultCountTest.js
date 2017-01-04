import { ResultCount } from 'components/ResultCount';

describe('components/ResultCount', function() {
  function defaultProps() {
    return {
      count: 1
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('shows "1 View" when there is only 1 result', function() {
    var element = renderPureComponent(ResultCount(getProps()));
    expect(element).to.exist;
    expect(element.className).to.match(/result-count/);
    expect(element.textContent).to.eq('1 View');
  });

  it('shows "[n] Views" when n is not 1', function() {
    var element = renderPureComponent(ResultCount(getProps({
      count: 0
    })));
    expect(element.textContent).to.eq('0 Views');

    var element = renderPureComponent(ResultCount(getProps({
      count: 50
    })));
    expect(element.textContent).to.eq('50 Views');
  });

  it('uses numerical abbreviations for large counts', function() {
    var element = renderPureComponent(ResultCount(getProps({
      count: 238430
    })));
    expect(element.textContent).to.eq('238K Views');

    var element = renderPureComponent(ResultCount(getProps({
      count: 23843000
    })));
    expect(element.textContent).to.eq('23.8M Views');
  });
});
