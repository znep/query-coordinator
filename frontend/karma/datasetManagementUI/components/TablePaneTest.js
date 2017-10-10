import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import TablePane from 'pages/ShowOutputSchema/TablePane';
import dotProp from 'dot-prop-immutable';
import {
  ShowOutputSchemaProps,
  ShowOutputSchemaErrorProps
} from '../data/defaultProps';
import state from '../data/initialState';

describe('TablePane', () => {
  describe('rendering', () => {
    const defaultProps = ShowOutputSchemaProps;

    const component = shallow(<TablePane {...defaultProps} />);

    it('renders Table', () => {
      assert.equal(component.find('withRouter(Connect(Table))').length, 1);
    });

    it('renders the Pagerbar if needed', () => {
      assert.equal(component.find('withRouter(Connect(PagerBar))').length, 1);
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
});
