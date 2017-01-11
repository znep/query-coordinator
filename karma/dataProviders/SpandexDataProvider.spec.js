import _ from 'lodash';
import SpandexDataProvider  from 'src/dataProviders/SpandexDataProvider';

describe('SpandexDataProvider', function() {
  var domain = 'https://rowdyrudy.org';
  var datasetUid = 'yeee-haww';

  describe('instantiation', function() {
    describe('with a domain and datasetUid', function() {
      it('returns an instance of SpandexDataProvider', function() {
        var instance = new SpandexDataProvider({ domain, datasetUid });
        expect(instance).to.be.an.instanceof(SpandexDataProvider);
      });
    });

    describe('without a domain', function() {
      it('throws', function() {
        expect(function() {
          new SpandexDataProvider({ datasetUid });
        }).to.throw();
      });
    });

    describe('without a datasetUid', function() {
      it('throws', function() {
        expect(function() {
          new SpandexDataProvider({ domain });
        }).to.throw();
      });
    });
  });

  describe('getSuggestions', () => {
    it('constructs the correct URL', () => {
      var spandex = new SpandexDataProvider({ domain, datasetUid });
      var server = sinon.fakeServer.create();

      spandex.getSuggestions('ultramonstrosityquotient', 'optimus', 2);

      var url = server.requests[0].url;
      expect(server.requests).to.have.length(1);
      expect(url).to.match(new RegExp('\/columns\/ultramonstrosityquotient\/suggest.+text=optimus.+limit=2'));

      server.restore();
    });

    it('rejects the promise if spandex returns an error', (done) => {
      var spandex = new SpandexDataProvider({ domain, datasetUid });
      var server = sinon.fakeServer.create();

      server.respondWith([ 403, { 'Content-Type': 'text/html', 'Content-Length': 3 }, 'BAD' ]);

      spandex.getSuggestions('ultramonstrosityquotient', 'optimus', 2).
        then(() => { throw new Error('Expected promise to be rejected'); }).
        catch(() => done());

      server.respond();
      server.restore();
    });
  });
});
