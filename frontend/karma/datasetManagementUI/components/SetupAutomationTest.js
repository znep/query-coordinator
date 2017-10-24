import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';
import _ from 'lodash';
import SetupAutomation from 'components/SetupAutomation/SetupAutomation';

describe('components/SetupAutomation', () => {
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
    fourfour: 'four-four',
    importConfigName: 'foo-config',
    outputSchemaId: 382,
    onDismiss: sinon.spy()
  };

  it('renders', () => {
    const component = shallow(<SetupAutomation {...defaultProps} />);
    const code = component.find('UploadSourcePythonCode');
    assert.isTrue(code.exists());
  });


});
