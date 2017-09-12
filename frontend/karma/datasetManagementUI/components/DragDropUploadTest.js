import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import { DragDropUpload } from 'components/DragDropUpload/DragDropUpload';
import _ from 'lodash';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import mockAPI from '../testHelpers/mockAPI';
import mockSocket from '../testHelpers/mockSocket';
import state from '../data/initialState';
import { bootstrapChannels } from '../data/socketChannels';

const socket = mockSocket(bootstrapChannels);
const mockStore = configureStore([thunk.withExtraArgument(socket)]);

describe('components/DragDropUpload', () => {
  let unmock;

  const fakeEvent = {
    dataTransfer: { files: [{ name: 'testfile.csv' }] },
    preventDefault: () => {},
    stopPropagation: () => {}
  };

  before(() => {
    unmock = mockAPI();
  });

  after(() => {
    unmock();
  });

  it('calls createUpload on drop', done => {
    const fakeStore = mockStore(state);

    const component = shallow(
      <DragDropUpload dispatch={fakeStore.dispatch} params={{}} />,
      {
        context: { store: fakeStore }
      }
    );

    component.find('.dropZone').simulate('drop', fakeEvent);

    setTimeout(() => {
      const actions = fakeStore.getActions();
      const expectedAction = actions.filter(
        action =>
          action.operation === 'CREATE_UPLOAD' &&
          action.callParams.source_type.filename === 'testfile.csv'
      );
      assert.equal(expectedAction.length, 1);
      done();
    }, 100);
  });

  it('displays an error if dropped file has unsupported extension', done => {
    const fakeStore = mockStore(state);

    const component = shallow(
      <DragDropUpload dispatch={fakeStore.dispatch} params={{}} />,
      {
        context: { store: fakeStore }
      }
    );

    component.find('.dropZone').simulate('drop', {
      dataTransfer: { files: [{ name: 'testfile.png' }] },
      preventDefault: () => {},
      stopPropagation: () => {}
    });

    setTimeout(() => {
      const actions = fakeStore.getActions();

      const wrongAction = actions.filter(
        action =>
          action.operation === 'CREATE_UPLOAD' &&
          action.params.filename === 'testfile.csv'
      );

      const rightAction = actions.filter(
        action =>
          action.type === 'SHOW_FLASH_MESSAGE' && action.kind === 'error'
      );

      assert.equal(wrongAction.length, 0);
      assert.equal(rightAction.length, 1);
      done();
    }, 100);
  });

  it('updates state properly on dragover', () => {
    const component = shallow(<DragDropUpload dispatch={_.noop} params={{}} />);
    const initialState = component.state('draggingOver');
    component.find('.dropZone').simulate('dragover', fakeEvent);
    const updatedState = component.state('draggingOver');
    assert.isFalse(initialState);
    assert.isTrue(updatedState);
  });

  it('updates state properly on dragleave', () => {
    const component = shallow(<DragDropUpload dispatch={_.noop} params={{}} />);
    component.find('.dropZone').simulate('dragover', fakeEvent);
    const initialState = component.state('draggingOver');
    component.find('.dropZone').simulate('dragleave', fakeEvent);
    const updatedState = component.state('draggingOver');
    assert.isTrue(initialState);
    assert.isFalse(updatedState);
  });
});