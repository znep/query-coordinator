import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';

import I18n from 'common/i18n';

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

  describe('Metric card error messages', () => {
    const getSubtitle = (element) => element.find('.latest-metric-text').text();
    describe('when computedMeasure is missing', () => {
      it('renders message about no dataset', () => {
        const element = shallow(<SummaryPane {...getProps()} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.no_dataset'));
      });
    });

    describe('when computedMeasure is empty', () => {
      it('renders message about no dataset', () => {
        const computedMeasure = {};
        const element = shallow(<SummaryPane {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.no_dataset'));
      });
    });

    describe('when computedMeasure.dataSourceNotConfigured = true', () => {
      it('renders message about no dataset', () => {
        const computedMeasure = {
          dataSourceNotConfigured: true
        };
        const element = shallow(<SummaryPane {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.no_dataset'));
      });
    });

    describe('when computedMeasure.calculationNotConfigured = true', () => {
      it('renders message about calculation not configured', () => {
        const computedMeasure = {
          calculationNotConfigured: true
        };
        const element = shallow(<SummaryPane {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.no_calculation'));
      });
    });

    describe('when computedMeasure.noReportingPeriodConfigured = true', () => {
      it('renders message about reporting period not configured', () => {
        const computedMeasure = {
          noReportingPeriodConfigured: true
        };
        const element = shallow(<SummaryPane {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.no_reporting_period'));
      });
    });

    describe('when computedMeasure.noReportingPeriodAvailable = true', () => {
      it('renders message about not enough data', () => {
        const computedMeasure = {
          noReportingPeriodAvailable: true
        };
        const element = shallow(<SummaryPane {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('open_performance.not_enough_data'));
      });
    });

  });
});
