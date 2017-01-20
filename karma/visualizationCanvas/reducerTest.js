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
  setFilters
} from 'actions';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import mockVif from 'data/mockVif';
import mockFilter from 'data/mockFilter';

describe('Reducer', () => {
  let state;

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
  });

  describe('ENTER_EDIT_MODE', () => {
    it('sets mode to "edit"', () => {
      const state = reducer(state, enterEditMode());
      expect(state.mode).to.be.equal('edit');
    });
  });

  describe('ENTER_PREVIEW_MODE', () => {
    it('sets mode to "preview"', () => {
      const state = reducer(state, enterPreviewMode());
      expect(state.mode).to.equal('preview')
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

  describe('UPDATE_TITLE_AND_DESCRIPTION', () => {
    before(() => {
      state = reducer(state, openEditMenu());
      state = reducer(state, updateNameAndDescription({
        name: 'some name',
        description: 'some description'
      }));
    });

    it('sets the title to a new value', () => {
      expect(state.view.name).to.equal('some name');
    });

    it('sets the description to a new value', () => {
      expect(state.view.description).to.equal('some description');
    });

    it('sets isEditMenuActive to false', () => {
      expect(state.isEditMenuActive).to.be.false;
    });
  });

  describe('SET_FILTERS', () => {
    before(() => {
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
  });
});
