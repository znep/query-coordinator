import _ from 'lodash';
import { assert } from 'chai';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import Localization from 'common/i18n/components/Localization';
import connectLocalization from 'common/i18n/components/connectLocalization';

describe('Localization', () => {
  const locale = 'en';
  const translations = {
    tests: 'Tests',
    greeting: 'Hello, %{name}',
    deep: {
      deepkey: 'im in deep'
    },
    product: {
      one: 'product',
      other: 'products'
    }
  };

  const renderComponent = (ComponentClass, props) => {
    const tree = <Localization locale={locale} translations={translations} {...props}><ComponentClass /></Localization>;
    return _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode)(tree);
  };

  describe('api', () => {
    it('should be accessible from children components', () => {
      let localizationApiDefined = false;

      const MyComponent = connectLocalization(({localization}) => {
        return <span>{(!_.isUndefined(localization)).toString()}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === 'true');
    });

    it('getLocalePrefix() should return url prefix for current locale', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.getLocalePrefix()}</span>;
      });

      const output = renderComponent(MyComponent, { localePrefix: '/en' });
      assert(output.textContent === '/en');
    });

    it('getLocalePrefix() should return empty string if it is not specified', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{String(localization.getLocalePrefix())}</span>;
      });

      const output = renderComponent(MyComponent, {});
      assert(output.textContent === '');
    });
  });
});
