import { assert } from 'chai';
import notificationReducer from 'datasetManagementUI/reduxStuff/reducers/notifications';
import { addNotification, removeNotification } from 'datasetManagementUI/reduxStuff/actions/notifications';

describe('notification reducer', () => {
  it('handles ADD_NOTIFICATION', () => {
    const action = addNotification(
      'source',
      121
    );
    const state = notificationReducer(undefined, action);

    assert.equal(state[0].kind, action.notification.kind);
    assert.equal(state[0].subject, 121);
  });

  it('handles REMOVE_NOTIFICATION', () => {
    const action = addNotification(
      'source',
      121
    );

    const state = notificationReducer(undefined, action);

    const removeAction = removeNotification(121);

    const newState = notificationReducer(state, removeAction);

    assert.equal(newState.length, 0);
  });
});
