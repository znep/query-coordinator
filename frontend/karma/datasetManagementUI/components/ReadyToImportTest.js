import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import _ from 'lodash';
import ReadyToImport from 'components/ReadyToImport/ReadyToImport';

describe('components/ReadyToImport', () => {
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
    openModal: sinon.spy()
  };

  it('renders null if there is no output schema', () => {
    const newProps = {
      ...defaultProps,
      outputSchema: null
    };

    const component = shallow(<ReadyToImport {...newProps} />);

    assert.isNull(component.html());
  });

  it('renders a disabled export errors button if error count is 0', () => {
    const newProps = {
      ...defaultProps,
      outputSchema: {
        ...defaultProps.outpSchema,
        error_count: 0
      }
    };

    const component = shallow(<ReadyToImport {...newProps} />);

    assert.isTrue(component.find('ErrorButton').prop('disabled'));
  });

  it('renders a working export errors button if error count is > 0', () => {
    const component = shallow(<ReadyToImport {...defaultProps} />);

    const aTag = component.find('a');

    const errorButton = component.find('ErrorButton');

    assert.isFalse(aTag.isEmpty());
    assert.isFalse(errorButton.isEmpty());
    assert.isFalse(errorButton.prop('disabled'));
  });

  it('displays the correct number of error rows', () => {
    const component = shallow(<ReadyToImport {...defaultProps} />);

    const displayedErrorRows = component.find('.errorRows').childAt(0).text();

    assert.equal(
      _.toNumber(displayedErrorRows),
      defaultProps.outputSchema.error_count
    );
  });

  it('renders an icon that launches a help modal', () => {
    const component = shallow(<ReadyToImport {...defaultProps} />);

    const icon = component.find('.helpModalIcon');

    icon.simulate('click');

    assert.isTrue(defaultProps.openModal.calledOnce);
  });
});
