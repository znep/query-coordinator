import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import SchemaPreviewTable from 'datasetManagementUI/components/SchemaPreviewTable/SchemaPreviewTable';

describe('components/SchemaPreviewTable', () => {
  const props = {
    outputColumns: [
      {
        newCol: true,
        display_name: 'new column',
        iconName: 'text',
        transform: {
          output_soql_type: 'text'
        }
      },
      {
        display_name: 'boop',
        iconName: 'number',
        transform: {
          output_soql_type: 'number'
        }
      },
      {
        display_name: 'beep',
        iconName: 'text',
        transform: {
          output_soql_type: 'text'
        }
      }
    ]
  };

  const component = shallow(<SchemaPreviewTable {...props} />);

  it('renders a  table', () => {
    assert.isTrue(component.find('table').exists());
  });

  it('renders a row for each output column', () => {
    assert.equal(
      props.outputColumns.length,
      component.find('tbody').find('tr').length
    );
  });
});
