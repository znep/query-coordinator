import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';

import { AboutThisMeasure } from 'components/AboutThisMeasure';
import { PeriodSizes, PeriodTypes, CalculationTypeNames } from 'lib/constants';

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

  describe('when there is any displayable info from the measure', () => {
    let element;

    beforeEach(() => {
      const measure = {
        metricConfig: {
          type: CalculationTypeNames.SUM,
          reportingPeriod: {
            size: PeriodSizes[0],
            type: PeriodTypes.OPEN
          }
        }
      };

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
