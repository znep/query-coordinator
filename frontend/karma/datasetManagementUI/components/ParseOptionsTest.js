import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import ParseOptions from 'components/ParseOptions/ParseOptions';
import entities from 'data/entities';
import * as Selectors from 'selectors';

describe('components/ParseOptions', () => {
  const defaultProps = () => ({
    source: {},
    form: {
      errors: {},
      parseOptions: {
        header_count: 1,
        column_header: 1,
        encoding: null,
        column_separator: ',',
        quote_char: '"',
        trim_whitespace: true,
        remove_empty_rows: true
      }
    },
    setFormState: sinon.spy()
  });

  it('renders', () => {
    const component = shallow(<ParseOptions {...defaultProps()} />);
    assert.isTrue(component.find('ParseOption').exists());
    assert.isTrue(component.find('GridPreview').exists());
  });


  it('sets an error when column_header > header_count', () => {
    const props = defaultProps();
    const component = shallow(<ParseOptions {...props} />);

    component.instance().setColumnHeader({ target: { value: 3 } })
    assert.isTrue(props.setFormState.called);

    const error = props.setFormState.getCall(0).args[0].errors;

    assert.deepEqual(error, {
      header_count: {
        message: "Header Count must be greater than or equal to Header Row Position",
        value: 1
      }
    });
  });
});
