import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { shallow } from 'enzyme';

import { CalculationPanel, mapStateToProps } from 'opMeasure/components/EditModal/CalculationPanel';

describe('CalculationPanel', () => {
  const getProps = (props) => {
    return {
      calculationType: 'count',
      // TODO: Where can we get a default computedMeasure?
      computedMeasure: {
        errors: {}
      },
      measure: {},
      onChangeDecimalPlaces: _.noop,
      onChangeUnitLabel: _.noop,
      onSelectColumn: _.noop,
      onSelectDateColumn: _.noop,
      onSetCalculationType: sinon.stub(),
      openDataSourceTab: _.noop,
      ...props
    };
  };

  describe('when no dataset', () => {
    const props = getProps({
      computedMeasure: {
        errors: {
          dataSourceNotConfigured: true
        }
      },
      openDataSourceTab: sinon.stub()
    });
    it('renders disabled cover over form', () => {
      const element = shallow(<CalculationPanel {...props} />);

      const cover = element.find('.cover');
      assert.equal(cover.length, 1);
    });

    it('renders button to navigate to DataSource panel', () => {
      const element = shallow(<CalculationPanel {...props} />);

      const configLinks = element.find('.config-links');
      // TODO: Re-Check this after switching to common Button.
      const navBtn = configLinks.find('button');
      // NOTE: If dataSourceNotConfigured && noReportingPeriodConfigured, navBtn.length should be 2
      assert.equal(navBtn.length, 1);

      navBtn.simulate('click');
      sinon.assert.calledOnce(props.openDataSourceTab);
    });
  });

  describe('when no reporting period set', () => {
    const props = getProps({
      computedMeasure: {
        errors: {
          noReportingPeriodConfigured: true
        }
      },
      openReportingPeriodTab: sinon.stub()
    });
    it('renders disabled cover over form', () => {
      const element = shallow(<CalculationPanel {...props} />);

      const cover = element.find('.cover');
      assert.equal(cover.length, 1);
    });

    it('renders button to navigate to Reporting Period panel', () => {
      const element = shallow(<CalculationPanel {...props} />);

      const configLinks = element.find('.config-links');
      // TODO: Re-Check this after switching to common Button.
      const navBtn = configLinks.find('button');
      assert.equal(navBtn.length, 1);

      navBtn.simulate('click');
      sinon.assert.calledOnce(props.openReportingPeriodTab);
    });
  });


  describe('calculator buttons', () => {
    it('calls the onSetCalculationType with correct type', () => {
      const props = getProps();

      const element = shallow(<CalculationPanel {...props} />);

      // Make sure that the cover is not rendered.
      const cover = element.find('.cover');
      assert.equal(cover.length, 0);

      const countBtn = element.find('.count-calculation');
      countBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'count');

      props.onSetCalculationType.reset();

      const sumBtn = element.find('.sum-calculation');
      sumBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'sum');

      props.onSetCalculationType.reset();

      const recentValueBtn = element.find('.recent-calculation');
      recentValueBtn.simulate('click');
      sinon.assert.alwaysCalledWith(props.onSetCalculationType, 'recent');
    });
  });
});
