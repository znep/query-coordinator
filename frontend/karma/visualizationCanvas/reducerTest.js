import { assert } from 'chai';
import reducer from 'reducer';
import * as actions from 'actions';
import { ModeStates, SaveStates } from 'lib/constants';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import mockVif from 'data/mockVif';
import mockFilter from 'data/mockFilter';

const INITIAL_STATES = {
  savedView: {
    view: mockView,
    parentView: mockParentView,
    vifs: [mockVif],
    filters: []
  },
  ephemeralViewNoVif: {
    view: _.omit('id', mockView),
    parentView: mockParentView,
    vifs: [],
    filters: []
  },
  ephemeralViewWithVif: {
    view: _.omit('id', mockView),
    parentView: mockParentView,
    vifs: [mockVif],
    filters: []
  }
};

describe('Reducer', () => {
  let state;

  // Prevent individual tests from interacting with each other.
  afterEach(() => {
    state = undefined;
  });

  // Shared examples
  const sharedExamples = {
    beforeEachSetInitialState(initialState) {
      beforeEach(() => {
        window.initialState = initialState;
        state = reducer();
      });
    },

    itSetsDataSourceUrl() {
      it('sets dataSourceUrl to the dataset', () => {
        assert.equal(
          state.dataSourceUrl,
          `https://${window.location.host}/mock-parent-view-path`
        );
      });
    },

    itSetsVisualizationUrlTo(value) {
      it(`sets visualizationUrl to ${value}`, () => {
        assert.equal(state.visualizationUrl, value);
      });
    },

    itSetsVifOriginTo(value) {
      it('sets origin information on the vifs', () => {
        assert.deepEqual(
          state.vifs[0].origin,
          value
        );
      });
    }
  };

  describe('starting from an empty ephemeral view', () => {
    sharedExamples.beforeEachSetInitialState(INITIAL_STATES.ephemeralViewNoVif);

    sharedExamples.itSetsDataSourceUrl();
    sharedExamples.itSetsVisualizationUrlTo(null);
  });

  describe('starting from an ephemeral view with a vif', () => {

    const mockVifOrigin = {
      type: 'visualization_canvas'
    };

    const mockVifWithOrigin = _.extend(
      {},
      mockVif,
      { origin: mockVifOrigin }
    );

    sharedExamples.beforeEachSetInitialState(INITIAL_STATES.ephemeralViewWithVif);

    sharedExamples.itSetsDataSourceUrl();
    sharedExamples.itSetsVisualizationUrlTo(null);
    sharedExamples.itSetsVifOriginTo({
      type: 'visualization_canvas'
    });

    describe('OPEN_SHARE_MODAL', () => {
      beforeEach(() => {
        state = reducer(state, actions.openShareModal({
          vifIndex: 0
        }));
      });

      it('sets up vif, vifIndex, isActive, and embedSize in state', () => {
        assert.deepEqual(state.shareModal, {
          vif: mockVifWithOrigin,
          vifIndex: 0,
          isActive: true,
          embedSize: 'large'
        });
      });
    });
  });

  describe('starting from a saved view', () => {

    const mockVifOrigin = {
      type: 'visualization_canvas',
      url: `https://${window.location.host}/d/test-view`
    };

    const mockVifWithOrigin = _.extend(
      {},
      mockVif,
      { origin: mockVifOrigin }
    );

    const makeStateDirty = () => {
      state = reducer(state, actions.updateNameAndDescription({ name: '', description: '' }));
      assert.isTrue(state.isDirty);
      return state;
    };

    beforeEach(() => {
      window.serverConfig = {
        domain: 'wombats-in-space.com'
      };
    });

    sharedExamples.beforeEachSetInitialState(INITIAL_STATES.savedView);

    sharedExamples.itSetsDataSourceUrl();
    sharedExamples.itSetsVisualizationUrlTo(`https://${window.location.host}/d/test-view`);
    sharedExamples.itSetsVifOriginTo(mockVifOrigin);

    describe('ADD_VISUALIZATION', () => {
      beforeEach(() => {
        state = reducer(state, actions.addVisualization());
      });

      it('sets authoringWorkflow.isActive to true', () => {
        assert.isTrue(state.authoringWorkflow.isActive);
      });

      it('sets the authoringWorkflow vifIndex to next index in VIFs array', () => {
        assert.equal(state.authoringWorkflow.vifIndex, 1);
      });

      it('sets a default VIF for the authoringWorkflow', () => {
        const dataSource = state.authoringWorkflow.vif.series[0].dataSource;

        assert.isTrue(_.isPlainObject(state.authoringWorkflow.vif));
        assert.equal(dataSource.domain, 'wombats-in-space.com');
        assert.equal(dataSource.datasetUid, mockParentView.id);
      });
    });

    describe('EDIT_VISUALIZATION', () => {
      beforeEach(() => {
        state = reducer(state, actions.editVisualization({
          vifIndex: 0,
          vifs: [mockVifWithOrigin]
        }));
      });

      it('sets authoringWorkflow.isActive to true', () => {
        assert.isTrue(state.authoringWorkflow.isActive);
      });

      it('sets the authoringWorkflow.vif to vif at index vifIndex', () => {
        assert.deepEqual(state.authoringWorkflow.vif, mockVifWithOrigin);
      });
    });

    describe('CANCEL_EDITING_VISUALIZATION', () => {
      beforeEach(() => {
        state = reducer(state, actions.addVisualization());
        state = reducer(state, actions.cancelEditingVisualization());
      });

      it('sets authoringWorkflow.isActive to false', () => {
        assert.isFalse(state.authoringWorkflow.isActive);
      });

      it('removes authoringWorkflow VIF and vifIndex', () => {
        assert.isUndefined(state.authoringWorkflow.vif);
        assert.isUndefined(state.authoringWorkflow.vifIndex);
      });
    });

    describe('UPDATE_VISUALIZATION', () => {
      let newVif;

      beforeEach(() => {
        newVif = {
          name: 'potato',
          origin: mockVifOrigin
        };
        state = reducer(state, actions.clearSaveState());
        state = reducer(state, actions.addVisualization());
        state = reducer(state, actions.updateVisualization({
          vif: newVif,
          filters: [mockFilter, mockFilter, mockFilter]
        }));
      });

      it('sets authoringWorkflow.isActive to false', () => {
        assert.isFalse(state.authoringWorkflow.isActive);
      });

      it('removes authoringWorkflow VIF and vifIndex', () => {
        assert.isUndefined(state.authoringWorkflow.vif);
        assert.isUndefined(state.authoringWorkflow.vifIndex);
      });

      it('updates the VIFs array', () => {
        assert.deepEqual(state.vifs, [mockVifWithOrigin, newVif]);
      });

      it('updates the filters', () => {
        assert.deepEqual(state.filters, [mockFilter, mockFilter, mockFilter]);
      });

      it('sets isDirty to true', () => {
        assert.isTrue(state.isDirty);
      });
    });

    describe('ENTER_EDIT_MODE', () => {
      it('sets mode to "edit"', () => {
        const state = reducer(state, actions.enterEditMode());
        assert.equal(state.mode, ModeStates.EDIT);
      });
    });

    describe('ENTER_PREVIEW_MODE', () => {
      it('sets mode to "preview"', () => {
        const state = reducer(state, actions.enterPreviewMode());
        assert.equal(state.mode, ModeStates.PREVIEW);
      });
    });

    describe('OPEN_EDIT_MENU', () => {
      it('opens the edit menu', () => {
        const state = reducer(state, actions.openEditMenu());
        assert.isTrue(state.isEditMenuActive);
      });
    });

    describe('CLOSE_EDIT_MENU', () => {
      it('closes the edit menu', () => {
        const state = reducer(state, actions.closeEditMenu());
        assert.isFalse(state.isEditMenuActive);
      });
    });

    describe('UPDATE_NAME_AND_DESCRIPTION', () => {
      beforeEach(() => {
        state = reducer(state, actions.clearSaveState());
        state = reducer(state, actions.openEditMenu());
        state = reducer(state, actions.updateNameAndDescription({
          name: 'some name',
          description: 'some description'
        }));
      });

      it('sets the name to a new value', () => {
        assert.equal(state.view.name, 'some name');
      });

      it('sets the description to a new value', () => {
        assert.equal(state.view.description, 'some description');
      });

      it('sets isEditMenuActive to false', () => {
        assert.isFalse(state.isEditMenuActive);
      });

      it('sets isDirty to true', () => {
        assert.isTrue(state.isDirty);
      });
    });

    describe('SET_FILTERS', () => {
      beforeEach(() => {
        state = reducer(state, actions.clearSaveState());
        state = reducer(state, actions.addVisualization());
        state = reducer(state, actions.updateVisualization({ vif: mockVif }));
        state = reducer(state, actions.setFilters([mockFilter]));
      });

       it('sets the filters array', () => {
         assert.deepEqual(state.filters, [mockFilter]);
       });

       it('sets the filters for each vif', () => {
         const seriesHasExpectedFilters = _.matchesProperty('dataSource.filters', state.filters);
         const vifHasExpectedFilters = (vif) => _.every(vif.series, seriesHasExpectedFilters);
         assert.isTrue(_.every(state.vifs, vifHasExpectedFilters));
       });

      it('sets isDirty to true', () => {
        assert.isTrue(state.isDirty);
      });
    });

    describe('SET_MAP_CENTER_AND_ZOOM', () => {
      let data;

      beforeEach(() => {
        data = {
          centerAndZoom: { center: { lat: 33, lng: -92 }, zoom: 8 },
          vifIndex: 0
        };
        state = reducer(state, actions.setMapCenterAndZoom(data));
      });

      it('sets the center and zoom for the provided index', () => {
        assert.equal(state.vifs[0].configuration.mapCenterAndZoom, data.centerAndZoom);
      });

      it('sets isDirty to true', () => {
        assert.isTrue(state.isDirty);
      });
    });

    describe('SET_MAP_NOTIFICATION_DISMISSED', () => {
      beforeEach(() => {
        state = reducer(state, actions.setMapNotificationDismissed({ vifIndex: 0 }));
      });

      it('sets the mapNotificationDismissed to true for the provided index', () => {
        assert.isTrue(state.mapNotificationDismissed[0]);
      });
    });

    describe('RECEIVED_COLUMN_STATS', () => {
      beforeEach(() => {
        state = reducer(state, actions.receivedColumnStats('purple'));
      });

      it('sets columnStats', () => {
        assert.equal(state.columnStats, 'purple');
      });
    });

    describe('REQUESTED_SAVE', () => {
      beforeEach(() => {
        state = reducer(state, actions.requestedSave());
      });

      it('sets the save state to saving', () => {
        assert.equal(state.saveState, SaveStates.SAVING);
      });
    });

    describe('HANDLE_SAVE_SUCCESS', () => {
      const response = {
        id: 'test-view',
        createdAt: 'today'
      };

      beforeEach(() => {
        state = makeStateDirty();
        state = reducer(state, actions.handleSaveSuccess(response));
      });

      it('sets the save state to saved', () => {
        assert.equal(state.saveState, SaveStates.SAVED);
      });

      it('sets isDirty to false', () => {
        assert.isFalse(state.isDirty);
      });
    });

    describe('HANDLE_SAVE_ERROR', () => {
      beforeEach(() => {
        state = makeStateDirty();
        state = reducer(state, actions.handleSaveError());
      });

      it('does not modify isDirty', () => {
        assert.isTrue(state.isDirty);
      });

      it('sets save state to errored', () => {
        assert.equal(state.saveState, SaveStates.ERRORED);
      });
    });

    describe('CLEAR_SAVE_STATE', () => {
      beforeEach(() => {
        state = reducer(state, actions.requestedSave());
        assert.equal(state.saveState, SaveStates.SAVING);
        state = reducer(state, actions.clearSaveState());
      });

      it('sets save state to idle', () => {
        assert.equal(state.saveState, SaveStates.IDLE);
      });
    });

    describe('OPEN_SHARE_MODAL', () => {
      beforeEach(() => {
        state = reducer(undefined, actions.openShareModal({
          vifIndex: 0
        }));
      });

      it('sets up vif, vifIndex, isActive, and embedSize in state', () => {
        assert.deepEqual(state.shareModal, {
          vif: mockVifWithOrigin,
          vifIndex: 0,
          isActive: true,
          embedSize: 'large'
        });
      });

      describe('then SET_EMBED_SIZE', () => {
        const newSize = 'medium';

        it('sets just shareModal.embedSize', () => {
          const stateAfterSetEmbedSize = reducer(state, actions.setEmbedSize(newSize));
          assert.deepEqual(stateAfterSetEmbedSize.shareModal, {
            vif: mockVifWithOrigin,
            vifIndex: 0,
            isActive: true,
            embedSize: newSize
          });
        });
      });

      describe('then CLOSE_SHARE_MODAL', () => {
        it('clears isActive', () => {
          const stateAfterClose = reducer(state, actions.closeShareModal());
          assert.isFalse(stateAfterClose.shareModal.isActive);
        });
      });
    });
  });
});
