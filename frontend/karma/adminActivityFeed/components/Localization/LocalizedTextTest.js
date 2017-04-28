import { assert } from 'chai';

import Localization from 'components/Localization/Localization';
import LocalizedText from 'components/Localization/LocalizedText';

describe('LocalizedText', () => {
  const locale = 'en';
  const translations = {
    test: 'Test in english'
  };

  const renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

  it('should render translated text in span', () => {
    const component = (
      <Localization translations={translations} locale="en">
        <LocalizedText localeKey="test" />
      </Localization>
    );

    const output = renderComponent(component);
    assert(output.tagName === 'SPAN');
    assert(output.textContent === translations.test);
  });
});
