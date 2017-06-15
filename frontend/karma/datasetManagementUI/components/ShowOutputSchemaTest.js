import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import ShowOutputSchemaConnected, { ShowOutputSchema } from 'components/ShowOutputSchema';
import dotProp from 'dot-prop-immutable';
import { ShowOutputSchemaProps } from '../data/defaultProps';

describe('components/ShowOutputSchema', () => {
  const defaultProps = ShowOutputSchemaProps;

  const component = shallow(<ShowOutputSchema {...defaultProps} />);

  it('renders Table', () => {
    assert.equal(component.find('Connect(Table)').length, 1);
  });

  it('renders ReadyToImport', () => {
    assert.equal(component.find('Connect(ReadyToImport)').length, 1);
  });

  it('renders the Pagerbar if needed', () => {
    assert.equal(component.find('Connect(PagerBar)').length, 1);
  });

  it('renders the correct number of rows and columns', () => {
    const [rows, columns] = component
      .find('.attribute')
      .map(elem => elem.text())
      .map(Number);

    assert.equal(rows, 143);
    assert.equal(columns, 10);
  });
});
