import { Simulate } from 'react-addons-test-utils';
import { SaveNotification } from 'components/SaveNotification';
import { SaveStates } from 'lib/constants';

describe('SaveNotification', () => {
  const getProps = (props) => {
    return {
      dismiss: _.noop,
      retry: _.noop,
      saveState: SaveStates.IDLE,
      ...props
    };
  };

  let element;

  const getSuccessAlert = (el) => el.querySelector('.alert.success');
  const getErrorAlert = (el) => el.querySelector('.alert.error');
  const getDismissButton = (el) => el.querySelector('.btn-dismiss');
  const getRetryButton = (el) => el.querySelector('.btn-retry');

  it('renders nothing when the save state is idle', () => {
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.IDLE }));
    expect(element).to.not.exist;
  });

  it('renders nothing when the save state is saving', () => {
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.SAVING }));
    expect(element).to.not.exist;
  });

  it('renders a success alert when the save state is saved', () => {
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.SAVED }));
    expect(element).to.exist;
    expect(getSuccessAlert(element)).to.exist;
  });

  it('renders an error alert when the save state is errored', () => {
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.ERRORED }));
    expect(element).to.exist;
    expect(getErrorAlert(element)).to.exist;
  });

  it('calls dismiss when the dismiss button is clicked', () => {
    const dismiss = sinon.spy();
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.SAVED, dismiss }));

    expect(dismiss.called).to.equal(false);
    Simulate.click(getDismissButton(element));
    expect(dismiss.called).to.equal(true);
  });

  it('calls retry when the retry button is clicked', () => {
    const retry = sinon.spy();
    element = renderComponent(SaveNotification, getProps({ saveState: SaveStates.ERRORED, retry }));

    expect(retry.called).to.equal(false);
    Simulate.click(getRetryButton(element));
    expect(retry.called).to.equal(true);
  });
});
