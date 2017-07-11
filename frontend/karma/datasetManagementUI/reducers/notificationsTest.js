import { assert } from 'chai';
import notificationReducer from 'reducers/notifications';
import { addNotification, removeNotification } from 'actions/notifications';

describe('reducers/notifications', () => {
  it('handles ADD_NOTIFICATION', () => {
    const action = addNotification(
      'source',
      '75973bf0-0cf0-450f-ad88-40e2050dad7b',
      121
    );
    const state = notificationReducer(undefined, action);

    assert.equal(state[0].kind, action.notification.kind);
    assert.equal(state[0].sourceId, 121);
  });

  it('handles REMOVE_NOTIFICATION', () => {
    const action = addNotification(
      'source',
      '75973bf0-0cf0-450f-ad88-40e2050dad7b',
      121
    );

    const state = notificationReducer(undefined, action);

    const removeAction = removeNotification(action.notification.id);

    const newState = notificationReducer(state, removeAction);

    assert.equal(newState.length, 0);
  });
});
