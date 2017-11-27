import { assert } from 'chai';
import sinon from 'sinon';

import { Alert } from 'components/Alert';

describe('Alert', () => {
  const getProps = (props) => {
    return {
      isActive: true,
      onDismiss: () => {},
      translationKey: 'visualization_canvas.alert_not_signed_in',
      type: 'warning',
      ...props
    };
  };

  let element;
  let onClickSpy;

  describe('when isActive is false', () => {

    beforeEach(() => {
      element = renderComponent(Alert, getProps({
        isActive: false
      }));
    });

    it('does not render', () => {
      assert.isNull(element);
    });
  });

  describe('when isActive is true', () => {
    beforeEach(() => {
      onClickSpy = sinon.spy();
      element = renderComponent(Alert, getProps({ onDismiss: onClickSpy }));
    });

    it('renders', () => {
      assert.ok(element);
    });

    it('adds alert type class', () => {
      assert.ok(element.querySelector('.alert.warning'));
    });

    it('renders text', () => {
      assert.include(element.innerText, translations.visualization_canvas.alert_not_signed_in);
    });

    describe('when type is missing', () => {
      beforeEach(() => {
        element = renderComponent(Alert, getProps({type: null}));
      });

      it('defaults type', () => {
        assert.ok(element.querySelector('.alert.default'));
        assert.isNull(element.querySelector('.alert.warning'));
      });
    });

    describe('dismiss button', () => {
      it('renders', () => {
        assert.ok(element.querySelector('.btn-dismiss'));
      });

      it('invokes onDismiss on click', () => {
        TestUtils.Simulate.click(element.querySelector('.btn-dismiss'));
        sinon.assert.called(onClickSpy);
      });
    });
  });
});
