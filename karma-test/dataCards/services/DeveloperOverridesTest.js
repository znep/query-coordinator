describe('Developer overrides', function() {
  beforeEach(module('dataCards.services'));

  describe('setup from string', function() {
    it('should accept an empty set of overrides', inject(function(DeveloperOverrides) {
      DeveloperOverrides.setOverridesFromString('');
    }));

    it('should not accept a malformed string', inject(function(DeveloperOverrides) {
      expect(function() {
        DeveloperOverrides.setOverridesFromString('foo');
      }).to.throw();

      expect(function() {
        DeveloperOverrides.setOverridesFromString('foo-barr->dead-beef');
      }).to.throw();

      expect(function() {
        DeveloperOverrides.setOverridesFromString('fooo-barr->ded-beef');
      }).to.throw();

      expect(function() {
        DeveloperOverrides.setOverridesFromString('fooo->barr,asdf-fdsa->dead-bef');
      }).to.throw();
    }));
  });

  describe('accessing overrides', function() {
    describe('with a single override defined', function() {
      it('should return the replacement for the overridden dataset', inject(function(DeveloperOverrides) {
        DeveloperOverrides.setOverridesFromString('dead-beef->unde-rtst');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-beef')).to.equal('unde-rtst');
      }));
      it('should return undefined for a non-overridden dataset', inject(function(DeveloperOverrides) {
        DeveloperOverrides.setOverridesFromString('dead-beef->unde-rtst');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-fish')).to.be.undefined;
      }));
    });
    describe('with multiple overrides defined', function() {
      it('should return the replacement for the overridden dataset', inject(function(DeveloperOverrides) {
        DeveloperOverrides.setOverridesFromString('dead-beef->unde-rtst,fooo-baar->cats-meow');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-beef')).to.equal('unde-rtst');
        expect(DeveloperOverrides.dataOverrideForDataset('fooo-baar')).to.equal('cats-meow');
      }));
      it('should return undefined for a non-overridden dataset', inject(function(DeveloperOverrides) {
        DeveloperOverrides.setOverridesFromString('dead-beef->unde-rtst,fooo-baar->cats-meow');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-fish')).to.be.undefined;
      }));
    });
    describe('replacing overrides', function() {
      it('should reflect only the new overrides', inject(function(DeveloperOverrides) {
        DeveloperOverrides.setOverridesFromString('dead-beef->unde-rtst');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-beef')).to.equal('unde-rtst');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-fish')).to.be.undefined;

        DeveloperOverrides.setOverridesFromString('live-beef->lolz-puns');
        expect(DeveloperOverrides.dataOverrideForDataset('live-beef')).to.equal('lolz-puns');
        expect(DeveloperOverrides.dataOverrideForDataset('dead-beef')).to.be.undefined;
        expect(DeveloperOverrides.dataOverrideForDataset('dead-fish')).to.be.undefined;
      }));
    });
  });
});
