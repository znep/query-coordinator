import reducer from 'reducer';
import {
  addVisualization,
  editVisualization,
  cancelEditingVisualization,
  updateVisualization,
  enterPreviewMode,
  enterEditMode,
  openEditMenu,
  updateNameAndDescription,
  closeEditMenu,
  setFilters,
  receivedColumnStats,
  requestedSave,
  handleSaveSuccess,
  handleSaveError,
  clearSaveState
} from 'actions';
import { ModeStates, SaveStates } from 'lib/constants';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import mockVif from 'data/mockVif';
import mockFilter from 'data/mockFilter';

describe('Reducer', () => {
  let state;

  const makeStateDirty = () => {
    state = reducer(state, updateNameAndDescription({ name: '', description: '' }));
    expect(state.isDirty).to.equal(true);
    return state;
  };

  before(() => {
    window.serverConfig = {
      domain: 'wombats-in-space.com'
    };
    window.initialState = {
      view: mockView,
      parentView: mockParentView,
      vifs: [mockVif],
      filters: []
    };

    state = reducer();
  });

  describe('ADD_VISUALIZATION', () => {
    before(() => {
      state = reducer(state, addVisualization());
    });

    it('sets authoringWorkflow.isActive to true', () => {
      expect(state.authoringWorkflow.isActive).to.be.true;
    });

    it('sets the authoringWorkflow vifIndex to next index in VIFs array', () => {
      expect(state.authoringWorkflow.vifIndex).to.eql(1);
    });

    it('sets a default VIF for the authoringWorkflow', () => {
      const dataSource = state.authoringWorkflow.vif.series[0].dataSource;

      expect(_.isObject(state.authoringWorkflow.vif)).to.be.ok;
      expect(dataSource.domain).to.eql('wombats-in-space.com');
      expect(dataSource.datasetUid).to.eql(mockParentView.id);
    });
  });

  describe('EDIT_VISUALIZATION', () => {
    before(() => {
      state = reducer(state, editVisualization({
        vifIndex: 0,
        vifs: [mockVif]
      }));
    });

    it('sets authoringWorkflow.isActive to true', () => {
      expect(state.authoringWorkflow.isActive).to.be.true;
    });

    it('sets the authoringWorkflow.vif to vif at index vifIndex', () => {
      expect(state.authoringWorkflow.vif).to.eql(mockVif);
    });

    it('throws an error if vifIndex is out of range', () => {
      expect(() => reducer(state, editVisualization({ vifIndex: 3, vifs: [mockVif] })).to.throw(/invalid vifIndex/));
    });
  });

  describe('CANCEL_EDITING_VISUALIZATION', () => {
    before(() => {
      state = reducer(state, addVisualization());
      state = reducer(state, cancelEditingVisualization());
    });

    it('sets authoringWorkflow.isActive to false', () => {
      expect(state.authoringWorkflow.isActive).to.be.false;
    });

    it('removes authoringWorkflow VIF and vifIndex', () => {
      expect(state.authoringWorkflow.vif).to.be.undefined;
      expect(state.authoringWorkflow.vifIndex).to.be.undefined;
    });
  });

  describe('UPDATE_VISUALIZATION', () => {
    let newVif;

    before(() => {
      newVif = { name: 'potato' };
      state = reducer(state, clearSaveState());
      state = reducer(state, addVisualization());
      state = reducer(state, updateVisualization({
        vif: newVif,
        filters: [mockFilter, mockFilter, mockFilter]
      }));
    });

    it('sets authoringWorkflow.isActive to false', () => {
      expect(state.authoringWorkflow.isActive).to.be.false;
    });

    it('removes authoringWorkflow VIF and vifIndex', () => {
      expect(state.authoringWorkflow.vif).to.be.undefined;
      expect(state.authoringWorkflow.vifIndex).to.be.undefined;
    });

    it('updates the VIFs array', () => {
      expect(state.vifs).to.eql([mockVif, newVif]);
    });

    it('updates the filters', () => {
      expect(state.filters).to.deep.equal([mockFilter, mockFilter, mockFilter]);
    });

    it('sets isDirty to true', () => {
      expect(state.isDirty).to.equal(true);
    });
  });

  describe('ENTER_EDIT_MODE', () => {
    it('sets mode to "edit"', () => {
      const state = reducer(state, enterEditMode());
      expect(state.mode).to.be.equal(ModeStates.EDIT);
    });
  });

  describe('ENTER_PREVIEW_MODE', () => {
    it('sets mode to "preview"', () => {
      const state = reducer(state, enterPreviewMode());
      expect(state.mode).to.equal(ModeStates.PREVIEW)
    });
  });

  describe('OPEN_EDIT_MENU', () => {
    it('opens the edit menu', () => {
      const state = reducer(state, openEditMenu());
      expect(state.isEditMenuActive).to.be.true;
    });
  });

  describe('CLOSE_EDIT_MENU', () => {
    it('closes the edit menu', () => {
      const state = reducer(state, closeEditMenu());
      expect(state.isEditMenuActive).to.be.false;
    });
  });

  describe('UPDATE_NAME_AND_DESCRIPTION', () => {
    before(() => {
      state = reducer(state, clearSaveState());
      state = reducer(state, openEditMenu());
      state = reducer(state, updateNameAndDescription({
        name: 'some name',
        description: 'some description'
      }));
    });

    it('sets the name to a new value', () => {
      expect(state.view.name).to.equal('some name');
    });

    it('sets the description to a new value', () => {
      expect(state.view.description).to.equal('some description');
    });

    it('sets isEditMenuActive to false', () => {
      expect(state.isEditMenuActive).to.be.false;
    });

    it('sets isDirty to true', () => {
      expect(state.isDirty).to.equal(true);
    });
  });

  describe('SET_FILTERS', () => {
    before(() => {
      state = reducer(state, clearSaveState());
      state = reducer(state, addVisualization());
      state = reducer(state, updateVisualization({ vif: mockVif }));
      state = reducer(state, setFilters([mockFilter]));
    });

     it('sets the filters array', () => {
       expect(state.filters).to.deep.equal([mockFilter]);
     });

     it('sets the filters for each vif', () => {
       const seriesHasExpectedFilters = _.matchesProperty('dataSource.filters', state.filters);
       const vifHasExpectedFilters = (vif) => _.every(vif.series, seriesHasExpectedFilters);
       expect(_.every(state.vifs, vifHasExpectedFilters)).to.equal(true);
     });

    it('sets isDirty to true', () => {
      expect(state.isDirty).to.equal(true);
    });
  });

  describe('RECEIVED_COLUMN_STATS', () => {
    before(() => {
      state = reducer(state, receivedColumnStats('purple'));
    });

    it('sets columnStats', () => {
      expect(state.columnStats).to.equal('purple');
    });
  });

  describe('REQUESTED_SAVE', () => {
    before(() => {
      state = reducer(state, requestedSave());
    });

    it('sets the save state to saving', () => {
      expect(state.saveState).to.equal(SaveStates.SAVING);
    });
  });

  describe('HANDLE_SAVE_SUCCESS', () => {
    const response = {
      id: 'test-view',
      createdAt: 'today'
    };

    before(() => {
      state = makeStateDirty();
      state = reducer(state, handleSaveSuccess(response));
    });

    it('sets the save state to saved', () => {
      expect(state.saveState).to.equal(SaveStates.SAVED);
    });

    it('sets isDirty to false', () => {
      expect(state.isDirty).to.equal(false);
    });
  });

  describe('HANDLE_SAVE_ERROR', () => {
    before(() => {
      state = makeStateDirty();
      state = reducer(state, handleSaveError());
    });

    it('does not modify isDirty', () => {
      expect(state.isDirty).to.equal(true);
    });

    it('sets save state to errored', () => {
      expect(state.saveState).to.equal(SaveStates.ERRORED);
    });
  });

  describe('CLEAR_SAVE_STATE', () => {
    before(() => {
      state = reducer(state, requestedSave());
      expect(state.saveState).to.equal(SaveStates.SAVING);
      state = reducer(state, clearSaveState());
    });

    it('sets save state to idle', () => {
      expect(state.saveState).to.equal(SaveStates.IDLE);
    });
  });
});
