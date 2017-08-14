import sinon from 'sinon';
import { expect, assert } from 'chai';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import configureStore from 'redux-mock-store';
import ApiCallButton from 'components/ApiCallButtonContainer';
import {
  STATUS_CALL_IN_PROGRESS,
  STATUS_CALL_SUCCEEDED,
  STATUS_CALL_FAILED
} from 'lib/apiCallStatus';

const mockStore = configureStore();

describe('components/ApiCallButton', () => {
  it('calls its onClick callback when clicked', () => {
    const store = mockStore({
      entities: {},
      ui: {
        apiCalls: {}
      }
    });
    const saveSpy = sinon.spy();
    const element = renderComponentWithStore(
      ApiCallButton,
      {
        onClick: saveSpy,
        operation: 'CHANGE_COLUMN_TYPE',
        params: { outputSchemaId: 2, outputColumnId: 32 }
      },
      store
    );

    TestUtils.Simulate.click(element);

    expect(saveSpy.calledOnce).to.eq(true);
  });

  it('renders in a default state when there is no matching api call', () => {
    const store = mockStore({
      entities: {},
      ui: {
        apiCalls: {}
      }
    });
    const saveSpy = sinon.spy();
    const element = renderComponentWithStore(
      ApiCallButton,
      {
        onClick: saveSpy,
        operation: 'CHANGE_COLUMN_TYPE',
        params: { outputSchemaId: 2, outputColumnId: 32 }
      },
      store
    );

    assert.ok(element);
    assert.isTrue(element.classList.contains('btn'));
  });

  const apiCall = {
    operation: 'CHANGE_COLUMN_TYPE',
    params: { outputSchemaId: 2, outputColumnId: 32 }
  };

  it('renders a progress state when there is an in-progress api call', () => {
    const store = mockStore({
      entities: {},
      ui: {
        apiCalls: {
          'asdf-some-uuid': {
            ...apiCall,
            status: STATUS_CALL_IN_PROGRESS,
            startedAt: new Date()
          }
        }
      }
    });
    const saveSpy = sinon.spy();
    const element = renderComponentWithStore(
      ApiCallButton,
      {
        onClick: saveSpy,
        operation: 'CHANGE_COLUMN_TYPE',
        params: { outputSchemaId: 2, outputColumnId: 32 }
      },
      store
    );
    assert.isTrue(element.classList.contains('btn-busy'));
  });

  it('renders a success state when there is a successful api call', () => {
    const store = mockStore({
      entities: {},
      ui: {
        apiCalls: {
          'asdf-some-uuid': {
            ...apiCall,
            status: STATUS_CALL_SUCCEEDED,
            startedAt: new Date(),
            succeededAt: new Date()
          }
        }
      }
    });
    const saveSpy = sinon.spy();
    const element = renderComponentWithStore(
      ApiCallButton,
      {
        onClick: saveSpy,
        operation: 'CHANGE_COLUMN_TYPE',
        params: { outputSchemaId: 2, outputColumnId: 32 }
      },
      store
    );

    assert.ok(element);
    assert.isTrue(element.classList.contains('btn-success'));
  });

  it('renders a failed state when there is a failed api call', () => {
    const store = mockStore({
      entities: {},
      ui: {
        apiCalls: {
          'asdf-some-uuid': {
            ...apiCall,
            status: STATUS_CALL_FAILED,
            startedAt: new Date(),
            succeededAt: new Date()
          }
        }
      }
    });
    const saveSpy = sinon.spy();
    const element = renderComponentWithStore(
      ApiCallButton,
      {
        onClick: saveSpy,
        operation: 'CHANGE_COLUMN_TYPE',
        params: { outputSchemaId: 2, outputColumnId: 32 }
      },
      store
    );

    assert.ok(element);
    assert.isTrue(element.classList.contains('btn-error'));
  });
});
