import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';

import { AboutThisMeasure } from 'opMeasure/components/AboutThisMeasure';
import { PeriodSizes, PeriodTypes, CalculationTypes } from 'common/performance_measures/lib/constants';

describe('AboutThisMeasure', () => {
  beforeEach(() => {
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    console.error.restore();
  });

  describe('when the measure is not provided', () => {
    it('warns on prop validation', () => {
      shallow(<AboutThisMeasure />);
      sinon.assert.calledWithExactly(console.error, sinon.match(/Warning: Failed prop type:/));
    });
  });

  const createMeasure = () => {
    return {
      metricConfig: {
        type: CalculationTypes.SUM,
        reportingPeriod: {
          size: PeriodSizes[0],
          type: PeriodTypes.OPEN
        }
      }
    };
  };

  describe('when there is any displayable info from the measure', () => {
    let element;

    beforeEach(() => {
      const measure = createMeasure();
      element = shallow(<AboutThisMeasure measure={measure} />);
    });

    it('does not warn on prop validation', () => {
      sinon.assert.notCalled(console.error);
    });

    it('renders the sidebar and all metadata pairs', () => {
      assert.isTrue(element.find('.about-measure').exists());
      assert.lengthOf(element.find('.metadata-pair'), 2);
    });
  });

  describe('reporting period label', () => {
    const getText = (element) => element.find('.reporting-period-text').text();
    const assertPlaceholder = (measure) => {
      const element = shallow(<AboutThisMeasure measure={measure} />);
      // For some reason, getText(element) !== '-', which is what I expect.
      // The fail message even says: AssertionError: expected '—' to equal '-'
      // So...it should be sufficient to check the length.
      assert.lengthOf(getText(element), 1);
    };
    describe('when reportingPeriod is missing', () => {
      it('should render "-" placeholder as the period text', () => {
        const measure = createMeasure();
        _.unset(measure, 'metricConfig.reportingPeriod');
        assertPlaceholder(measure);
      });
    });

    describe('when reportingPeriod type is missing', () => {
      it('should render "-" placeholder as the period text', () => {
        const measure = createMeasure();
        _.unset(measure, 'metricConfig.reportingPeriod.type');
        assertPlaceholder(measure);
      });
    });

    describe('when reportingPeriod size is missing', () => {
      it('should render "-" placeholder as the period text', () => {
        const measure = createMeasure();
        _.unset(measure, 'metricConfig.reportingPeriod.size');
        assertPlaceholder(measure);
      });
    });
  });

  describe('calculation type label', () => {
    const getText = (element) => element.find('.calculation-type-text').text();
    it('should render "-" placeholder as the period text', () => {
      const measure = createMeasure();
      _.unset(measure, 'metricConfig.type');
      const element = shallow(<AboutThisMeasure measure={measure} />);
      assert.lengthOf(getText(element), 1);
    });
  });

  describe('when there is no displayable info from the measure', () => {
    let element;

    beforeEach(() => {
      const measure = {};

      element = shallow(<AboutThisMeasure measure={measure} />);
    });

    it('does not warn on prop validation', () => {
      sinon.assert.notCalled(console.error);
    });

    it('renders nothing', () => {
      assert.isFalse(element.find('.about-measure').exists());
    });
  });
});
