/* eslint react/prop-types: 0 */
import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TypedCell from './TypedCell';
import { commaify } from '../../../common/formatNumber';

class NumberCell extends Component {
  getPrecision() {
    // core stores precision as a string O_o
    return _.toNumber(this.props.format.precision);
  }

  // this returns a string
  toFixed() {
    const num = _.toNumber(this.props.value);
    if (_.isInteger(this.getPrecision())) {
      return num.toFixed(this.getPrecision());
    }
    return `${num}`;
  }

  toText() {
    // commaify has ',' as group separator default
    // and '.' as decimal separator default
    const { format } = this.props;
    return commaify(this.toFixed(), format.noCommas ? '' : format.groupSeparator, format.decimalSeparator);
  }

  render() {
    return <TypedCell isDropping={this.props.isDropping} value={this.toText()} format={this.props.format} />;
  }
}

NumberCell.propTypes = {
  isDropping: PropTypes.bool,
  value: PropTypes.string.isRequired,
  format: PropTypes.shape({
    precisionStyle: PropTypes.string
  })
};

class ScientificCell extends NumberCell {
  render() {
    const decimalPlaces = this.props.format.decimalPlaces;
    const num = _.toNumber(this.props.value);
    let text = '';
    if (decimalPlaces !== undefined) {
      text = num.toExponential(decimalPlaces);
    } else {
      text = num.toExponential();
    }

    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

class PercentageCell extends NumberCell {
  render() {
    const text = `${this.toText()}%`;
    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

const currencies = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  AFN: '؋',
  ALL: 'Lek',
  ANG: 'ƒ',
  ARS: '$',
  AUD: '$',
  AWG: 'ƒ',
  AZN: 'ман',
  BAM: 'KM',
  BBD: '$',
  BGN: 'лв',
  BMD: '$',
  BND: '$',
  BOB: '$b',
  BRL: 'R$',
  BSD: '$',
  BWP: 'P',
  BYR: 'p.',
  BZD: 'BZ$',
  CAD: '$',
  CHF: 'CHF',
  CLP: '$',
  CNY: '¥',
  COP: '$',
  CRC: '₡',
  CUP: '₱',
  CZK: 'Kč',
  DKK: 'kr',
  DOP: 'RD$',
  EEK: 'kr',
  EGP: '£',
  FJD: '$',
  FKP: '£',
  GGP: '£',
  GHC: '¢',
  GIP: '£',
  GTQ: 'Q',
  GYD: '$',
  HKD: '$',
  HNL: 'L',
  HRK: 'kn',
  HUF: 'Ft',
  INR: 'Rp',
  ILS: '₪',
  IMP: '£',
  IRR: '﷼',
  ISK: 'kr',
  JEP: '£',
  JMD: 'J$',
  KES: 'KSh',
  KGS: 'лв',
  KHR: '៛',
  KPW: '₩',
  KRW: '₩',
  KYD: '$',
  KZT: 'лв',
  LAK: '₭',
  LBP: '£',
  LKR: '₨',
  LRD: '$',
  LTL: 'Lt',
  LVL: 'Ls',
  MKD: 'ден',
  MNT: '₮',
  MUR: '₨',
  MXN: '$',
  MYR: 'RM',
  MZN: 'MT',
  NAD: '$',
  NGN: '₦',
  NIO: 'C$',
  NOK: 'kr',
  NPR: '₨',
  NZD: '$',
  OMR: '﷼',
  PAB: 'B/.',
  PEN: 'S/.',
  PHP: 'Php',
  PKR: '₨',
  PLN: 'zł',
  PYG: 'Gs',
  QAR: '﷼',
  RON: 'lei',
  RSD: 'Дин.',
  RUB: 'руб',
  SAR: '﷼',
  SBD: '$',
  SCR: '₨',
  SEK: 'kr',
  SGD: '$',
  SHP: '£',
  SOS: 'S',
  SRD: '$',
  SVC: '$',
  SYP: '£',
  THB: '฿',
  TRL: '₤',
  TRY: 'TL',
  TTD: 'TT$',
  TVD: '$',
  TWD: 'NT$',
  UAH: '₴',
  UYU: '$U',
  UZS: 'лв',
  VEF: 'Bs',
  VND: '₫',
  XCD: '$',
  YER: '﷼',
  ZAR: 'R',
  ZWD: 'Z$'
};

class CurrencyCell extends NumberCell {
  getPrecision() {
    const p = super.getPrecision();
    // default to 2 if there is no precision specified
    return _.isInteger(p) ? p : 2;
  }

  render() {
    // default to USD
    const currency = currencies[this.props.format.currencyStyle] || '$';
    const text = `${currency}${this.toText()}`;
    return <TypedCell isDropping={this.props.isDropping} value={text} format={this.props.format} />;
  }
}

class FinancialCell extends NumberCell {
  getPrecision() {
    const p = super.getPrecision();
    // default to 2 if there is no precision specified
    return _.isInteger(p) ? p : 2;
  }

  render() {
    return <TypedCell isDropping={this.props.isDropping} value={this.toText()} format={this.props.format} />;
  }
}

const numbers = {
  scientific: ScientificCell,
  percentage: PercentageCell,
  currency: CurrencyCell,
  financial: FinancialCell
};

export default function renderNumber(props) {
  return React.createElement(numbers[props.format.precisionStyle] || NumberCell, props);
}
