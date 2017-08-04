import { assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import Localization from 'common/i18n/components/Localization';
import LocalizedText from 'common/i18n/components/LocalizedText';

describe('LocalizedText', () => {
  const translations = {
    greeting: 'Hello, %{name}',
    test: 'Test in english',
    product: {
      one: 'product',
      other: '%{count} products'
    }
  };

  const renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

  it('should render translated text in span', () => {
    const component = (
      <Localization translations={translations} locale="en">
        <LocalizedText localeKey="test" />
      </Localization>
    );

    const output = renderComponent(component);
    assert.equal(output.tagName, 'SPAN');
    assert.equal(output.textContent, translations.test);
  });

  it('translate(key,data) should replace sub keys in translation with fields provided in data', () => {
    const component = (
      <Localization translations={translations} locale="en">
        <LocalizedText localeKey="greeting" data={{ name: 'John Doe' }}/>
      </Localization>
    );

    const output = renderComponent(component);
    assert(output.textContent === 'Hello, John Doe');
  });

  describe('should respect count data', () => {
    it('singular', () => {
      const component = (
        <Localization translations={translations} locale="en">
          <LocalizedText localeKey="product" data={{ count: 1 }}/>
        </Localization>
      );

      const output = renderComponent(component);
      assert.equal(output.textContent, 'product');
    });

    it('plural', () => {
      const component = (
        <Localization translations={translations} locale="en">
          <LocalizedText localeKey="product" data={{ count: 5 }}/>
        </Localization>
      );

      const output = renderComponent(component);
      assert.equal(output.textContent, '5 products');
    });
  });
});
