import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import Flannel from 'components/Flannel';
import { renderComponent } from '../../helpers';
import { ESCAPE } from 'common/keycodes';

describe('Flannel', () => {
  let element;
  let targetElement;
  let transientElement;
  let onDismissSpy;
  let className = 'stockings';
  let id = 'boots';
  let title = 'A well-to-do lumberjack out in the woods for a chop.';

  function createTransientElement() {
    const div = document.createElement('div');
    div.setAttribute('id', 'transient-element');
    return div;
  }

  function createTarget() {
    const div = document.createElement('div');

    div.style.width = '100px';
    div.style.height = '100px';

    return div;
  }

  const getProps = (props) => {
    return _.defaultsDeep({}, props, {
      onDismiss: _.noop,
      target: createTarget()
    });
  };

  beforeEach(() => {
    targetElement = createTarget();
    transientElement = createTransientElement();
    onDismissSpy = sinon.spy();
    element = renderComponent(Flannel, getProps({
      id,
      className,
      target: targetElement,
      onDismiss: onDismissSpy,
      title
    }));

    document.body.appendChild(targetElement);
    document.body.appendChild(transientElement);
  });

  afterEach(() => {
    targetElement.remove();
    transientElement.remove();
  });

  it('renders', () => {
    expect(element).to.exist;
    expect(element).to.have.class('socrata-flannel');
  });

  it('has a predetermined class name', () => {
    expect(element).to.have.class(className);
  });

  it('has a predetermined id', () => {
    expect(element).to.have.attribute('id', id);
  });

  it('has a predetermined role and aria-label', () => {
    expect(element).to.have.attribute('role', 'dialog');
    expect(element).to.have.attribute('aria-label', title);
  });

  it('positions itself', () => {
    expect(element).to.have.attribute('style');
    expect(element.style.cssText).to.contain('left');
    expect(element.style.cssText).to.contain('top');
  });

  it('dismisses itself when clicking outside', () => {
    document.body.click();
    expect(onDismissSpy.called).to.equal(true);
  });

  it('dismisses itself when ESC is pressed', () => {
    const event = $.Event('keyup', { keyCode: ESCAPE });

    $(document.body).trigger(event);

    expect(onDismissSpy.called).to.equal(true);
  });
});
