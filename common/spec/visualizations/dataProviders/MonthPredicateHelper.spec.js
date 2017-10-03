import _ from 'lodash';

import * as MPH from 'common/visualizations/dataProviders/MonthPredicateHelper';

describe('month checking', () => {

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
    assert.isNotOk(MPH.monthIndex('De'));
    assert.equal(11, MPH.monthIndex('Dec'));
    assert.equal(11, MPH.monthIndex('Dece'));
    assert.equal(11, MPH.monthIndex('Decem'));
    assert.equal(11, MPH.monthIndex('decemb'));
    assert.equal(11, MPH.monthIndex('decembe'));
    assert.equal(11, MPH.monthIndex('december'));
    assert.isNotOk(MPH.monthIndex('nothing'));
    assert.isNotOk(MPH.monthIndex('nothing', 'nothing'));
  });

  it('checks Russian months', () => {
    assert.isNotOk(MPH.monthIndex('январь', 'en'));
    assert.equal(0, MPH.monthIndex('январь', 'ru'));
    assert.equal(0, MPH.monthIndex('январ', 'ru'));
    assert.equal(0, MPH.monthIndex('янва', 'ru'));
    assert.equal(0, MPH.monthIndex('янв', 'ru'));
    assert.isNotOk(MPH.monthIndex('ян', 'ru'));
    assert.isNotOk(MPH.monthIndex('ма', 'ru'));
    assert.equal(4, MPH.monthIndex('май', 'ru'));
    assert.equal(11, MPH.monthIndex('декабрь', 'ru'));
    assert.isNotOk(MPH.monthIndex('декXабрь', 'ru'));
    assert.equal(6, MPH.monthIndex('июль'));
  });

  it('checks language detection', () => {
    assert.equal('en', MPH.detectLanguage('January'));
    assert.equal(undefined, MPH.detectLanguage('nothing'));
    assert.equal('ru', MPH.detectLanguage('август'));
    assert.equal('ru', MPH.detectLanguage('апр'));
  });

  it('sorts rows with English months in ascending order', () => {
    assert.deepEqual(
      [['two', 2, 'march'],
       ['three', 3, 'april'],
       ['four', 4, 'november'],
       ['one', 1, 'december']],
      MPH.sortByMonthCol([['one', 1, 'december'],
                          ['three', 3, 'april'],
                          ['four', 4, 'november'],
                          ['two', 2, 'march']],
                         2));
  });

  it('sorts rows with English months in descending order', () => {
    assert.deepEqual(
      [['one', 1, 'dec'],
       ['four', 4, 'nov'],
       ['three', 3, 'apr'],
       ['two', 2, 'mar']],
      MPH.sortByMonthCol([['one', 1, 'dec'],
                          ['three', 3, 'apr'],
                          ['four', 4, 'nov'],
                          ['two', 2, 'mar']],
                         2,
                         'desc'));
  });

  it('sorts rows with Russian months in ascending order', () => {
    assert.deepEqual(
      [['two', 2, 'март'],
       ['three', 3, 'апрель'],
       ['four', 4, 'ноябрь'],
       ['one', 1, 'декабрь']],
      MPH.sortByMonthCol([['one', 1, 'декабрь'],
                          ['three', 3, 'апрель'],
                          ['four', 4, 'ноябрь'],
                          ['two', 2, 'март']],
                         2));
  });

  it('sorts rows with Russian months in descending order', () => {
    assert.deepEqual(
      [['one', 1, 'декабрь'],
       ['four', 4, 'ноябрь'],
       ['three', 3, 'апрель'],
       ['two', 2, 'март']],
      MPH.sortByMonthCol([['one', 1, 'декабрь'],
                          ['three', 3, 'апрель'],
                          ['four', 4, 'ноябрь'],
                          ['two', 2, 'март']],
                         2,
                         'desc'));
  });

  it('ignores rows with indeterminate months', () => {
    const same = [['one', 1, 'jan'],
                  ['two', 2, null],
                  ['three', 3, 'dec']];
    assert.deepEqual(same, MPH.sortByMonthCol(same, 2));
  });

});
