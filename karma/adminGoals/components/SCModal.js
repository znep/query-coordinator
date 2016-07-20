import * as SCModal from 'components/SCModal';

describe('components/SCModal', function () {
  it('should call onClose when close button clicked', function () {
    const callback = sinon.spy();

    const modalComponent = SCModal.Modal({children: [
      SCModal.Header({ onClose: callback })
    ]});

    const modalNode = renderPureComponent(modalComponent);

    TestUtils.Simulate.click(modalNode.querySelector('.modal-header-dismiss'));
    callback.should.have.been.calledOnce;
  });
});
