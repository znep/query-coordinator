import { expect, assert } from 'chai';
import TableCell from 'components/TableCell/TableCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell', () => {

  it('renders empty', () => {
    const element = shallow(<TableCell cell={{ ok: null }} />);
    assert.isTrue(element.exists());
    assert.ok(element.find('.empty'));
  });

  it('renders not loaded', () => {
    const element = shallow(<TableCell cell={null} />);
    assert.isTrue(element.exists());
    assert.ok(element.find('.notYetLoaded'));
  });

  it('renders text', () => {
    const element = shallow(<TableCell cell={{ ok: 'foobar' }} type={'text'} />);
    assert.isTrue(element.exists());
    assert.isTrue(element.find('TextCell').exists());
  });

  it('renders a boolean', () => {
    const element = shallow(<TableCell cell={{ ok: true }} type={'boolean'} />);
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'true');
  });

  it('renders a number', () => {
    const element = shallow(<TableCell cell={{ ok: 42 }} type={'number'} />);
    assert.isTrue(element.exists());
    assert.isTrue(element.find('NumberCell').exists());
  });

  it('adds an error class when there is one', () => {
    const element = shallow(<TableCell failed={true} cell={{ ok: true }} />);
    assert.isTrue(element.hasClass('transformFailed'));
  });

  it('renders a geospatial cell when type=point', () => {
    const cellValue = {
      ok: {
        type: 'Point',
        coordinates: [10, 20]
      }
    };
    const element = shallow(<TableCell cell={cellValue} type={'point'} />);
    assert.isTrue(element.exists());
    assert.isTrue(element.find('GeospatialCell').exists());
  });

});
