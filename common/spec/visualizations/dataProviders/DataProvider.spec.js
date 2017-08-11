import _ from 'lodash';
import DataProvider from 'common/visualizations/dataProviders/DataProvider';

describe('DataProvider base class', () => {

  const testValue = 'testValue';
  const providerOptions = {
    testProperty: testValue
  };
  let provider;

  beforeEach(() => {
    provider = new DataProvider(providerOptions);
  });

  describe('`.getConfigurationProperty`', () => {
    it('returns configured value', () => {
      assert.equal(provider.getConfigurationProperty('testProperty'), testValue);
    });

    it('throws for an unconfigured property', () => {
      assert.throws(() => providerOptions.getConfigurationProperty('invalid'));
    });
  });

  describe('`.getOptionalConfigurationProperty`', () => {
    it('returns configured value', () => {
      assert.equal(provider.getOptionalConfigurationProperty('testProperty'), testValue);
    });

    it('returns default value for an unconfigured property', () => {
      const defaultValue = 'foo';
      assert.equal(
        provider.getOptionalConfigurationProperty('invalid', defaultValue),
        defaultValue
      );
    });
  });
});
