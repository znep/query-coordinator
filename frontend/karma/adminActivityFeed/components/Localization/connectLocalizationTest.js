import { assert } from 'chai';

import Localization from 'components/Localization/Localization';
import connectLocalization from 'components/Localization/connectLocalization';

describe('connectLocalization', () => {
  const locale = 'en';
  const translations = {
    test: 'Test in english'
  };

  const renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

  it('should pass the localization object to wrapped component', () => {
    const SampleComponent = connectLocalization(({ localization }) => {
      return <span>{localization.translate('test')} {localization.getLocale()}</span>;
    });

    const component = (
      <Localization translations={translations} locale="en">
        <SampleComponent />
      </Localization>
    );

    const output = renderComponent(component);
    assert(output.textContent === `${translations.test} ${locale}`);
  });
});
