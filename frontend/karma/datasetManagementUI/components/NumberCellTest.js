import { expect, assert } from 'chai';
import renderNumber from 'components/TableCell/NumberCell';
import React from 'react';
import { shallow } from 'enzyme';

describe('components/TableCell/NumberCell', () => {

  describe('regular numbers', () => {
    it('renders regular number', () => {
      const element = shallow(renderNumber({
        value: '42000',
        format: {}
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '42,000');
    });


    it('renders without commas', () => {
      const element = shallow(renderNumber({
        value: '42000',
        format: {
          noCommas: true
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '42000');
    });

    it('renders with special group separator and decimal separator', () => {
      const element = shallow(renderNumber({
        value: '42000.42',
        format: {
          groupSeparator: '.',
          decimalSeparator: ','
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '42.000,42');
    });

    it('renders with different precision', () => {
      const element = shallow(renderNumber({
        value: '42000.42',
        format: {
          precision: 8
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '42,000.42000000');
    });
  });

  it('renders a scientific notation number', () => {
    const element = shallow(renderNumber({
      value: '42',
      format: {
        precisionStyle: 'scientific'
      }
    })).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), '4.2e+1');
  });

  it('renders a percentage number', () => {
    const element = shallow(renderNumber({
      value: '42',
      format: {
        precisionStyle: 'percentage'
      }
    })).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), '42%');
  });

  it('renders a financial number', () => {
    const element = shallow(renderNumber({
      value: '42',
      format: {
        precisionStyle: 'financial'
      }
    })).dive();
    assert.isTrue(element.exists());
    assert.equal(element.find('div').text(), '42.00');
  });


  describe('currency rendering', () => {
    it('renders a currency number with 2 decimals precision by default', () => {
      const element = shallow(renderNumber({
        value: '42',
        format: {
          precisionStyle: 'currency'
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '$42.00');
    });

    it('renders currency with currency style', () => {
      const element = shallow(renderNumber({
        value: '42',
        format: {
          precisionStyle: 'currency',
          currencyStyle: 'GBP'
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '£42.00');
    });

    it('renders currency with different precision', () => {
      const element = shallow(renderNumber({
        value: '42',
        format: {
          precisionStyle: 'currency',
          currencyStyle: 'GBP',
          precision: 0
        }
      })).dive();
      assert.isTrue(element.exists());
      assert.equal(element.find('div').text(), '£42');
    });
  })
});
