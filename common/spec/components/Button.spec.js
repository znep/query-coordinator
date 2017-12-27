import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';

import { Button } from 'common/components';

const SUPPORTED_STYLES = {
  primary: 'btn-primary',
  'alternate-1': 'btn-alternate-1',
  'alternate-2': 'btn-alternate-2',
  simple: 'btn-simple'
};

const SUPPORTED_SIZES = {
  small: 'btn-sm',
  extraSmall: 'btn-xs'
};


describe('Button', function() {
  it('should show children as content', function() {
    const props = {
      children: ['Hello world!']
    };

    const element = shallow(<Button {...props} />);
    assert.equal(element.text(), 'Hello world!');
  });

  describe('variant', function() {
    it('should be default when not specified', function() {
      const element = shallow(<Button />);
      assert.include(element.find('button').prop('className'), 'btn-default');
    });

    [
      'default', 'transparent', 'primary', 'alternate-1', 'alternate-2',
      'simple', 'warning', 'success', 'error'
    ].forEach((variant) => {
      it('should support ' + variant, () => {
        const element = shallow(<Button variant={variant} />);
        assert.include(element.find('button').prop('className'), `btn-${variant}`);
      });
    });
  });

  it('adds btn-dark if the `dark` prop is set', () => {
    assert.notInclude(shallow(<Button />).find('button').prop('className'), 'btn-dark');
    assert.include(shallow(<Button dark />).find('button').prop('className'), 'btn-dark');
  });

  it('does not add btn-inverse if both `inverse` and `dark` props are set', () => {
    assert.notInclude(shallow(<Button inverse dark />).find('button').prop('className'), 'btn-inverse');
  });

  it('adds btn-inverse if the `inverse` prop is set', () => {
    assert.notInclude(shallow(<Button />).find('button').prop('className'), 'btn-inverse');
    assert.include(shallow(<Button inverse />).find('button').prop('className'), 'btn-inverse');
  });

  it('adds btn-busy if the `busy` prop is set', () => {
    assert.notInclude(shallow(<Button />).find('button').prop('className'), 'btn-busy');
    assert.include(shallow(<Button busy />).find('button').prop('className'), 'btn-busy');
  });

  it('applies buttonDisabledStyle only if disabled', () => {
    const props = {
      buttonDisabledStyle: 'xyz'
    };

    assert.notInclude(shallow(<Button {...props} />).find('button').prop('className'), 'btn-disabled-xyz');
    assert.include(
      shallow(<Button disabled {...props} />).find('button').prop('className'),
      'btn-disabled-xyz'
    );
  });

  describe('sizes', function() {
    ['lg', 'default', 'sm', 'xs'].forEach((size) => {
      it('should support ' + size, () => {
        const element = shallow(<Button size={size} />);
        assert.include(element.find('button').prop('className'), `btn-${size}`);
      });
    });
  });

  it('should hide content if busy is true', function() {
    const props = {
      busy: true,
      children: ['Content']
    };
    const element = shallow(<Button {...props} />);
    assert.equal(element.text(), '');
  });
});

