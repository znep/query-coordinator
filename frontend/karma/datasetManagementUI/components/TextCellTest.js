import { expect, assert } from 'chai';
import TextCell from 'components/TableCell/TextCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell/TextCell', () => {

  it('renders text', () => {
    const element = shallow(<TextCell value={'foobar' } />).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'foobar');
  });

});
