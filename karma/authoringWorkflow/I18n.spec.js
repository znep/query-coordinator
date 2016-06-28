import { setLocale, translate } from 'src/authoringWorkflow/I18n';


describe('I18n', function() {
  describe('translate', function() {
    describe('when the key doesn\'t resolve to a translation', function() {
      it('returns a missing key translation', function() {
        expect(translate('nonsense.key')).to.match(/Translation missing/);
      });
    });

    describe('when the key does resolve to a translation', function() {
      it('returns the translation', function() {
        expect(translate('aggregations.sum')).to.equal('Sum');
      });
    });
  });

  describe('setLocale', function() {
    describe('when the locale exists', function() {
      it('sets the locale and proceeds to use it when translating', function() {
        setLocale('es');
        expect(translate('modal.title')).to.equal('Crear una visualización');
      });
    });

    describe('when the locale does not exist', function() {
      it('throws', function() {
        expect(function() {
          setLocale('bm');
        }).to.throw(/There is not a locale/);
      });
    });
  });
});
