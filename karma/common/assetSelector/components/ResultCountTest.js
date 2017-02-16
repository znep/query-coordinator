import { ResultCount } from 'ResultCount';

describe('ResultCount', function() {
  const defaultProps = {
    currentPage: 1,
    resultsPerPage: 6,
    total: 100
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('shows "1 View" when there is only 1 result', function() {
    var element = renderComponent(ResultCount, getProps({ total: 1 }));
    assert.isDefined(element);
    assert.match(element.className, /result-count/);
    assert.equal(element.textContent, '1-1 of 1 View');
  });

  it('shows "[n] Views" when n is not 1', function() {
    var element = renderComponent(ResultCount, getProps({ total: 50 }));
    assert.equal(element.textContent, '1-6 of 50 Views');
  });

  it('uses numerical abbreviations for large counts', function() {
    var element = renderComponent(ResultCount, getProps({ total: 238430 }));
    assert.equal(element.textContent, '1-6 of 238K Views');

    var element = renderComponent(ResultCount, getProps({ total: 23843000 }));
    assert.equal(element.textContent, '1-6 of 23.8M Views');
  });
});
