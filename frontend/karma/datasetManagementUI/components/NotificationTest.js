import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import Notification from 'components/Notification/Notification';

describe('components/Notification', () => {
  const defaultProps = {
    id: 'b6e44f9b-8a0f-410b-bf51-ef95b7996eff',
    percentCompleted: 90,
    progressBar: true,
    status: 'inProgress',
    message: <span>'Test Notification'</span>,
    removeNotification: () => {}
  };

  it('renders correctly', () => {
    const component = shallow(<Notification {...defaultProps} />);
    assert.isAtLeast(component.find('.notification').length, 1);
    assert.isAtLeast(component.find('ProgressBar').length, 1);
    assert.isAtLeast(component.find('.message-area').length, 1);
  });

  it('renders details if given children', () => {
    const component = shallow(
      <Notification {...defaultProps}>
        <span className="details-message">Test Message</span>
      </Notification>
    );
    assert.isAtLeast(component.find('CSSTransitionGroup').length, 1);
  });

  it('correctly toggles details', () => {
    const detailProps = {
      ...defaultProps,
      status: 'error'
    };

    const component = shallow(
      <Notification {...detailProps}>
        <span className="details-message">Test Message</span>
      </Notification>
    );
    assert.equal(component.find('.details-message').length, 1);
    component.find('.details-toggle').simulate('click');
    assert.equal(component.find('.details-message').length, 0);
    component.find('.details-toggle').simulate('click');
    assert.equal(component.find('.details-message').length, 1);
  });

  it('correctly displays in-progress state', () => {
    const component = shallow(<Notification {...defaultProps} />);
    assert.equal(component.find('.progress-icon').text(), '90%');
  });

  it('correctly displays success state', () => {
    const successProps = {
      ...defaultProps,
      percentCompleted: 100,
      status: 'success'
    };
    const component = shallow(<Notification {...successProps} />);
    assert.equal(component.find('.success-icon').length, 1);
  });

  it('correctly displays error state', () => {
    const errorProps = {
      ...defaultProps,
      status: 'error'
    };
    const component = shallow(
      <Notification {...errorProps}>
        <span className="details-message">Test Message</span>
      </Notification>
    );

    assert.equal(component.find('.details-toggle').length, 1);
    assert.equal(component.find('CSSTransitionGroup').length, 1);
    assert.equal(component.find('ProgressBar').length, 1);
  });
});
