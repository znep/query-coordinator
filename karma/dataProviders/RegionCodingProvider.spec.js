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

  xdescribe('getRegionCodingStatus', function() {
    var instance;
    var fakeServer;

    beforeEach(function() {
      instance = new RegionCodingProvider({ domain, datasetUid });
      fakeServer = sinon.fakeServer.create();
    });

    afterEach(function() {
      fakeServer.restore();
    });

    describe('with a jobId', function() {
      var jobId = 'jobId';
      var url = `https://${domain}/geo/status?datasetUid=${datasetUid}&jobId=${jobId}`;

      describe('when successful', function() {
        it('makes a request with jobId', function(done) {
          var response = [
            200,
            {'Content-Type': 'application/json'},
            '{}'
          ];

          fakeServer.respondWith('GET', url, response);

          instance.getRegionCodingStatus({ jobId: 'jobId' }).
            then(() => done()).
            catch(() => done('Request with jobId failed.'));

          fakeServer.respond();
        });
      });

      describe('when unsuccessful', function() {
      });
    });

    describe('with a shapefileId', function() {
      describe('when successful', function() {
      });

      describe('when unsuccessful', function() {
      });
    });

    describe('with neither', function() {
      it('throws', function() {
        expect(function() {
          instance.getRegionCodingStatus();
        }).to.throw(Error);
      });
    });
  });

  describe('awaitRegionCodingCompletion', function() {
  });

  describe('initiateRegionCoding', function() {
  });
});
