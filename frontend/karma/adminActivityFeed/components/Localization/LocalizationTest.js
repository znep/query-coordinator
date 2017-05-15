import _ from 'lodash';
import { assert } from 'chai';

import Localization from 'components/Localization/Localization';
import connectLocalization from 'components/Localization/connectLocalization';

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

    it('getLocale() should return current locale', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.getLocale()}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === locale);
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

    it('translate(key,data) should return localized string if exists', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.translate('tests')}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === 'Tests');
    });

    it('translate(key,data) should return not found text if key doesn\'t exists', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.translate('idontexist')}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === '(no translation available)');
    });

    it('translate(key,data) should replace sub keys in translation with fields provided in data', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.translate('greeting', { name: 'John Doe' })}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === 'Hello, John Doe');
    });

    it('translate(key,data) should return key name if desired when key not found', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.translate('notexist')}</span>;
      });

      const output = renderComponent(MyComponent, { returnKeyForNotFound: true });
      assert(output.textContent === 'notexist');
    });

    it('translate(key, data) shoud search for the given key under root namespace if provided', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>{localization.translate('deepkey')}</span>;
      });

      const output = renderComponent(MyComponent, { root: 'deep' });
      assert(output.textContent === 'im in deep');
    });

    it('translate(key, data) should respect count data', () => {
      const MyComponent = connectLocalization(({ localization }) => {
        return <span>5 {localization.translate('product', { count: 5 })}, 1 {localization.translate('product', { count: 1 })}</span>;
      });

      const output = renderComponent(MyComponent);
      assert(output.textContent === '5 products, 1 product');
    });
  });
});
