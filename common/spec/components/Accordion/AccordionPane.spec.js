import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';
import { AccordionPane } from 'common/components';
import { shallow } from 'enzyme';

describe('components/AccordionPane', () => {
  it('renders', () => {
    const element = shallow(<AccordionPane title="t-pane"/>);
    assert.isNotNull(element);
  });

  it('is closed by default', () => {
    const element = shallow(<AccordionPane title="t-pane"/>);
    assert.equal(element.dive().find('.socrata-accordion-pane-title').prop('aria-expanded'), 'false');
  });

  it('is open if isOpen is set to true', () => {
    const element = shallow(<AccordionPane title="t-pane" isOpen={true} />);
    assert.equal(element.dive().find('.socrata-accordion-pane-title').prop('aria-expanded'), 'true');
  });

  describe('onToggle', () => {
    it('is called when the title is clicked', () => {
      const onToggleSpy = sinon.spy();
      const element = shallow(<AccordionPane title="t-pane" onToggle={onToggleSpy} />);

      element.dive().find('.socrata-accordion-pane-title').simulate('click');

      sinon.assert.calledOnce(onToggleSpy);
    });
  });
});

