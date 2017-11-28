import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';

import { ESCAPE } from 'common/dom_helpers/keycodes_deprecated';
import { cancelEditModal, acceptEditModalChanges } from 'actions/editor';
import EditModal from 'components/EditModal/EditModal';

import { getStore } from '../../testStore';

describe('EditModal', () => {
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
      _.includes(
        Array.from(element.querySelector(tabLinkSelector).parentElement.classList),
        'current'
      )
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

  describe('actions', () => {
    it('invokes the cancel callback on all affordances for closing', () => {
      const store = getStore();
      const dispatchStub = sinon.stub(store, 'dispatch');
      const element = renderComponentWithStore(EditModal, {}, store);

      store.dispatch.reset();

      Simulate.click(element.querySelector('.modal-header-dismiss'));
      Simulate.click(element.querySelector('.modal-footer-actions .cancel'));
      Simulate.keyUp(element, { keyCode: ESCAPE });
      sinon.assert.calledThrice(dispatchStub);
      sinon.assert.alwaysCalledWithMatch(dispatchStub, cancelEditModal());
    });

    it('invokes the complete callback on the accept button', () => {
      const store = getStore();
      const dispatchStub = sinon.stub(store, 'dispatch');
      const element = renderComponentWithStore(EditModal, {}, store);

      store.dispatch.reset();

      Simulate.click(element.querySelector('.modal-footer-actions .done'));
      sinon.assert.calledOnce(dispatchStub);
      // NOTE: can't use sinon.assert.calledWithMatch for function arguments!
      sinon.assert.match(dispatchStub.firstCall.args[0].toString(), acceptEditModalChanges().toString());
    });
  });
});
