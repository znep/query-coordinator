import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';
import { shallow } from 'enzyme';

import { CalculationPreview, mapStateToProps } from 'components/EditModal/CalculationPreview';

describe('CalculationPreview', () => {
  describe('mapStateToProps', () => {
    it('passes through label as unitLabel', () => {
      const state = _.set({}, 'editor.measure.metric.display.label', 'granfaloons');
      assert.propertyVal(
        mapStateToProps(state),
        'unitLabel',
        'granfaloons'
      );
    });

    it('passes through decimalPlaces', () => {
      const state = _.set({}, 'editor.measure.metric.display.decimalPlaces', 50);
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
});
