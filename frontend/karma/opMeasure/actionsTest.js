import { assert } from 'chai';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as editorActions from 'actions/editor';
import * as viewActions from 'actions/view';

import { __RewireAPI__ as EditorActionsAPI } from 'actions/editor';

// Tests in this file only cover thunks, since the other (non-thunk) actions are
// generators for constant plain objects with no testable logic.
describe('thunk actions', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = configureStore([thunk]);
  });

  describe('openEditModal', () => {
    it('clones the view measure and opens the edit modal', (done) => {
      const measure = { test: 'foo' };
      const expectedActions = [
        { type: editorActions.OPEN_EDIT_MODAL, measure }
      ];

      const store = mockStore({
        view: { measure },
        editor: { isEditing: false, measure: null }
      });
      store.dispatch(editorActions.openEditModal());

      _.defer(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        done();
      });
    });
  });

  describe('acceptEditModalChanges', () => {
    it('updates the view measure and closes the edit modal', (done) => {
      const measure = { test: 'foo' };
      const expectedActions = [
        { type: editorActions.ACCEPT_EDIT_MODAL_CHANGES, measure }
      ];

      const store = mockStore({
        view: { measure: null },
        editor: { isEditing: true, measure }
      });
      store.dispatch(editorActions.acceptEditModalChanges());

      _.defer(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        done();
      });
    });
  });

  describe('setDataSource', () => {
    const uid = 'test-test';
    let getRowCountStub;
    let getDatasetMetadataStub;
    let getDisplayableFilterableColumnsStub;
    let viewMetadata;

    afterEach(() => {
      EditorActionsAPI.__ResetDependency__('SoqlDataProvider');
    });

    describe('when a 4x4 has not been provided', () => {
      beforeEach(() => {
        getRowCountStub = sinon.stub();

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });
      });

      it('dispatches setDataSource(undefined)', (done) => {
        const expectedActions = [
          { type: editorActions.SET_DATA_SOURCE_UID, uid: undefined }
        ];

        const store = mockStore();
        store.dispatch(editorActions.setDataSource('four-for'));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.notCalled(getRowCountStub);
          done();
        });
      });
    });

    describe('a valid 4x4 is provided', () => {
      beforeEach(() => {
        viewMetadata = { id: 'test-test', columns: [] };
        getRowCountStub = sinon.stub().resolves(12345);
        getDatasetMetadataStub = sinon.stub().resolves(viewMetadata);
        getDisplayableFilterableColumnsStub = sinon.stub().resolves('displayable filterable');

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });

        EditorActionsAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = getDatasetMetadataStub;
          this.getDisplayableFilterableColumns = getDisplayableFilterableColumnsStub;
        });
      });

      it('dispatches receiveDataSourceMetadata', (done) => {
        const expectedActions = [
          {
            type: editorActions.SET_DATA_SOURCE_UID,
            uid
          },
          {
            type: editorActions.RECEIVE_DATA_SOURCE_METADATA,
            rowCount: 12345,
            dataSourceViewMetadata: viewMetadata,
            displayableFilterableColumns: 'displayable filterable'
          }
        ];

        const store = mockStore();
        store.dispatch(editorActions.setDataSource(uid));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.calledOnce(getRowCountStub);
          sinon.assert.calledOnce(getDatasetMetadataStub);
          done();
        });
      });
    });
  });
});
