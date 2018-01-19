import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';

import { AboutThisMeasure } from 'opMeasure/components/AboutThisMeasure';
import { SummaryPane } from 'opMeasure/components/SummaryPane';

describe('SummaryPane', () => {
  const getProps = (props) => {
    return _.merge({}, {
      coreView: {
        name: 'My Measure',
        description: 'My measure has a description',
        rowsUpdatedAt: 123,
        viewLastModified: 345,
        createdAt: 456
      },
      activePane: 'summary',
      measure: {
        metadata: {
          analysis: 'Some analysis text',
          methods: 'Some methods text'
        }
      }
    }, props);
  };

  it('renders a scrollable section with metric-related cards', () => {
    const element = shallow(<SummaryPane {...getProps()} />);
    const scrollPane = element.find('.scroll-pane');

    assert.isTrue(scrollPane.exists());
    assert.isTrue(scrollPane.find('#latest-metric').exists());
    assert.isTrue(scrollPane.find('#metric-visualization').exists());
  });

  it('renders a section for methods and analysis', () => {
    const element = shallow(<SummaryPane {...getProps()} />);

    assert.isTrue(element.find('.methods-and-analysis').exists());
  });

  it('renders AboutThisMeasure', () => {
    const element = shallow(<SummaryPane {...getProps()} />);

    assert.isTrue(element.find('Connect(AboutThisMeasure)').exists());
  });
});
