import { assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import Localization from 'common/i18n/components/Localization';
import LocalizedText from 'common/i18n/components/LocalizedText';


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
