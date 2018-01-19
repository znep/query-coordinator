import { assert } from 'chai';
import sinon from 'sinon';
import * as SocrataModal from 'adminGoals/components/SocrataModal';

describe('components/SocrataModal', function () {
  it('does not render close button if no onClose prop provided', function () {
    const modalComponent = SocrataModal.Modal(
      {
        children: SocrataModal.Header({})
      }
    );

    //Figrin D'an and the...
    const modalNode = renderPureComponent(modalComponent);
    assert.isNull(modalNode.querySelector('.modal-header-dismiss'));
  });
  it('should call onClose when close button clicked', function () {
    const callback = sinon.spy();

    const modalComponent = SocrataModal.Modal(
      {
        children: SocrataModal.Header({ onClose: callback })
      }
    );

    const modalNode = renderPureComponent(modalComponent);

    TestUtils.Simulate.click(modalNode.querySelector('.modal-header-dismiss'));
    sinon.assert.calledOnce(callback);
  });
});
