import React from 'react';
import TestUtils from 'react-dom/test-utils';
import renderComponent from '../../renderComponent';

import Accordion from 'common/authoring_workflow/components/shared/Accordion';
import AccordionPane from 'common/authoring_workflow/components/shared/AccordionPane';

describe('Accordion', function () {
  it('should render given AccordionPane children', function () {
    var component = renderComponent(Accordion, {
      children: [
        <AccordionPane title="Pane 1" />,
        <AccordionPane title="Pane 2" />
      ]
    });

    expect(component.querySelectorAll('.socrata-accordion-pane').length).to.equal(2);
  });

  it('should render first pane in open state', function () {
    var component = renderComponent(Accordion, {
      children: [
        <AccordionPane title="Pane 1" />,
        <AccordionPane title="Pane 2" />
      ]
    });

    var panes = component.querySelectorAll('.socrata-accordion-pane');

    assert(panes[0].classList.contains('open'));
    assert(!panes[1].classList.contains('open'));
  });

  it('should respect default open panes', function () {
    var component = renderComponent(Accordion, {
      children: [
        <AccordionPane title="Pane 1" />,
        <AccordionPane title="Pane 2" isOpen={true} />
      ]
    });

    var openPanes = component.querySelectorAll('.socrata-accordion-pane.open');

    expect(openPanes.length).to.equal(2);
  });

  it('should toggle child pane visibility on child pane title clicked', function () {
    var component = renderComponent(Accordion, {
      children: [
        <AccordionPane title="Pane 1" />,
        <AccordionPane title="Pane 2" />
      ]
    });

    var pane2 = component.querySelectorAll('.socrata-accordion-pane')[1];
    var titleBar = pane2.querySelector('.socrata-accordion-pane-title');

    TestUtils.Simulate.click(titleBar);

    var openPanes = component.querySelectorAll('.socrata-accordion-pane.open');

    expect(openPanes.length).to.equal(2);
  });
});
