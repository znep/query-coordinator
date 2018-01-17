import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';

import { ESCAPE } from 'common/dom_helpers/keycodes_deprecated';
import { Modal, ModalHeader, ModalFooter } from 'common/components';

import { cancelEditModal, acceptEditModalChanges } from 'actions/editor';
import EditModalTab from 'components/EditModal/EditModalTab';
import EditModalPanel from 'components/EditModal/EditModalPanel';
import { EditModal } from 'components/EditModal/EditModal';

describe('EditModal', () => {
  const getAcceptButton = (element) => element.
    find(Modal).dive().find(ModalFooter).dive().find('.modal-footer-actions .done');
  const getCancelButton = (element) => element.
    find(Modal).dive().find(ModalFooter).dive().find('.modal-footer-actions .cancel');

  it('does not render when not in editing mode', () => {
    const element = shallow(<EditModal isEditing={false} />);
    assert.isTrue(element.isEmptyRender());
  });

  it('renders', () => {
    const element = shallow(<EditModal isEditing />);
    assert.lengthOf(element.find('.measure-edit-modal-tabs'), 1);
    assert.lengthOf(element.find('.measure-edit-modal-panels'), 1);
  });

  it('calls back on onTabClick when a tab is clicked', () => {
    const onTabClick = sinon.stub();
    const element = shallow(<EditModal isEditing activePanel="general-info" onTabClick={onTabClick} />);
    const getCurrentness = (tabId) => element.find({ id: tabId }).filter(EditModalTab).prop('isSelected');
    const getVisibility = (tabId) =>
      element.find({ id: tabId }).filter(EditModalPanel).prop('isSelected');

    assert.isTrue(getCurrentness('general-info'));
    assert.isFalse(getCurrentness('methods-and-analysis'));
    assert.isTrue(getVisibility('general-info'));
    assert.isFalse(getVisibility('methods-and-analysis'));

    element.find({ id: 'methods-and-analysis' }).filter(EditModalTab).prop('onTabNavigation')();
    sinon.assert.calledOnce(onTabClick);
  });

  describe('accept button', () => {
    it('is disabled if the measure has not been changed', () => {
      const measure = {};
      const element = shallow(<EditModal isEditing measure={measure} pristineMeasure={measure} />);
      const button = getAcceptButton(element);
      assert.isTrue(button.is('.btn-disabled'));
      assert.isTrue(button.prop('disabled'));
    });

    it('is enabled if the measure has been changed ', () => {
      const pristineMeasure = {};
      const measure = { dataSourceLensUid: 'test-test' };
      const element = shallow(<EditModal isEditing measure={measure} pristineMeasure={pristineMeasure} />);
      const button = getAcceptButton(element);
      assert.isFalse(button.is('.btn-disabled'));
      assert.isFalse(button.prop('disabled'));
    });
  });

  describe('actions', () => {
    it('invokes the cancel callback on all affordances for closing', () => {
      const cancelStub = sinon.stub();
      const element = shallow(<EditModal isEditing onCancel={cancelStub} />);

      element.find(Modal).prop('onDismiss')();
      element.find(Modal).dive().find(ModalHeader).prop('onDismiss')();
      getCancelButton(element).simulate('click');
      sinon.assert.calledThrice(cancelStub);
    });

    it('invokes the complete callback on the accept button', () => {
      const completeStub = sinon.stub();
      const element = shallow(<EditModal isEditing onComplete={completeStub} />);

      getAcceptButton(element).simulate('click');
      sinon.assert.calledOnce(completeStub);
    });
  });
});
