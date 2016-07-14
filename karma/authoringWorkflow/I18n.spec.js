import en from 'src/authoringWorkflow/locales/en';
import es from 'src/authoringWorkflow/locales/es';

import { setLocale, translate, translateGroup } from 'src/authoringWorkflow/I18n';

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
      it('throws', function() {
        expect(function() {
          setLocale('bm');
        }).to.throw(/The locale bm is not available/);
      });
    });
  });
});
