import thunk from 'redux-thunk';
import reducer from 'src/authoringWorkflow/reducers';
import vifs from 'src/authoringWorkflow/vifs';
import * as actions from 'src/authoringWorkflow/actions';

// Note: by convention, reducers return their default state when passed undefined.
function getDefaultState() {
  return reducer();
}

function getTestState() {
  return _.set({}, 'vifAuthoring.vifs', vifs());
}

function forAllVifs(state, verifier) {
  assert.isAtLeast(_.keys(state.vifAuthoring.vifs).length, 1);
  _.each(state.vifAuthoring.vifs, verifier);
}

describe('AuthoringWorkflow reducer', function() {
  describe('vif', function() {
    it('returns the default state if the input state is undefined', function() {
      assert.deepEqual(getDefaultState().vifAuthoring.vifs, getTestState().vifAuthoring.vifs);
      assert.deepPropertyVal(getDefaultState(), 'vifAuthoring.selectedVisualizationType', 'columnChart');
    });

    it('ignores weird actions', function() {
      var badAction = {
        type: 'JAYWALKING'
      };

      expect(reducer(getTestState(), badAction).vifAuthoring).to.deep.equal(getTestState().vifAuthoring);
    });

    describe('RECEIVE_DATASET_METADATA', function() {
      it('sets the datasetUid of the series', function() {
        var state = getTestState();
        var action = actions.receiveDatasetMetadata({ id: 'asdf-qwer' });
        var newState = reducer(state, action);
        forAllVifs(newState, function(vif, type) {
          assert.equal(
            vif.series[0].dataSource.datasetUid,
            'asdf-qwer',
            `Did not set datasetUid for chart type: ${type}`
          );
        });
      });
    });

    describe('HANDLE_DATASET_METADATA_ERROR', function() {
      it('clears the datasetUid of the series', function() {
        var state = getTestState();
        _.each(state.vifAuthoring.vifs, function(vif) {
          vif.series[0].dataSource.datasetUid = 'asdf-fdsa';
        });

        var action = actions.handleDatasetMetadataError();
        var newState = reducer(state, action);
        forAllVifs(newState, function(vif, type) {
          assert.isNull(
            vif.series[0].dataSource.datasetUid,
            `Did not clear datasetUid for chart type: ${type}`
          );
        });
      });
    });

    describe('vif setters', function() {
      function shouldSetVif(actionName, value, vifPath) {
        it(`sets ${vifPath} to ${value} using ${actionName}`, function() {
          var action = actions[actionName](value);
          var newState = reducer(getTestState(), action);

          forAllVifs(newState, function(vif, type) {
            assert.equal(
              type,
              vif.series[0].type,
              `Mismatch found for chart type: ${type}`
            );
            expect(_.get(vif, vifPath)).to.equal(value);
          });
        });
      }

      shouldSetVif('setTitle', 'Oh, yeah!', 'title');
      shouldSetVif('setDescription', 'columnChart', 'description');
      shouldSetVif('setPrimaryColor', '#00F', 'series[0].color.primary');
      shouldSetVif('setSecondaryColor', '#F00', 'series[0].color.secondary');
      shouldSetVif('setHighlightColor', '#F00', 'series[0].color.highlight');
    });
  });

  describe('datasetMetadata', function() {
    it('returns the default state if the input state is undefined', function() {
      var datasetMetadata = getDefaultState().datasetMetadata;
      expect(datasetMetadata.isLoading).to.equal(false);
      expect(datasetMetadata.data).to.equal(null);
      expect(datasetMetadata.error).to.equal(null);
    });

    describe('REQUEST_DATASET_METADATA', function() {
      var state, action, newState;

      beforeEach(function() {
        state = getDefaultState();
        action = actions.requestDatasetMetadata('asdf-qwer');
        newState = reducer(state, action);
      });

      it('sets isLoading to true', function() {
        expect(newState.datasetMetadata.isLoading).to.equal(true);
      });

      it('clears the data key', function() {
        expect(newState.datasetMetadata.data).to.equal(null);
      });
    });

    describe('RECEIVE_DATASET_METADATA', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          datasetMetadata: {
            isLoading: true
          }
        });

        action = actions.receiveDatasetMetadata({
          id: 'asdf-qwer'
        });

        newState = reducer(state, action);
      });

      it('sets isLoading to false', function() {
        expect(newState.datasetMetadata.isLoading).to.equal(false);
      });

      it('sets the data key', function() {
        expect(newState.datasetMetadata.data).to.deep.equal({ id: 'asdf-qwer' });
      });
    });

    describe('HANDLE_DATASET_METADATA_ERROR', function() {
      var state, action, newState;

      beforeEach(function() {
        state = _.merge(getDefaultState(), {
          datasetMetadata: {
            isLoading: true
          }
        });

        action = actions.handleDatasetMetadataError('error!');
        newState = reducer(state, action);
      });

      it('sets isLoading to false', function() {
        expect(newState.datasetMetadata.isLoading).to.equal(false);
      });

      it('sets the error key', function() {
        expect(newState.datasetMetadata.error).to.equal('error!');
      });
    });
  });
});
