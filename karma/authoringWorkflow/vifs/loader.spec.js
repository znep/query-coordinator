import { load } from 'src/authoringWorkflow/vifs/loader';
import testStore from '../testStore';
import testData from  '../testData'

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

    beforeEach(function() {
      store = testStore();
      dispatch = store.dispatch;
    });

    describe('columnChart', function() {
      propagatesChangesStore('columnChart');
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
