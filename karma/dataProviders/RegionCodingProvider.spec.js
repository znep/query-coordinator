import _ from 'lodash';
import RegionCodingProvider from 'src/dataProviders/RegionCodingProvider';

describe('RegionCodingProvider', function() {
  var domain = 'https://rowdyrudy.com';
  var datasetUid = 'yeee-haaw';

  describe('instantiation', function() {
    describe('with a domain and datasetUid', function() {
      it('returns an instance of RegionCodingProvider', function() {
        var instance = new RegionCodingProvider({ domain, datasetUid });
        expect(instance).to.be.an.instanceof(RegionCodingProvider);
      });
    });

    describe('without a domain', function() {
      it('throws', function() {
        expect(function() {
          new RegionCodingProvider({ datasetUid });
        }).to.throw();
      });
    });

    describe('without a datasetUid', function() {
      it('throws', function() {
        expect(function() {
          new RegionCodingProvider({ domain });
        }).to.throw();
      });
    });
  });
});
