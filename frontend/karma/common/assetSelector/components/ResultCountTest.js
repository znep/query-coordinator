import { expect, assert } from 'chai';
import { ResultCount } from 'components/AssetSelector/result_count';

import { useTestTranslations } from 'common/i18n';
import mockTranslations from '../../mockTranslations';

describe('ResultCount', function() {
  beforeEach(() => {
    useTestTranslations(mockTranslations);
  });

  const defaultProps = {
    currentPage: 1,
    resultsPerPage: 6,
    total: 100
  };

  function getProps(props = {}) {
    return {...defaultProps, ...props};
  }

  it('shows "1 Result" when there is only 1 result', function() {
    var element = renderComponent(ResultCount, getProps({ total: 1 }));
    assert.isDefined(element);
    assert.match(element.className, /result-count/);
    assert.equal(element.textContent, '1-1 of 1 Result');
  });

  it('shows "[n] Results" when n is not 1', function() {
    var element = renderComponent(ResultCount, getProps({ total: 50 }));
    assert.equal(element.textContent, '1-6 of 50 Results');
  });

  it('uses numerical abbreviations for large counts', function() {
    var element = renderComponent(ResultCount, getProps({ total: 238430 }));
    assert.equal(element.textContent, '1-6 of 238K Results');

    var element = renderComponent(ResultCount, getProps({ total: 23843000 }));
    assert.equal(element.textContent, '1-6 of 23.8M Results');
  });
});
