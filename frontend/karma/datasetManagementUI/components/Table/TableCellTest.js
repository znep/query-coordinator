import { expect, assert } from 'chai';
import TableCell from 'components/Table/TableCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/Table/TableCell', () => {
  it('renders empty', () => {
    const element = shallow(<TableCell cell={{ ok: null }} />);
    assert.isFalse(element.isEmpty());
    assert.ok(element.find('.empty'));
  });

  it('renders not loaded', () => {
    const element = shallow(<TableCell cell={null} />);
    assert.isFalse(element.isEmpty());
    assert.ok(element.find('.notYetLoaded'));
  });

  it('renders text', () => {
    const element = shallow(<TableCell cell={{ ok: 'foobar' }} />);
    assert.isFalse(element.isEmpty());
    assert.equal(element.find('div').text(), 'foobar');
  });

  it('renders a boolean', () => {
    const element = shallow(<TableCell cell={{ ok: true }} />);
    assert.isFalse(element.isEmpty());
    assert.equal(element.find('div').text(), 'true');
  });

  it('renders a number', () => {
    const element = shallow(<TableCell cell={{ ok: 42 }} />);
    assert.isFalse(element.isEmpty());
    assert.equal(element.find('div').text(), '42');
  });
});
