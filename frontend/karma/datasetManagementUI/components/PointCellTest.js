import { expect, assert } from 'chai';
import PointCell from 'datasetManagementUI/components/TableCell/PointCell';

import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell/PointCell', () => {
  it('renders a point', () => {
    const value = {
      type: 'Point',
      coordinates: [10, 20]
    };
    const element = shallow(<PointCell value={value} />).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'Point(10, 20)');
  });

});
