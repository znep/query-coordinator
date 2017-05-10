import { expect, assert } from 'chai';

import Localization from 'components/Localization/Localization';
import LocalizedLink from 'components/Localization/LocalizedLink';

describe('LocalizedLink', () => {
  const translations = {};

  const renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

  it('should render a link with locale prefix if exists', () => {
    const localizationWithLocalePrefix = (
      <Localization translations={translations} locale="en" localePrefix="/en">
        <LocalizedLink url={'/some/path'}>Some Path</LocalizedLink>
      </Localization>
    );

    let output = renderComponent(localizationWithLocalePrefix);
    expect(output.getAttribute('href')).to.eq('/en/some/path');
    expect(output.textContent).to.eq('Some Path');
  });

  it('should render a link without a locale prefix if it doesn\'t provided', () => {
    const localizationWithoutLocalePrefix = (
      <Localization translations={translations} locale="en">
        <LocalizedLink url={'/some/path'}>Some Path</LocalizedLink>
      </Localization>
    );

    let output = renderComponent(localizationWithoutLocalePrefix);
    expect(output.getAttribute('href')).to.eq('/some/path');
    expect(output.textContent).to.eq('Some Path');
  });
});
