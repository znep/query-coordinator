import React from 'react';
import TestUtils from 'react-dom/test-utils';
import renderComponent from '../../renderComponent';

import AccordionPane from 'common/authoring_workflow/components/shared/AccordionPane';

describe('AccordionPane', function () {
  it('should render given title', function () {
    var component = renderComponent(AccordionPane, {
      title: 'accordion title',
      paneId: 'pane-0'
    });

    expect(component.querySelector('.socrata-accordion-pane-title span').textContent).to.equal('accordion title');
  });

  it('should be closed by default', function () {
    var component = renderComponent(AccordionPane, {
      title: 'accordion title',
      paneId: 'pane-0'
    });

    expect(component.classList.contains('open')).to.equal(false);
  });

  it('should be open if isOpen property is default', function () {
    var component = renderComponent(AccordionPane, {
      title: 'accordion title',
      paneId: 'pane-0',
      isOpen: true
    });

    expect(component.classList.contains('open')).to.equal(true);
  });

  it('should call toggle callback with pane id when user click to title', function () {
    var clickTargetSelector = '.socrata-accordion-pane-title';
    var toggleCallback = sinon.spy();
    var component = renderComponent(AccordionPane, {
      title: 'accordion title',
      paneId: 'pane-0',
      onToggle: toggleCallback
    });

    TestUtils.Simulate.click(component.querySelector(clickTargetSelector));
    assert(toggleCallback.calledWith('pane-0'));
  });
});
