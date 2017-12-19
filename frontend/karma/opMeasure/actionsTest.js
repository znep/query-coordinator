import { assert } from 'chai';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as editorActions from 'actions/editor';
import * as validateActions from 'actions/validate';
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
    it('clones the view measure coreView and opens the edit modal', (done) => {
      const measure = { test: 'foo' };
      const coreView = { name: 'my measure' };
      const expectedActions = [
        { type: editorActions.OPEN_EDIT_MODAL, measure, coreView }
      ];

      const store = mockStore({
        view: { measure, coreView },
        editor: { isEditing: false, measure: null }
      });
      
      store.dispatch(editorActions.openEditModal());

      _.defer(() => {
        assert.deepEqual(_.take(store.getActions(), 1), expectedActions);
        done();
      });
    });

    describe('when a data source has been configured', () => {
      beforeEach(() => {
        EditorActionsAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = _.noop;
          this.getDisplayableFilterableColumns = _.noop;
        });
        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = _.noop;
        });
      })

      afterEach(() => {
        EditorActionsAPI.__ResetDependency__('MetadataProvider');
        EditorActionsAPI.__ResetDependency__('SoqlDataProvider');
      });

      it('restores non-persisted data source state', (done) => {
        const measure = {
          dataSourceLensUid: 'test-test',
          test: 'foo'
        };
        const expectedActions = [
          editorActions.OPEN_EDIT_MODAL,
          editorActions.SET_DATA_SOURCE_UID,
          editorActions.RECEIVE_DATA_SOURCE_VIEW
        ];

        const store = mockStore({
          view: { measure },
          editor: { isEditing: false, measure: null }
        });
        store.dispatch(editorActions.openEditModal());

        _.defer(() => {
          const actions = _.map(store.getActions(), 'type');
          assert.deepEqual(actions, expectedActions);
          done();
        });
      });
    });

    describe('when a data source has not been configured', () => {
      it('has no non-persisted data source state to restore', (done) => {
        const measure = {
          test: 'foo',
          metric: {
            dataSource: {}
          }
        };
        const expectedActions = [
          editorActions.OPEN_EDIT_MODAL,
          editorActions.SET_DATA_SOURCE_UID
        ];

        const store = mockStore({
          view: { measure },
          editor: { isEditing: false, measure: null }
        });
        store.dispatch(editorActions.openEditModal());

        _.defer(() => {
          const actions = _.map(store.getActions(), 'type');
          assert.deepEqual(actions, expectedActions);
          done();
        });
      });
    });
  });

  describe('acceptEditModalChanges', () => {
    describe('when the edit modal validates', () => {
      it('updates the view measure and closes the edit modal', (done) => {
        const measure = { test: 'foo' };
        const expectedActions = [
          { type: validateActions.VALIDATE_ALL },
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

    describe('when the edit modal does not validate', () => {
      it('halts after validation', (done) => {
        const measure = { test: 'foo' };
        const validationErrors = { example: 'example' };
        const expectedActions = [
          { type: validateActions.VALIDATE_ALL }
        ];

        const store = mockStore({
          view: { measure: null },
          editor: { isEditing: true, measure, validationErrors }
        });
        store.dispatch(editorActions.acceptEditModalChanges());

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          done();
        });
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
            type: editorActions.RECEIVE_DATA_SOURCE_VIEW,
            rowCount: 12345,
            dataSourceView: viewMetadata,
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
