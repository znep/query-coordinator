import _ from 'lodash';

import * as MPH from 'common/visualizations/dataProviders/MonthPredicateHelper';

describe('month checking', () => {

  it('returns undefined for null months', () => {
    assert.isUndefined(MPH.monthIndex(null));
  });

  it('checks English months', () => {
    assert.equal(0, MPH.monthIndex('January', 'en'));
    assert.equal(1, MPH.monthIndex('February', 'en'));
    assert.equal(11, MPH.monthIndex('December', 'en'));
    assert.equal(11, MPH.monthIndex('December'));
    assert.equal(undefined, MPH.monthIndex('nothing', 'en'));
    assert.equal(undefined, MPH.monthIndex('nothing'));
    assert.equal(0, MPH.monthIndex('January'));
    assert.equal(0, MPH.monthIndex('Jan'));
    assert.equal(0, MPH.monthIndex('Janu'));
    assert.equal(1, MPH.monthIndex('February'));
    assert.equal(2, MPH.monthIndex('March'));
    assert.equal(2, MPH.monthIndex('March'));
    assert.isUndefined(MPH.monthIndex('De'));
    assert.equal(11, MPH.monthIndex('Dec'));
    assert.equal(11, MPH.monthIndex('Dece'));
    assert.equal(11, MPH.monthIndex('Decem'));
    assert.equal(11, MPH.monthIndex('decemb'));
    assert.equal(11, MPH.monthIndex('decembe'));
    assert.equal(11, MPH.monthIndex('december'));
    assert.isUndefined(MPH.monthIndex('nothing'));
    assert.isUndefined(MPH.monthIndex('nothing', 'nothing'));
  });

  it('checks Russian months', () => {
    assert.isUndefined(MPH.monthIndex('январь', 'en'));
    assert.equal(0, MPH.monthIndex('январь', 'ru'));
    assert.equal(0, MPH.monthIndex('январ', 'ru'));
    assert.equal(0, MPH.monthIndex('янва', 'ru'));
    assert.equal(0, MPH.monthIndex('янв', 'ru'));
    assert.isUndefined(MPH.monthIndex('ян', 'ru'));
    assert.isUndefined(MPH.monthIndex('ма', 'ru'));
    assert.equal(4, MPH.monthIndex('май', 'ru'));
    assert.equal(11, MPH.monthIndex('декабрь', 'ru'));
    assert.isUndefined(MPH.monthIndex('декXабрь', 'ru'));
    assert.equal(6, MPH.monthIndex('июль'));
  });

  it('checks language detection', () => {
    assert.equal('en', MPH.detectLanguage('January'));
    assert.equal(undefined, MPH.detectLanguage('nothing'));
    assert.equal('ru', MPH.detectLanguage('август'));
    assert.equal('ru', MPH.detectLanguage('апр'));
  });

});
