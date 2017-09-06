import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import { SummaryPane } from 'components/SummaryPane';
import { ModeStates } from 'lib/constants';

describe('SummaryPane', () => {
  const getProps = (props) => {
    return {
      activePane: 'summary',
      measure: {
        name: 'My Measure',
        description: 'My measure has a description',
        coreView: {
          rowsUpdatedAt: 123,
          viewLastModified: 345,
          createdAt: 456
        },
        metadata: {
          analysis: 'Some analysis text',
          methods: 'Some methods text'
        }
      },
      mode: ModeStates.VIEW,
      ...props
    };
  };

  it('renders pane content if it is the active pane', () => {
    const element = shallow(<SummaryPane {...getProps()} />);

    assert.lengthOf(element.find('.metadata-section'), 1);
    assert.lengthOf(element.find('.summary-pane-description'), 1);
  });

  it('renders nothing if it is not the active pane', () => {
    const element = shallow(<SummaryPane {...getProps({
      activePane: 'other'
    })} />);

    assert.isTrue(element.isEmptyRender());
  });
});
