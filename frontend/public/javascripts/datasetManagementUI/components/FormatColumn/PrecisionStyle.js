import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'common/components';
import I18n from 'common/i18n';

const scope = 'dataset_management_ui.format_column';

const currencyFormats = [
  { value: 'USD', title: 'United States, Dollars (USD)' },
  { value: 'EUR', title: 'Eurozone, Euros (EUR)' },
  { value: 'GBP', title: 'Great Britain, Pounds (GBP)' },
  { value: 'RUB', title: 'Russia, Rubles (RUB)' },
  { value: 'CAD', title: 'Canada, Dollars (CAD)' },
  { value: 'AFN', title: 'Afghanistan, Afghanis (AFN)' },
  { value: 'ALL', title: 'Albania, Leke (ALL)' },
  { value: 'ARS', title: 'Argentina, Pesos (ARS)' },
  { value: 'AUD', title: 'Australia, Dollars (AUD)' },
  { value: 'AZN', title: 'Azerbaijan, New Manats (AZN)' },
  { value: 'BSD', title: 'Bahamas, Dollars (BSD)' },
  { value: 'BBD', title: 'Barbados, Dollars (BBD)' },
  { value: 'BYR', title: 'Belarus, Rubles (BYR)' },
  { value: 'BZD', title: 'Belize, Dollars (BZD)' },
  { value: 'BMD', title: 'Bermuda, Dollars (BMD)' },
  { value: 'BOB', title: 'Bolivia, Bolivianos (BOB)' },
  { value: 'BAM', title: 'Bosnia and Herzegovina, Convertible Marka (BAM)' },
  { value: 'BWP', title: 'Botswana, Pulas (BWP)' },
  { value: 'BRL', title: 'Brazil, Real (BRL)' },
  { value: 'BGN', title: 'Bulgaria, Leva (BGN)' },
  { value: 'KHR', title: 'Cambodia, Riels (KHR)' },
  { value: 'CLP', title: 'Chile, Pesos (CLP)' },
  { value: 'CNY', title: 'China, Yuan Renminbi (CNY)' },
  { value: 'COP', title: 'Colombia, Pesos (COP)' },
  { value: 'CRC', title: 'Costa Rica, Colones (CRC)' },
  { value: 'HRK', title: 'Croatia, Kuna (HRK)' },
  { value: 'CZK', title: 'Czech Republic, Koruny (CZK)' },
  { value: 'DKK', title: 'Denmark, Kroner (DKK)' },
  { value: 'DOP', title: 'Dominican Republic, Pesos (DOP)' },
  { value: 'EGP', title: 'Egypt, Pounds (EGP)' },
  { value: 'EEK', title: 'Estonia, Krooni (EEK)' },
  { value: 'FJD', title: 'Fiji, Dollars (FJD)' },
  { value: 'GHC', title: 'Ghana, Cedis (GHC)' },
  { value: 'GTQ', title: 'Guatemala, Quetzales (GTQ)' },
  { value: 'GYD', title: 'Guyana, Dollars (GYD)' },
  { value: 'HKD', title: 'Hong Kong, Dollars (HDK)' },
  { value: 'HNL', title: 'Honduras, Lempiras (HNL)' },
  { value: 'HUF', title: 'Hungary, Forint (HUF)' },
  { value: 'ISK', title: 'Iceland, Kronur (ISK)' },
  { value: 'INR', title: 'India, Rupees (INR)' },
  { value: 'IDR', title: 'Indonesia, Rupiahs (IDR)' },
  { value: 'IRR', title: 'Iran, Rials (IRR)' },
  { value: 'ILS', title: 'Israel, New Shekels (ILS)' },
  { value: 'JMD', title: 'Jamaica, Dollars (JMD)' },
  { value: 'JPY', title: 'Japanese Yen (JPY)' },
  { value: 'KZT', title: 'Kazakhstan, Tenge (KZT)' },
  { value: 'KES', title: 'Kenya, Shilling (KES)' },
  { value: 'KRW', title: 'Korea, Won (KRW)' },
  { value: 'KGS', title: 'Kyrgyzstan, Soms (KGS)' },
  { value: 'LAK', title: 'Laos, Kips (LAK)' },
  { value: 'LVL', title: 'Latvia, Lati (LVL)' },
  { value: 'LBP', title: 'Lebanon, Pounds (LBP)' },
  { value: 'LRD', title: 'Liberia, Dollars (LRD)' },
  { value: 'LTL', title: 'Lithuania, Litai (LTL)' },
  { value: 'MKD', title: 'Macedonia, Denars (MKD)' },
  { value: 'MYR', title: 'Malaysia, Ringgits (MYR)' },
  { value: 'MXN', title: 'Mexico, Pesos (MXN)' },
  { value: 'MNT', title: 'Mongolia, Tugriks (MNT)' },
  { value: 'MZN', title: 'Mozambique, Meticais (MZN)' },
  { value: 'NAD', title: 'Namibia, Dollars (NAD)' },
  { value: 'NPR', title: 'Nepal, Nepal Rupees (NPR)' },
  { value: 'NZD', title: 'New Zealand, Dollar (NZD)' },
  { value: 'NIO', title: 'Nicaragua, Cordobas (NIO)' },
  { value: 'NGN', title: 'Nigeria, Nairas (NGN)' },
  { value: 'NOK', title: 'Norway, Krone (NOK)' },
  { value: 'OMR', title: 'Oman, Rials (OMR)' },
  { value: 'PKR', title: 'Pakistan, Rupees (PKR)' },
  { value: 'PYG', title: 'Paraguay, Guarani (PYG)' },
  { value: 'PEN', title: 'Peru, Nuevos Soles (PEN)' },
  { value: 'PHP', title: 'Philippines, Pesos (PHP)' },
  { value: 'PLN', title: 'Poland, Klotych (PLN)' },
  { value: 'QAR', title: 'Qatar, Rials (QAR)' },
  { value: 'RON', title: 'Romania, New Lei (RON)' },
  { value: 'SAR', title: 'Saudi Arabia, Riyals (SAR)' },
  { value: 'RSD', title: 'Serbia, Dinars (RSD)' },
  { value: 'SGD', title: 'Singapore, Dollars (SGD)' },
  { value: 'SOS', title: 'Somalia, Shillings (SOS)' },
  { value: 'ZAR', title: 'South Africa, Rand (ZAR)' },
  { value: 'LKR', title: 'Sri Lanka, Rupees (LKR)' },
  { value: 'SEK', title: 'Sweden, Kronor (SEK)' },
  { value: 'CHF', title: 'Swiss, Francs (CHF)' },
  { value: 'SYP', title: 'Syria, Pounds (SYP)' },
  { value: 'TWD', title: 'Taiwan, New Dollars (TWD)' },
  { value: 'THB', title: 'Thailand, Baht (THB)' },
  { value: 'TRY', title: 'Turkey, New Lira (TRY)' },
  { value: 'UAH', title: 'Ukraine, Hryvnia (UAH)' },
  { value: 'UYU', title: 'Uruguay, Pesos (UYU)' },
  { value: 'UZS', title: 'Uzbekistan, Sums (UZS)' },
  { value: 'VEF', title: 'Venezuela, Bolivares Fuertes (VEF)' },
  { value: 'VND', title: 'Vietnam, Dong (VND)' },
  { value: 'YER', title: 'Yemen, Rials (YER)' }
];

const numberFormats = [
  {
    value: 'standard',
    title: I18n.t('number_format.standard', { scope })
  },
  {
    value: 'scientific',
    title: I18n.t('number_format.scientific', { scope })
  },
  {
    value: 'percentage',
    title: I18n.t('number_format.percentage', { scope })
  },
  {
    value: 'currency',
    title: I18n.t('number_format.currency', { scope })
  },
  {
    value: 'financial',
    title: I18n.t('number_format.financial', { scope })
  }
];

function PrecisionStyle({ onChange, format }) {
  const dropdownProps = {
    onSelection: e => onChange({ precisionStyle: e.value }),
    value: format.precisionStyle || 'standard',
    options: numberFormats
  };

  let currencyFormatter;
  if (format.precisionStyle === 'currency') {
    const currencyProps = {
      onSelection: e => onChange({ currencyStyle: e.value }),
      value: format.currencyStyle || 'USD',
      options: currencyFormats
    };

    currencyFormatter = (<div>
      <label>Currency Format</label>
      <Dropdown {...currencyProps} />
    </div>);
  }

  return (
    <div>
      <label>{I18n.t('display_format', { scope })}</label>
      <Dropdown {...dropdownProps} />
      {currencyFormatter}
    </div>
  );
}

PrecisionStyle.propTypes = {
  onChange: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default PrecisionStyle;
