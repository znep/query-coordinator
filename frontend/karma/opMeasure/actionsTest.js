import { assert } from 'chai';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as editorActions from 'actions/editor';
import * as validateActions from 'actions/validate';

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
      const dateColumn = { name: 'columnA', renderTypeName: 'calendar_date'};
      const getDisplayableFilterableColumnsStub = sinon.stub().resolves([dateColumn]);

      beforeEach(() => {
        EditorActionsAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = _.noop;
          this.getDisplayableFilterableColumns = getDisplayableFilterableColumnsStub;
        });
        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = _.noop;
        });
      });

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
          editorActions.SET_DATA_SOURCE_METADATA_SUCCESS,
          editorActions.OPEN_EDIT_MODAL
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
          editorActions.OPEN_EDIT_MODAL
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
        const coreView = { name: 'test core view' };
        const expectedActions = [
          { type: validateActions.VALIDATE_ALL },
          { type: editorActions.ACCEPT_EDIT_MODAL_CHANGES, measure, coreView }
        ];

        const store = mockStore({
          view: { measure: null, coreView },
          editor: { isEditing: true, measure, coreView }
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

  describe('changeDataSource', () => {
    const uid = 'test-test';
    const dateColumn = { name: 'columnA', renderTypeName: 'calendar_date'};

    let getRowCountStub;
    let getDatasetMetadataStub;
    let getDisplayableFilterableColumnsStub;
    let viewMetadata;

    afterEach(() => {
      EditorActionsAPI.__ResetDependency__('SoqlDataProvider');
    });

    describe('a valid 4x4 is provided', () => {
      beforeEach(() => {
        viewMetadata = { id: 'test-test', columns: [] };
        getRowCountStub = sinon.stub().resolves(12345);
        getDatasetMetadataStub = sinon.stub().resolves(viewMetadata);
        getDisplayableFilterableColumnsStub = sinon.stub().resolves([dateColumn]);

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });

        EditorActionsAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = getDatasetMetadataStub;
          this.getDisplayableFilterableColumns = getDisplayableFilterableColumnsStub;
        });
      });

      it('dispatches fetchDataSourceView(four-four)', (done) => {
        const expectedActions = [
          {
            uid: 'test-test',
            type: editorActions.SET_DATA_SOURCE_METADATA_SUCCESS,
            rowCount: 12345,
            dataSourceView: viewMetadata,
            displayableFilterableColumns: [dateColumn]
          }
        ];

        const store = mockStore();
        store.dispatch(editorActions.changeDataSource(uid));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.calledOnce(getRowCountStub);
          sinon.assert.calledOnce(getDatasetMetadataStub);
          done();
        });
      });
    });
  });

  describe('fetchDataSourceView', () => {
    const uid = 'test-test';
    const dateColumn = { name: 'columnA', renderTypeName: 'calendar_date'};

    let getRowCountStub;
    let getDatasetMetadataStub;
    let getDisplayableFilterableColumnsStub;
    let viewMetadata;

    afterEach(() => {
      EditorActionsAPI.__ResetDependency__('SoqlDataProvider');
    });

    describe('when a valid 4x4 is provided', () => {
      beforeEach(() => {
        viewMetadata = { id: 'test-test', columns: [] };
        getRowCountStub = sinon.stub().resolves(12345);
        getDatasetMetadataStub = sinon.stub().resolves(viewMetadata);
        getDisplayableFilterableColumnsStub = sinon.stub().resolves([dateColumn]);

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });

        EditorActionsAPI.__Rewire__('MetadataProvider', function() {
          this.getDatasetMetadata = getDatasetMetadataStub;
          this.getDisplayableFilterableColumns = getDisplayableFilterableColumnsStub;
        });
      });

      describe('for a dataset with a date column', () => {
        it('dispatches setDataSourceMetadataSuccess', (done) => {
          const expectedActions = [
            {
              type: editorActions.SET_DATA_SOURCE_METADATA_SUCCESS,
              uid: 'test-test',
              rowCount: 12345,
              dataSourceView: viewMetadata,
              displayableFilterableColumns: [dateColumn]
            }
          ];

          const store = mockStore();
          store.dispatch(editorActions.fetchDataSourceView(uid));

          _.defer(() => {
            assert.deepEqual(store.getActions(), expectedActions);
            sinon.assert.calledOnce(getRowCountStub);
            sinon.assert.calledOnce(getDatasetMetadataStub);
            done();
          });
        });
      });

      describe('for a dataset without a date column', () => {
        it('dispatches setDataSourceMetadataFail', (done) => {
          const notADateColumn = { name: 'foo', renderTypeName: 'text' };
          getDisplayableFilterableColumnsStub = sinon.stub().resolves([notADateColumn]);

          const expectedActions = [
            {
              type: editorActions.SET_DATA_SOURCE_METADATA_FAIL
            }
          ];

          const store = mockStore();
          store.dispatch(editorActions.fetchDataSourceView(uid));

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
});
