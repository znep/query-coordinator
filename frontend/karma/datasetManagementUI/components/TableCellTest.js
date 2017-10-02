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
    const element = shallow(<TableCell cell={{ ok: 'foobar' }} />);
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'foobar');
  });

  it('renders a boolean', () => {
    const element = shallow(<TableCell cell={{ ok: true }} />);
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'true');
  });

  it('renders a number', () => {
    const element = shallow(<TableCell cell={{ ok: 42 }} />);
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), '42');
  });

  describe('geo values', () => {

    it('renders a point as WKT', () => {
      const cellValue = {
        ok: {
          type: 'Point',
          coordinates: [10, 20]
        }
      };
      const element = shallow(<TableCell cell={cellValue} />);
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), 'POINT(10 20)');
    });

    it('renders a multipolygon as WKT', () => {
      const cellValue = {
        ok: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [10, 20],
                [20, 30],
                [30, 40],
                [10, 20]
              ]
            ],
            [
              [
                [50, 60],
                [70, 80],
                [90, 100],
                [50, 60]
              ]
            ]
          ]
        }
      };
      const element = shallow(<TableCell cell={cellValue} />);
      assert.isTrue(element.exists());
      assert.equal(
        element.find('div').text(),
        'MULTIPOLYGON(((10 20, 20 30, 30 40, 10 20)), ((50 60, 70 80, 90 100, 50 60)))'
      );
    });

    // could add tests for all geo types, but they're all handled by the GeoJSON2WKT library
    // so at that point we're just testing the library

  });

});
