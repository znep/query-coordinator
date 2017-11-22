import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import Flannel from 'components/Flannel';
import { renderComponent } from '../../helpers';
import { ESCAPE } from 'common/dom_helpers/keycodes';

describe('Flannel', () => {
  let container;
  let flannel;
  let targetElement;
  let onDismissSpy;
  let onFocusSpy;
  let className = 'stockings';
  let id = 'boots';
  let title = 'A well-to-do lumberjack out in the woods for a chop.';

  function createContainer() {
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

  const renderFlannel = (propOverrides) => {
    onFocusSpy = sinon.spy();

    const children = (<div>
      <button type="button">Click me</button>
      Hello
    </div>);

    targetElement = createTarget();
    onDismissSpy = sinon.spy();
    $(document.body).on('focusin', onFocusSpy);


    container = createContainer();
    const props = {
      id,
      className,
      children,
      target: targetElement,
      onDismiss: onDismissSpy,
      title,
      ...propOverrides
    };

    document.body.appendChild(container);
    document.body.appendChild(targetElement);

    // Our focus logic depends on being in the rooted DOM at mount time, so we can't use renderIntoDocument/renderComponent.
    ReactDOM.render(
      <Flannel {...props} />,
      container,
    );

    flannel = container.querySelector('.socrata-flannel');
    return flannel;
  };

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    targetElement.remove();
    container.remove();
  });

  it('renders', () => {
    renderFlannel();
    assert.isNotNull(flannel);
    assert.isTrue($(flannel).hasClass('socrata-flannel'));
  });

  it('has a predetermined class name', () => {
    renderFlannel();
    assert.isTrue($(flannel).hasClass(className));
  });

  it('has a predetermined id', () => {
    renderFlannel();
    assert.isDefined($(flannel).attr('id', id));
  });

  it('has a predetermined role and aria-label', () => {
    renderFlannel();
    assert.isDefined($(flannel).attr('role', 'dialog'));
    assert.isDefined($(flannel).attr('aria-label', title));
  });

  it('positions itself', () => {
    renderFlannel();
    assert.isDefined($(flannel).attr('style'));
    assert.match(flannel.style.cssText, /left|right/);
  });

  it('dismisses itself when clicking outside', () => {
    renderFlannel();
    document.body.click();
    assert.equal(onDismissSpy.called, true);
  });

  it('dismisses itself when ESC is pressed', () => {
    renderFlannel();
    const event = $.Event('keyup', { keyCode: ESCAPE }); // eslint-disable-line new-cap

    $(document.body).trigger(event);

    assert.equal(onDismissSpy.called, true);
  });

  it('renders children', () => {
    renderFlannel();
    assert.include($(flannel).text(), 'Hello');
  });

  describe('autofocus', () => {
    it('focuses first focusable element', () => {
      renderFlannel();
      assert.equal(document.activeElement, flannel.querySelector('button'));
      sinon.assert.calledOnce(onFocusSpy);
    });

    it('does not focus anything if autoFocus is set to false', () => {
      renderFlannel({ autoFocus: false });
      assert.notEqual(document.activeElement, flannel.querySelector('button'));
      sinon.assert.notCalled(onFocusSpy);
    });
  });
});
