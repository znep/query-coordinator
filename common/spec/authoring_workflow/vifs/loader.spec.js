import { load } from 'common/authoring_workflow/vifs/loader';
import testStore from '../testStore';
import testData from '../testData';

describe('loader', function() {
  describe('load', function() {
    var store;
    var dispatch;
    var propagatesChangesStore = function(visualizationType) {
      it('propagates changes to the store', function() {
        load(dispatch, testData[visualizationType]());
        expect(store.getState().vifAuthoring.vifs[visualizationType]).to.eql(testData[visualizationType]());
      });
    };
    let server;

    const mockMetadata = {
      columns: []
    };

    beforeEach(function() {
      server = sinon.fakeServer.create();
      server.respondImmediately = true;
      server.respondWith(
        'GET',
        'https://example.com/api/views/mock-viif.json?read_from_nbe=true&version=2.1',
        [200, { 'Content-Type': 'application/json' }, JSON.stringify(mockMetadata)]
      );
      server.respondWith(
        'GET',
        'https://example.com/api/curated_regions',
        [200, { 'Content-Type': 'application/json' }, '{}']
      );
      store = testStore();
      dispatch = store.dispatch;
    });

    afterEach(() => {
      server.restore();
    });

    describe('barChart', function() {
      propagatesChangesStore('barChart');
    });

    describe('columnChart', function() {
      propagatesChangesStore('columnChart');
    });

    describe('map', function() {
      propagatesChangesStore('map');
    });

    describe('featureMap', function() {
      propagatesChangesStore('featureMap');
    });

    describe('histogram', function() {
      propagatesChangesStore('histogram');
    });

    describe('regionMap', function() {
      propagatesChangesStore('regionMap');
    });

    describe('timelineChart', function() {
      propagatesChangesStore('timelineChart');
    });
  });
});
