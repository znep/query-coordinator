import { assert } from 'chai';
import { ActionModal } from 'components/ActionModal';
import sinon from 'sinon';

describe('components/ActionModal', () => {
  const actionModalProps = (options = {}) => ({
    actionType: '',
    assetActions: {
      performingAction: false,
      performingActionSuccess: false,
      performingActionFailure: false
    },
    onAccept: () => undefined,
    onDismiss: () => undefined,
    ...options
  });

  it('renders', () => {
    const element = renderComponentWithStore(ActionModal, actionModalProps());
    assert.isNotNull(element);
    assert.equal(element.className, 'action-modal');
  });

  it('calls onAccept when the accept button is clicked', () => {
    var spy = sinon.spy();
    const element = renderComponentWithStore(ActionModal, actionModalProps({ onAccept: spy }));
    TestUtils.Simulate.click(element.querySelector('.accept-button'));
    sinon.assert.calledOnce(spy);
  });

  it('calls onDismiss when the dismiss button is clicked', () => {
    var spy = sinon.spy();
    const element = renderComponentWithStore(ActionModal, actionModalProps({ onDismiss: spy }));
    TestUtils.Simulate.click(element.querySelector('.dismiss-button'));
    sinon.assert.calledOnce(spy);
  });

});
