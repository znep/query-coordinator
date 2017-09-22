import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

import renderComponent from '../renderComponent';
import CustomizationTab from 'common/authoring_workflow/components/CustomizationTab';

describe('CustomizationTab', () => {
  let props;
  beforeEach(() => {
    props = {
      id: 'id',
      href: 'href',
      title: 'Tooltip',
      onFocus: sinon.spy(),
      'aria-selected': false,
      'aria-controls': 'id-panel',
      onTabNavigation: _.noop
    };
  });

  it('should render a tab', () => {
    let component = renderComponent(CustomizationTab, props);
    let link = component.querySelector('a');
    let tooltip = component.querySelector('.pane-tooltip');

    expect(component).not.to.have.class('current');

    expect(link).to.have.attribute('role', 'tab');
    expect(link).to.have.attribute('aria-selected', 'false');
    expect(link).to.have.attribute('aria-controls', 'id-panel');
    expect(link).to.have.attribute('href', '#id');

    expect(link).to.have.id('id-link');
    expect(link).to.have.attribute('href', '#id');

    expect(tooltip).to.have.text('Tooltip');

    props.selected = true;
    component = renderComponent(CustomizationTab, props);
    link = component.querySelector('a');
    expect(component).to.have.class('current');
    expect(link).to.have.attribute('aria-selected', 'true');

    expect(props.onFocus).not.to.have.called;
  });

  it('should trigger onFocus callback', () => {
    let component = renderComponent(CustomizationTab, props);
    let link = component.querySelector('a');

    TestUtils.Simulate.focus(link);

    expect(props.onFocus).to.have.calledOnce;
  });
});
