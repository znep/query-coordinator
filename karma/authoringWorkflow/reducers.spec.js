import thunk from 'redux-thunk';
import reducer from 'src/authoringWorkflow/reducers';
import defaultVif from 'src/authoringWorkflow/defaultVif';
import * as actions from 'src/authoringWorkflow/actions';

// Note: by convention, reducers return their default state when passed undefined.
function getDefaultState() {
  return reducer();
}

describe('AuthoringWorkflow reducer', function() {
  describe('vif', function() {
    it('returns the default state if the input state is undefined', function() {
      expect(getDefaultState().vif).to.deep.equal(defaultVif);
    });

    it('ignores weird actions', function() {
      var state = {
        vif: defaultVif
      };

      var badAction = {
        type: 'JAYWALKING'
      };

      expect(reducer(state, badAction).vif).to.deep.equal(defaultVif);
    });

    describe('RECEIVE_DATASET_METADATA', function() {
      it('sets the datasetUid of the series', function() {
        var state = {
          vif: defaultVif
        };

        var action = actions.receiveDatasetMetadata({ id: 'asdf-qwer' });
        var newState = reducer(state, action);
        expect(newState.vif.series[0].dataSource.datasetUid).to.equal('asdf-qwer');
      });
    });

    describe('HANDLE_DATASET_METADATA_ERROR', function() {
      it('clears the datasetUid of the series', function() {
        var state = {
          vif: _.merge(defaultVif, {
            series: [
              { datasetUid: 'asdf-qwer' }
            ]
          })
        };

        var action = actions.handleDatasetMetadataError();
        var newState = reducer(state, action);
        expect(newState.vif.series[0].dataSource.datasetUid).to.equal(null);
      });
    });

    describe('SET_CHART_TYPE', function() {
      it('sets the chart type', function() {
        var chartType = 'columnChart';
        var state = {
          vif: defaultVif
        };

        var action = actions.setChartType(chartType);
        var newState = reducer(state, action);
        expect(newState.vif.series[0].type).to.equal(chartType);
      });
    });

    describe('SET_TITLE', function() {
      it('sets the title', function() {
        var title = 'Oh, yeah!';
        var state = {
          vif: defaultVif
        };

        var action = actions.setTitle(title);
        var newState = reducer(state, action);

        expect(newState.vif.title).to.equal(title);
      });
    });

    describe('SET_DESCRIPTION', function() {
      it('sets the description', function() {
        var description = 'Oh, no!';
        var state = {
          vif: defaultVif
        };

        var action = actions.setDescription(description);
        var newState = reducer(state, action);

        expect(newState.vif.description).to.equal(description);
      });
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
