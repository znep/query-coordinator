import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

import renderComponent from '../renderComponent';
import { CustomizationTab } from 'src/authoringWorkflow/components/CustomizationTab';

describe('CustomizationTab', () => {
  let props;
  beforeEach(() => {
    props = {
      id: 'id',
      href: 'href',
      title: 'Tooltip',
      onFocus: sinon.spy(),
      'aria-selected': false,
      'aria-controls': 'id-panel'
    };
  });

  it('should render a tab', () => {
    let component = renderComponent(CustomizationTab, props);
    let link = component.querySelector('a');
    let tooltip = component.querySelector('.pane-tooltip');

    expect(component).to.have.attribute('role', 'presentation');
    expect(component).not.to.have.class('current');

    expect(link).to.have.id('id-link');
    expect(link.getAttribute('aria-selected')).to.equal('false');
    expect(link).to.have.attribute('aria-controls', 'id-panel');
    expect(link).to.have.attribute('aria-labelledby', 'id');
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
