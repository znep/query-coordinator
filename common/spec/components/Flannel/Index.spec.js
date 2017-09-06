import $ from 'jquery';
import _ from 'lodash';
import Flannel from 'components/Flannel';
import { renderComponent } from '../../helpers';
import { ESCAPE } from 'common/dom_helpers/keycodes';

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
    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('socrata-flannel'));
  });

  it('has a predetermined class name', () => {
    assert.isTrue($(element).hasClass(className));
  });

  it('has a predetermined id', () => {
    assert.isDefined($(element).attr('id', id));
  });

  it('has a predetermined role and aria-label', () => {
    assert.isDefined($(element).attr('role', 'dialog'));
    assert.isDefined($(element).attr('aria-label', title));
  });

  it('positions itself', () => {
    assert.isDefined($(element).attr('style'));
    assert.include(element.style.cssText, 'left');
    assert.include(element.style.cssText, 'top');
  });

  it('dismisses itself when clicking outside', () => {
    document.body.click();
    assert.equal(onDismissSpy.called, true);
  });

  it('dismisses itself when ESC is pressed', () => {
    const event = $.Event('keyup', { keyCode: ESCAPE }); //eslint-disable-line new-cap

    $(document.body).trigger(event);

    assert.equal(onDismissSpy.called, true);
  });
});
