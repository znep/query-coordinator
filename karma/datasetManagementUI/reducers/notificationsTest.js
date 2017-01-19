import notificationReducer from 'reducers/notifications';
import {
  addNotification,
  removeNotification
} from 'actions/notifications';
import {
  UPLOAD_NOTIFICATION,
  UPSERT_JOB_NOTIFICATION,
  uploadNotification,
  upsertJobNotification
} from 'lib/notifications';

describe('reducers/notifications', () => {

  it('handles ADD_NOTIFICATION with an upload notification', () => {
    const initialState = [];
    const action = addNotification(uploadNotification(52));
    expect(notificationReducer(initialState, action)).to.eql([
      {
        type: UPLOAD_NOTIFICATION,
        uploadId: 52
      }
    ]);
  });

  it('handles ADD_NOTIFICATION with an upsert job notification', () => {
    const initialState = [];
    const action = addNotification(upsertJobNotification(52));
    expect(notificationReducer(initialState, action)).to.eql([
      {
        type: UPSERT_JOB_NOTIFICATION,
        upsertJobId: 52
      }
    ]);
  });

  it('handles REMOVE_NOTIFICATION with an upload notification', () => {
    const initialState = [
      {
        type: UPSERT_JOB_NOTIFICATION,
        upsertJobId: 52
      },
      {
        type: UPLOAD_NOTIFICATION,
        uploadId: 52
      }
    ];
    const action = removeNotification(uploadNotification(52));
    expect(notificationReducer(initialState, action)).to.eql([
      {
        type: UPSERT_JOB_NOTIFICATION,
        upsertJobId: 52
      }
    ]);
  });

  it('handles REMOVE_NOTIFICATION with an upsert job notification', () => {
    const initialState = [
      {
        type: UPSERT_JOB_NOTIFICATION,
        upsertJobId: 52
      },
      {
        type: UPLOAD_NOTIFICATION,
        uploadId: 52
      }
    ];
    const action = removeNotification(upsertJobNotification(52));
    expect(notificationReducer(initialState, action)).to.eql([
      {
        type: UPLOAD_NOTIFICATION,
        uploadId: 52
      }
    ]);
  });

});
