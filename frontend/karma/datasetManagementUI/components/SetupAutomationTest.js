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
    outputSchemaId: 382,
    createImportConfig: _.noop,
    onDismiss: sinon.spy()
  };

  it('renders dropdown when no importConfig is present', () => {
    const component = shallow(<SetupAutomation {...defaultProps} />);
    const selector = component.find('DataActionChooser');
    assert.isTrue(selector.exists());
  });

  it('renders code when importConfig is present', () => {
    const component = shallow(<SetupAutomation {...defaultProps } />);
    component.instance().setState({
      importConfig: {
        name: 'foo'
      }
    })
    const code = component.find('ImportConfigSteps');
    assert.isTrue(code.exists());
  });


});
