import { assert } from 'chai';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { DataSourceStates } from 'lib/constants';
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

  describe('launchEditModal', () => {
    it('clones the view measure and opens the edit modal', (done) => {
      const measure = { test: 'foo' };
      const expectedActions = [
        { type: editorActions.CLONE_MEASURE, measure },
        { type: editorActions.OPEN_EDIT_MODAL }
      ];

      const store = mockStore({
        view: { measure },
        editor: { isEditing: false, measure: null }
      });
      store.dispatch(editorActions.launchEditModal());

      _.defer(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        done();
      });
    });
  });

  describe('completeEditModal', () => {
    it('updates the view measure and closes the edit modal', (done) => {
      const measure = { test: 'foo' };
      const expectedActions = [
        { type: viewActions.UPDATE_MEASURE, measure },
        { type: editorActions.CLOSE_EDIT_MODAL }
      ];

      const store = mockStore({
        view: { measure: null },
        editor: { isEditing: true, measure }
      });
      store.dispatch(editorActions.completeEditModal());

      _.defer(() => {
        assert.deepEqual(store.getActions(), expectedActions);
        done();
      });
    });
  });

  describe('setDataSource', () => {
    const uid = 'test-test';
    let getRowCountStub;

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

      it('unsets status', (done) => {
        const dataSource = { status: null, uid: undefined };
        const expectedActions = [
          { type: editorActions.RECEIVE_DATA_SOURCE, dataSource }
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

    describe('when a 4x4 to a dataset with rows has been provided', () => {
      beforeEach(() => {
        getRowCountStub = sinon.stub().resolves(1);

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });
      });

      it('sets status to VALID', (done) => {
        const dataSource = { status: DataSourceStates.VALID, uid };
        const expectedActions = [
          { type: editorActions.REQUEST_DATA_SOURCE },
          { type: editorActions.RECEIVE_DATA_SOURCE, dataSource }
        ];

        const store = mockStore();
        store.dispatch(editorActions.setDataSource(uid));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.calledOnce(getRowCountStub);
          done();
        });
      });
    });

    describe('when a 4x4 to a dataset with no rows has been provided', () => {
      beforeEach(() => {
        getRowCountStub = sinon.stub().resolves(0);

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });
      });

      it('sets status to NO_ROWS', (done) => {
        const dataSource = { status: DataSourceStates.NO_ROWS, uid };
        const expectedActions = [
          { type: editorActions.REQUEST_DATA_SOURCE },
          { type: editorActions.RECEIVE_DATA_SOURCE, dataSource }
        ];

        const store = mockStore();
        store.dispatch(editorActions.setDataSource(uid));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.calledOnce(getRowCountStub);
          done();
        });
      });
    });

    describe('when a 4x4 has been provided but does not resolve to a dataset', () => {
      beforeEach(() => {
        getRowCountStub = sinon.stub().rejects('NOT FOUND!');

        EditorActionsAPI.__Rewire__('SoqlDataProvider', function() {
          this.getRowCount = getRowCountStub;
        });
      });

      it('sets status to INVALID', (done) => {
        const dataSource = { status: DataSourceStates.INVALID, uid };
        const expectedActions = [
          { type: editorActions.REQUEST_DATA_SOURCE },
          { type: editorActions.RECEIVE_DATA_SOURCE, dataSource }
        ];

        const store = mockStore();
        store.dispatch(editorActions.setDataSource(uid));

        _.defer(() => {
          assert.deepEqual(store.getActions(), expectedActions);
          sinon.assert.calledOnce(getRowCountStub);
          done();
        });
      });
    });
  });
});
