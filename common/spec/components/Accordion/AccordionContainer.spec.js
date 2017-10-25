import React from 'react';
import ReactDOM from 'react-dom';
import { AccordionContainer, AccordionPane } from 'common/components';
import { assert } from 'chai';
import { shallow } from 'enzyme';

describe('AccordionContainer', function () {
  it('should render given AccordionPane children', function () {
    const element = shallow(
      <AccordionContainer>
        <AccordionPane title="Pane 1" />
        <AccordionPane title="Pane 2" />
      </AccordionContainer>
    );
    assert.equal(element.children().length, 2);
  });

  it('should render first pane in open state', function () {
    const element = shallow(
      <AccordionContainer>
        <AccordionPane title="Pane 1" />
        <AccordionPane title="Pane 2" />
      </AccordionContainer>
    );

    assert.isTrue(element.children().first().prop('isOpen'));
    assert.isFalse(element.children().last().prop('isOpen'));
  });

  it('should respect default open panes', function () {
    const element = shallow(
      <AccordionContainer>
        <AccordionPane title="Pane 1" />
        <AccordionPane title="Pane 2" isOpen={true}/>
      </AccordionContainer>
    );

    assert.isTrue(element.children().first().prop('isOpen'));
    assert.isTrue(element.children().last().prop('isOpen'));
  });

  describe('handlePaneToggle', () => {
    it('toggles isOpen on the AccordionPane', () => {
      const element = shallow(
        <AccordionContainer>
          <AccordionPane title="Pane 1" className="test-accordion-pane"/>
        </AccordionContainer>
      );

      assert.isTrue(element.find('.test-accordion-pane').prop('isOpen'));
      element.instance().handlePaneToggle('pane-0');
      assert.isFalse(element.update().find('.test-accordion-pane').prop('isOpen'));
    });
  });
});
