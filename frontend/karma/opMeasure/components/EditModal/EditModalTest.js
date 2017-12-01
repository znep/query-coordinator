import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';

import { ESCAPE } from 'common/dom_helpers/keycodes_deprecated';
import { cancelEditModal, acceptEditModalChanges } from 'actions/editor';
import EditModal from 'components/EditModal/EditModal';

import { getStore } from '../../testStore';

describe('EditModal', () => {
  const getAcceptButton = (element) => element.querySelector('.modal-footer-actions .done');
  const getCancelButton = (element) => element.querySelector('.modal-footer-actions .cancel');
  const getCancelX = (element) => element.querySelector('.modal-header-dismiss');

  it('does not render when not in editing mode', () => {
    const element = renderComponentWithStore(EditModal, {}, getStore({
      editor: {
        isEditing: false
      }
    }));
    assert.isNull(element);
  });

  it('renders', () => {
    const element = renderComponentWithStore(EditModal, {}, getStore());
    assert.ok(element);
    assert.ok(element.querySelector('.measure-edit-modal-tabs'));
    assert.ok(element.querySelector('.measure-edit-modal-panels'));
  });

  it('updates the selected tab on tab click', () => {
    const element = renderComponentWithStore(EditModal, {}, getStore());
    const getCurrentness = (tabLinkSelector) => (
      element.querySelector(tabLinkSelector).parentElement.classList.contains('current')
    );
    const getVisibility = (panelSelector) => (
      element.querySelector(panelSelector).getAttribute('aria-hidden') !== 'true'
    );

    assert.isTrue(getCurrentness('#general-info-link'));
    assert.isFalse(getCurrentness('#methods-and-analysis-link'));
    assert.isTrue(getVisibility('#general-info-panel'));
    assert.isFalse(getVisibility('#methods-and-analysis-panel'));

    Simulate.click(element.querySelector('#methods-and-analysis-link'));

    assert.isFalse(getCurrentness('#general-info-link'));
    assert.isTrue(getCurrentness('#methods-and-analysis-link'));
    assert.isFalse(getVisibility('#general-info-panel'));
    assert.isTrue(getVisibility('#methods-and-analysis-panel'));
  });

  describe('save button', () => {
    it('is disabled if the measure has not been changed', () => {
      const element = renderComponentWithStore(EditModal, {}, getStore());
      const button = getAcceptButton(element);
      assert.isTrue(button.classList.contains('btn-disabled'));
      assert.isTrue(button.disabled);
    });

    it('is enabled if the measure has been changed ', () => {
      const element = renderComponentWithStore(EditModal, {}, getStore({
        editor: {
          pristineMeasure: null // cheap way to create dirty state
        }
      }));
      const button = getAcceptButton(element);
      assert.isFalse(button.classList.contains('btn-disabled'));
      assert.isFalse(button.disabled);
    });
  });

  describe('actions', () => {
    it('invokes the cancel callback on all affordances for closing', () => {
      const store = getStore();
      const dispatchStub = sinon.stub(store, 'dispatch');
      const element = renderComponentWithStore(EditModal, {}, store);

      store.dispatch.reset();

      Simulate.click(getCancelX(element));
      Simulate.click(getCancelButton(element));
      Simulate.keyUp(element, { keyCode: ESCAPE });
      sinon.assert.calledThrice(dispatchStub);
      sinon.assert.alwaysCalledWithMatch(dispatchStub, cancelEditModal());
    });

    it('invokes the complete callback on the accept button', () => {
      const store = getStore({
        editor: {
          pristineMeasure: null // cheap way to create dirty state
        }
      });
      const dispatchStub = sinon.stub(store, 'dispatch');
      const element = renderComponentWithStore(EditModal, {}, store);

      store.dispatch.reset();

      Simulate.click(getAcceptButton(element));
      sinon.assert.calledOnce(dispatchStub);
      // NOTE: can't use sinon.assert.calledWithMatch for function arguments!
      sinon.assert.match(dispatchStub.firstCall.args[0].toString(), acceptEditModalChanges().toString());
    });
  });
});
