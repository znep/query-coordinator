import _ from 'lodash';
import $ from 'jquery';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';

import Modal from 'components/Modal';
import { ENTER, ESCAPE } from 'common/keycodes';

describe('Modal', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      fullScreen: false,
      onDismiss: _.noop,
      overlay: true
    });
  }

  describe('dismissal', () => {
    let props;

    beforeEach(() => {
      props = {
        onDismiss: sinon.stub()
      };

      element = renderComponent(Modal, props);
    });
    it('occurs on Esc key', () => {
      const event = { keyCode: ESCAPE };
      Simulate.keyUp(element, event);

      assert.isTrue(props.onDismiss.calledOnce);
    });

    it('occurs on clicking the overlay', () => {
      Simulate.click(element);

      assert.isTrue(props.onDismiss.calledOnce);
    });

    it('does not occur on pressing keys other than Esc', () => {
      const event = { keyCode: ENTER };
      Simulate.keyUp(element, event);

      assert.isFalse(props.onDismiss.calledOnce);
    });

    it('does not occur when clicking inside the modal', () => {
      const container = element.querySelector('.modal-container');

      Simulate.click(container);

      assert.isFalse(props.onDismiss.calledOnce);
    });
  });

  it('includes custom classes when provided', () => {
    const props = getProps({
      className: 'testing-modal'
    });

    element = renderComponent(Modal, props);

    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('testing-modal'));
  });

  describe('in fullscreen mode', () => {
    beforeEach(() => {
      const props = getProps({
        fullScreen: true
      });

      element = renderComponent(Modal, props);
    });

    it('renders with modal-full class applied', () => {
      assert.isNotNull(element);
      assert.isTrue($(element).hasClass('modal-full'));
    });
  });

  describe('not in fullscreen mode', () => {
    beforeEach(() => {
      const props = getProps({
        fullScreen: false
      });

      element = renderComponent(Modal, props);
    });

    it('renders without modal-full class applied', () => {
      assert.isNotNull(element);
      assert.isFalse($(element).hasClass('modal-full'));
    });

    // NOTE: We can't actually manipulate window size from within a test.
    // it('applies modal-full when the window is sufficiently small');
  });
});
