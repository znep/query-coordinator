import { expect, assert } from 'chai';
import GeospatialCell from 'datasetManagementUI/components/TableCell/GeospatialCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell/GeospatialCell', () => {

  it('renders a point as WKT', () => {
    const value = {
      type: 'Point',
      coordinates: [10, 20]
    };
    const element = shallow(<GeospatialCell value={value} />).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'Point(...)');
  });

  it('renders a multipolygon as WKT', () => {
    const value = {
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
    };
    const element = shallow(<GeospatialCell value={value} />).dive();
    assert.isTrue(element.exists());
    assert.equal(
      element.find('div').text(),
      'MultiPolygon(...)'
    );
  });

  // could add tests for all geo types, but they're all handled by the GeoJSON2WKT library
  // so at that point we're just testing the library
});
