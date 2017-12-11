import { assert } from 'chai';
import sinon from 'sinon';

import { SigninModal } from 'components/SigninModal';

describe('SigninModal', () => {

  const getProps = (props) => {
    return {
      isActive: true,
      onDismiss: () => {},
      onClickSignin: () => {},
      ...props
    };
  };

  let element;
  let onClickSpy;
  let onDismissSpy;

  describe('when isActive is false', () => {

    beforeEach(() => {
      element = renderComponent(SigninModal, getProps({
        isActive: false
      }));
    });

    it('does not render', () => {
      assert.isNull(element);
    });
  });

  describe('when isActive is true', () => {

    beforeEach(() => {
      onDismissSpy = sinon.spy();
      onClickSpy = sinon.spy();
      element = renderComponent(SigninModal, getProps({
        onDismiss: onDismissSpy,
        onClickSignin: onClickSpy
      }));
    });

    it('renders', () => {
      assert.ok(element);
    });

    it('renders title', () => {
      assert.include(element.querySelector('.signin-modal-header .modal-header-title').innerText, translations.visualization_canvas.signin_modal.title)
    });

    it('renders content', () => {
      assert.include(element.querySelector('.signin-modal-content').innerText, translations.visualization_canvas.signin_modal.description)
    });

    describe('modal dismiss button', () => {
      it('renders', () => {
        assert.ok(element.querySelector('.modal-header-dismiss'));
      });

      it('invokes onDismiss on click', () => {
        TestUtils.Simulate.click(element.querySelector('.modal-header-dismiss'));
        sinon.assert.called(onDismissSpy);
      });
    });

    describe('no thanks button', () => {
      it('renders', () => {
        assert.ok(element.querySelector('.modal-footer-actions .btn-default'));
      });

      it('invokes onDismiss on click', () => {
        TestUtils.Simulate.click(element.querySelector('.modal-footer-actions .btn-default'));
        sinon.assert.called(onDismissSpy);
      });
    });

    describe('sign in button', () => {
      it('renders', () => {
        assert.ok(element.querySelector('.modal-footer-actions .btn-primary'));
      });

      it('invokes onClickSignin on click', () => {
        TestUtils.Simulate.click(element.querySelector('.modal-footer-actions .btn-primary'));
        sinon.assert.called(onClickSpy);
      });
    });
  });
});
