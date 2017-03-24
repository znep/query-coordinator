import Immutable from 'immutable';
import configureStore from 'redux-mock-store';
import notifyUser from 'middlewares/notifyUser';
import translations from 'mockTranslations';

import * as Actions from 'actions/notificationActions';

const mockStore = configureStore([notifyUser]);
const initialState = Immutable.fromJS({
  translations: {
    admin: {
      bulk_edit: {
        success_message: 'Success! {0} goals were updated.'
      }
    }
  }
});

describe('middlewares/notifyUser', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('should dispatch show notification action', () => {
    const notification = {
      type: 'success',
      message: 'Items updated!'
    };

    store.dispatch({ type: 'TEST_ACTION', notification });

    const [ test, notificationAction ] = store.getActions();

    expect(notificationAction.type).to.eq(Actions.types.show);
    expect(notificationAction.notificationType).to.eq('success');
    expect(notificationAction.message).to.eq('Items updated!');
  });

  it('should be able to get message from translations', () => {
    const notification = {
      type: 'success',
      message: {
        path: 'admin.bulk_edit.success_message',
        values: [3]
      }
    };

    store.dispatch({ type: 'TEST_ACTION', notification });

    const [ test, notificationAction ] = store.getActions();
    expect(notificationAction.message).to.eq(initialState.getIn(['translations', 'admin', 'bulk_edit', 'success_message']).replace('{0}', 3));
  });
});

