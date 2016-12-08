import reducer from 'reducer';
import {
  addVisualization,
  cancelEditingVisualization,
  updateVisualization,
  enterPreviewMode,
  enterEditMode
} from 'actions';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import mockVif from 'data/mockVif';

describe('Reducer', () => {
  let state;

  before(() => {
    window.serverConfig = {
      domain: 'wombats-in-space.com'
    };
    window.initialState = {
      view: mockView,
      parentView: mockParentView,
      vifs: [mockVif]
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

    it('sets the authoringWorkflow position to next index in VIFs array', () => {
      expect(state.authoringWorkflow.position).to.eql(1);
    });

    it('sets a default VIF for the authoringWorkflow', () => {
      const dataSource = state.authoringWorkflow.vif.series[0].dataSource;

      expect(_.isObject(state.authoringWorkflow.vif)).to.be.ok;
      expect(dataSource.domain).to.eql('wombats-in-space.com');
      expect(dataSource.datasetUid).to.eql(mockParentView.id);
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

    it('removes authoringWorkflow VIF and position', () => {
      expect(state.authoringWorkflow.vif).to.be.undefined;
      expect(state.authoringWorkflow.position).to.be.undefined;
    });
  });

  describe('UPDATE_VISUALIZATION', () => {
    let newVif;

    before(() => {
      newVif = { name: 'potato' };
      state = reducer(state, addVisualization());
      state = reducer(state, updateVisualization({
        vif: newVif
      }));
    });

    it('sets authoringWorkflow.isActive to false', () => {
      expect(state.authoringWorkflow.isActive).to.be.false;
    });

    it('removes authoringWorkflow VIF and position', () => {
      expect(state.authoringWorkflow.vif).to.be.undefined;
      expect(state.authoringWorkflow.position).to.be.undefined;
    });

    it('updates the VIFs array', () => {
      expect(state.vifs).to.eql([mockVif, newVif]);
    });
  });

  describe('ENTER_EDIT_MODE', () => {
    it('sets mode to "edit"', () => {
      const state = reducer(state, enterEditMode());
      expect(state.mode).to.be.eq('edit');
    });
  });

  describe('ENTER_PREVIEW_MODE', () => {
    it('sets mode to "preview"', () => {
      const state = reducer(state, enterPreviewMode());
      expect(state.mode).to.eq('preview')
    });
  });
});
