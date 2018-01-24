import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import _ from 'lodash';
import FatalError from 'datasetManagementUI/components/FatalError/FatalError';

describe('components/FatalError', () => {
  const defaultProps = {
    source: {
      created_at: '2017-04-19T00:45:21.212Z',
      id: 263,
      finished_at: '2017-04-19T00:45:21.000Z',
      source_type: {
        type: 'upload',
        filename: 'baby_crimes.csv',
      },
      failed_at: null,
      created_by: {
        user_id: 'tugg-ikce',
        email: 'brandon.webster@socrata.com',
        display_name: 'branweb'
      },
      content_type: 'text/csv',
      __status__: {
        type: 'SAVED',
        savedAt: 'ON_SERVER'
      }
    },
    inputSchema: {
      id: 1751,
      name: null,
      total_rows: 9,
      source_id: 263,
      __status__: {
        type: 'SAVED',
        savedAt: 'ON_SERVER'
      },
      num_row_errors: 0
    },
    importableRows: 0,
    errorRows: 9,
    outputSchema: {
      input_schema_id: 1751,
      id: 382,
      __status__: {
        type: 'SAVED',
        savedAt: 'ON_SERVER'
      },
      error_count: 9,
      created_at: '2017-04-19T01:12:51.530Z',
      created_by: {
        user_id: 'tugg-ikce',
        email: 'brandon.webster@socrata.com',
        display_name: 'branweb'
      }
    },
    outputColumns: [
    ]
  };

  it('renders null if there is no output schema', () => {
    const newProps = {
      ...defaultProps,
      outputSchema: null
    };

    const component = shallow(<FatalError {...newProps} />);

    assert.isNull(component.html());
  });

  it('renders the source error if there is one and request id as the title', () => {
    const newProps = {
      ...defaultProps,
      source: {
        ...defaultProps.source,
        failed_at: new Date(),
        failure_details: {
          message: "foo",
          request_id: "bar"
        }
      }
    };

    const component = shallow(<FatalError {...newProps} />);

    assert.equal(component.find('.errorMessage').text(), 'There was an error with the data source');
    assert.equal(component.find('.errorDetails').text(), 'foo');
    assert.equal(component.find('.errorDetails').prop('title'), 'bar');
  });

  it('renders the transform error if there is one', () => {
    const newProps = {
      ...defaultProps,
      outputColumns: [
        {
          transform: {
            failed_at: new Date(),
            transform_expr: "meh"
          }
        }
      ]
    };

    const component = shallow(<FatalError {...newProps} />);

    assert.equal(component.find('.errorMessage').text(), 'There was an unexpected error with the following expression');
    assert.equal(component.find('.errorDetails').text(), 'meh');
  });

});
