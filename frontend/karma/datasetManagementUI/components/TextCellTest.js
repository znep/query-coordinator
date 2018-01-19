import { expect, assert } from 'chai';
import renderText from 'datasetManagementUI/components/TableCell/TextCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell/TextCell', () => {

  const props = {
    value: 'foobar',
    format: {}
  }

  it('renders text', () => {
    const element = shallow(renderText(props)).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), 'foobar');
  });

  it('renders url', () => {
    const element = shallow(renderText({...props, format: {displayStyle: 'url'}})).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('a').prop('href'), 'foobar');
    assert.equal(element.find('a').text(), 'foobar');

  });

  it('renders email', () => {
    const element = shallow(renderText({...props, format: {displayStyle: 'email'}})).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('a').prop('href'), 'mailto:foobar');
    assert.equal(element.find('a').text(), 'foobar');
  });

});
