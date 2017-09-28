import React from 'react';
import ReactDOM from 'react-dom';
import { expect, assert } from 'chai';
import { Checkbox } from 'common/components';
import { shallow } from 'enzyme';

describe('components/Checkbox', () => {
  it('applies the `id` prop to the input tag', () => {
    const element = shallow(<Checkbox id="foo" checked />);
    assert.lengthOf(element.find('input#foo'), 1);
  });

  describe('checked', () => {
    const isChecked = (element) => !!element.find('input').prop('checked');

    describe('set', () => {
      it('is checked', () => {
        const element = shallow(<Checkbox id="foo" checked />);
        assert.isTrue(isChecked(element));
      });
    });

    describe('not set', () => {
      it('is not checked', () => {
        const element = shallow(<Checkbox id="foo" checked={false} />);
        assert.isFalse(isChecked(element));
      });
    });
  });

  describe('disabled', () => {
    const isDisabled = (element) => !!element.find('input').prop('disabled');

    describe('set', () => {
      it('is disabled', () => {
        const element = shallow(<Checkbox id="foo" checked disabled />);
        assert.isTrue(isDisabled(element));
      });
    });

    describe('not set', () => {
      it('is not disabled', () => {
        const element = shallow(<Checkbox id="foo" checked disabled={false} />);
        assert.isFalse(isDisabled(element));
      });
    });
  });

  describe('onChange callback', () => {
    it('is called', () => {
      // Unchecked
      const spy = sinon.spy();
      let element = shallow(<Checkbox id="foo" checked onChange={spy} />);
      element.find('input').simulate('change');
      sinon.assert.calledOnce(spy);

      // Checked
      spy.reset();
      element = shallow(<Checkbox id="foo" checked={false} onChange={spy} />);
      element.find('input').simulate('change');
      sinon.assert.calledOnce(spy);
    });
  });
});
