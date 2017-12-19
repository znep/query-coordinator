import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { shallow } from 'enzyme';

import { CalculationTypeNames } from 'lib/constants';
import { CalculationPreview, mapStateToProps } from 'components/EditModal/CalculationPreview';

describe('CalculationPreview', () => {
  describe('mapStateToProps', () => {
    it('passes through label as unitLabel', () => {
      const state = _.set({}, 'editor.measure.metricConfig.display.label', 'granfaloons');
      assert.propertyVal(
        mapStateToProps(state),
        'unitLabel',
        'granfaloons'
      );
    });

    it('passes through decimalPlaces', () => {
      const state = _.set({}, 'editor.measure.metricConfig.display.decimalPlaces', 50);
      assert.propertyVal(
        mapStateToProps(state),
        'decimalPlaces',
        50
      );
    });
  });

  describe('decimal place input', () => {
    it('calls onChangeDecimalPlaces when input changes', () => {
      const props = {
        onChangeDecimalPlaces: sinon.stub(),
        onChangeUnitLabel: sinon.stub(),
        unitLabel: ''
      };

      const element = shallow(<CalculationPreview {...props} />);

      element.find('#metric_decimal_places').props().onChange(_.set({}, 'target.value', '100'));

      sinon.assert.calledWithExactly(props.onChangeDecimalPlaces, 100);
      sinon.assert.calledOnce(props.onChangeDecimalPlaces);
    });
  });

  describe('unit label input', () => {
    it('calls onChangeUnitLabel when input changes', () => {
      const props = {
        onChangeDecimalPlaces: sinon.stub(),
        onChangeUnitLabel: sinon.stub(),
        unitLabel: ''
      };

      const element = shallow(<CalculationPreview {...props} />);

      element.find('#metric_unit_label').props().onChange(_.set({}, 'target.value', 'Mega Bux'));

      sinon.assert.calledWithExactly(props.onChangeUnitLabel, 'Mega Bux');
      sinon.assert.calledOnce(props.onChangeUnitLabel);
    });
  });

  describe('display as percent checkbox', () => {
    _(CalculationTypeNames).values().each((calculationType) => {
      const shouldShow = calculationType === CalculationTypeNames.RATE;

      describe(`${calculationType} measures`, () => {
        it(shouldShow ? 'should show' : 'should not show', () => {
          assert.lengthOf(
            shallow(<CalculationPreview calculationType={calculationType} />).
              find('.metric-display-as-percent'),
            shouldShow ? 1 : 0
          );
        });
      });
    });

    it('calls onToggleDisplayAsPercent when clicked', () => {
      const props = {
        onToggleDisplayAsPercent: sinon.stub(),
        calculationType: CalculationTypeNames.RATE,
      };

      const element = shallow(<CalculationPreview {...props} />);

      element.find('.metric-display-as-percent Checkbox').props().onChange();

      sinon.assert.calledOnce(props.onToggleDisplayAsPercent);
    });
  });
});
