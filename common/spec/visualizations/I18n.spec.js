import _ from 'lodash';
import en from 'common/visualizations/locales/en';
import es from 'common/visualizations/locales/es';
import fr from 'common/visualizations/locales/fr';
import ca from 'common/visualizations/locales/ca';
import ita from 'common/visualizations/locales/it';
import nl from 'common/visualizations/locales/nl';
import zh from 'common/visualizations/locales/zh';

import { setLocale, translate, translateGroup } from 'common/visualizations/I18n';

const locales = { en, es, fr, ca, nl, zh, it: ita };

describe('I18n', function() {

  afterEach(function() {
    setLocale('en');
  });

  describe('translate', function() {
    describe('when a non-String is passed', function() {
      it('throws', function() {
        expect(function() {
          translate();
        }).to.throw(/translate requires/);
      });
    });

    describe('when the key doesn\'t resolve to a translation', function() {
      it('throws', function() {
        expect(function() {
          translate('nonsense.key')
        }).to.throw(/Translation missing/);
      });
    });

    describe('when the key does resolve to a String translation', function() {
      it('returns the translation', function() {
        expect(translate('modal.title')).to.equal(en.modal.title);
      });
    });

    describe('when the key resolves to a group of translations', function() {
      it('throws', function() {
        expect(function() {
          translate('aggregations');
        }).to.throw(/Access to a group/);
      });
    });

    describe('when an available locale other than English is set', function() {
      _.forEach(locales, function(value, key) {
        it(`returns available translations for ${key}`, function() {
          setLocale(_.toString(key));
          expect(translate('visualizations.table.next')).to.equal(value.visualizations.table.next);
          expect(translate('visualizations.table.no_column_description')).to.equal(value.visualizations.table.no_column_description);
        });
      });
      _.forEach(locales, function(value, key) {
        it(`returns the English translation if the the ${key} translation is not present`, function() {
          setLocale(_.toString(key));
          expect(translate('aggregations.sum')).to.equal(en.aggregations.sum);
        });
      });
    });
  });

  describe('translateGroup', function() {
    describe('when a non-String is passed', function() {
      it('throws', function() {
        expect(function() {
          translateGroup();
        }).to.throw(/translateGroup requires/);
      });
    });

    describe('when the key doesn\'t resolve to a translation group', function() {
      it('throws', function() {
        expect(function() {
          translateGroup('nonsense.key');
        }).to.throw(/Translations missing/);
      });
    });

    describe('when the key does resolve to an Object translation group', function() {
      it('returns the translation group', function() {
        expect(translateGroup('modal')).to.eql(en.modal);
      });
    });

    describe('when the key resolves to a String translation', function() {
      it('throws', function() {
        expect(function() {
          translateGroup('modal.title');
        }).to.throw(/Access to a direct/);
      });
    });
  });

  describe('setLocale', function() {
    describe('when the locale exists', function() {
      it('sets the locale and uses it when translating', function() {
        setLocale('es');
        expect(translate('modal.title')).to.equal(es.modal.title);
      });
    });

    describe('when the locale does not exist', function() {
      it('defaults to English', function() {
        setLocale('bm');
        expect(translate('modal.title')).to.equal(en.modal.title);
      });
    });
  });
});
