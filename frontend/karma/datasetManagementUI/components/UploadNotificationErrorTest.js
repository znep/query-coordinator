import sinon from 'sinon';
import { expect, assert } from 'chai';
import UploadNotificationError from 'components/NotificationList/UploadNotificationError';
import ReactDOM from 'react-dom';

describe('components/NotificationList/UploadNotificationError', () => {
  const Props = {
    upload: {
      "filename": "Crimes_-_2001_to_present.csv",
      "__status__": {
        "type": "UPDATE_FAILED",
        "updates": {
          "id": 88
        },
        "error": {
          "title": "Lost Connection",
          "body": "Something went wrong with your connection. Make sure you are connected to the internet"
        },
        "percentCompleted": 4.998076146654038,
        "failedAt": "2017-03-06T22:23:19.472Z"
      },
      "id": 88
    },
    notification: {
      "type": "UPLOAD_NOTIFICATION",
      "uploadId": 88
    },
    dispatch: sinon.spy()
  };

  it('renders without error', () => {
    const container = document.createElement("div");
    const element = ReactDOM.render(<UploadNotificationError {...Props} />, container);
    assert.isNotNull(element);
  });

  it('hides details by default', () => {
    const container = document.createElement("div");
    const element = ReactDOM.render(<UploadNotificationError {...Props} />, container);
    const buttonContainer = container.querySelector('.btn-container');
    const messageContainer = container.querySelector('.msg-container');
    assert.isNull(buttonContainer);
    assert.isNull(messageContainer);
  });

  it('show details when View Details toggle is clicked', () => {
    const container = document.createElement("div");
    const element = ReactDOM.render(<UploadNotificationError {...Props} />, container);
    const detailsToggle = container.querySelector('.detailsToggle');
    TestUtils.Simulate.click(detailsToggle);
    const buttonContainer = container.querySelector('.btnContainer');
    const messageContainer = container.querySelector('.msgContainer');
    assert.isNotNull(buttonContainer);
    assert.isNotNull(messageContainer);
  });

  it('contains a dismiss button that dispatches a REMOVE NOTIFICATION action to redux store', () => {
    const container = document.createElement("div");
    const element = ReactDOM.render(<UploadNotificationError {...Props} />, container);
    element.toggleDetails();
    const dismissBtn = container.querySelector('.btnContainer button');
    TestUtils.Simulate.click(dismissBtn);
    const dispatched = Props.dispatch.firstCall.args[0]
    expect(dispatched).to.deep.equal({type: 'REMOVE_NOTIFICATION', notification: Props.notification})
  });
});