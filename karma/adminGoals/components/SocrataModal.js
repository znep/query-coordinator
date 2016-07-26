import * as SocrataModal from 'components/SocrataModal';

describe('components/SocrataModal', function () {
  it('should call onClose when close button clicked', function () {
    const callback = sinon.spy();

    const modalComponent = SocrataModal.Modal({children: [
      SocrataModal.Header({ onClose: callback })
    ]});

    const modalNode = renderPureComponent(modalComponent);

    TestUtils.Simulate.click(modalNode.querySelector('.modal-header-dismiss'));
    callback.should.have.been.calledOnce;
  });
});
