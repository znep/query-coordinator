import _ from 'lodash';
import $ from 'jquery'
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
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

      expect(props.onDismiss.calledOnce).to.be.true;
    });

    it('occurs on clicking the overlay', () => {
      Simulate.click(element);

      expect(props.onDismiss.calledOnce).to.be.true;
    });

    it('does not occur on pressing keys other than Esc', () => {
      const event = { keyCode: ENTER };
      Simulate.keyUp(element, event);

      expect(props.onDismiss.calledOnce).to.be.false;
    });

    it('does not occur when clicking inside the modal', () => {
      const container = element.querySelector('.modal-container');

      Simulate.click(container);

      expect(props.onDismiss.calledOnce).to.be.false;
    });
  });

  it('includes custom classes when provided', () => {
    const props = getProps({
      className: 'testing-modal'
    });

    element = renderComponent(Modal, props);

    expect(element).to.exist;
    expect(element).to.have.class('testing-modal');
  });

  describe('in fullscreen mode', () => {
    beforeEach(() => {
      const props = getProps({
        fullScreen: true
      });

      element = renderComponent(Modal, props);
    });

    it('renders with modal-full class applied', () => {
      expect(element).to.exist;
      expect(element).to.have.class('modal-full');
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
      expect(element).to.exist;
      expect(element).to.not.have.class('modal-full');
    });

    // NOTE: We can't actually manipulate window size from within a test.
    // it('applies modal-full when the window is sufficiently small');
  });
});
