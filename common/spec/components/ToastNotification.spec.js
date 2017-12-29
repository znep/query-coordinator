import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';

import { ToastNotification } from 'common/components';

describe('ToastNotification', function() {
  // Due to the use of ConditionTransitionMotion, the main rendering logic is actually passed
  // down to an instance of TransitionMotion two levels down.
  const getNotificationElement = (element) => element.find('ConditionTransitionMotion').dive().dive();

  it('should pass showNotification as the condition to ConditionTransitionMotion', () => {
    assert.isTrue(
      shallow(<ToastNotification showNotification />).find('ConditionTransitionMotion').prop('condition')
    );

    assert.isFalse(
      shallow(<ToastNotification />).find('ConditionTransitionMotion').prop('condition')
    );
  });

  it('should pass a default transition', () => {
    const inner = shallow(<ToastNotification />).find('ConditionTransitionMotion');
    const willEnter = inner.prop('willEnter')();
    const willLeave = inner.prop('willLeave')();
    const style = inner.prop('style');

    // Some of these properties are set to opaque transition objects.
    // Difficult to verify those, so we just check presence.
    assert.property(style, 'opacity');
    assert.property(style, 'top');
    assert.propertyVal(willEnter, 'opacity', 0);
    assert.propertyVal(willEnter, 'top', -35);
    assert.property(willLeave, 'opacity');
    assert.property(willLeave, 'top');
  });

  it('should tune default transition based on positionTop', () => {
    const inner = shallow(<ToastNotification positionTop={999} />).find('ConditionTransitionMotion');
    const willEnter = inner.prop('willEnter')();

    // Some of these properties are set to opaque transition objects.
    // We can't check those.
    assert.propertyVal(willEnter, 'top', -999);
  });

  it('should not display the dismiss button if no onDismiss is provided', () => {
    const notification = getNotificationElement(shallow(<ToastNotification showNotification />));
    assert.lengthOf(notification.find('button'), 0);
  });

  it('should display the dismiss button if onDismiss is provided', () => {
    const notification = getNotificationElement(shallow(
      <ToastNotification showNotification onDismiss={() => {}} />
    ));
    assert.lengthOf(notification.find('button'), 1);
  });

  it('should call onDismiss when the dismiss button is clicked', () => {
    const onDismiss = sinon.stub();
    const notification = getNotificationElement(shallow(
      <ToastNotification showNotification onDismiss={onDismiss} />
    ));
    notification.find('button').prop('onClick')();
    sinon.assert.calledOnce(onDismiss);
  });

  it('should apply a class name passed as props', () => {
    const notification = getNotificationElement(
      shallow(<ToastNotification className="thisisatest" showNotification />)
    );
    assert.lengthOf(notification.find('.thisisatest'), 1);
  });

  it('should apply a class name based on the `type` prop', () => {
    const notification = getNotificationElement(
      shallow(<ToastNotification type="warning" showNotification />)
    );
    assert.lengthOf(notification.find('.alert.warning'), 1);
  });

  it('should show children as content', function() {
    const element = getNotificationElement(
      shallow(<ToastNotification showNotification>Hello world!</ToastNotification>)
    );
    assert.equal(element.text(), 'Hello world!');
  });
});

