
/**
 * EN-16481 - Alternate column edit mechanism for grid view
 */
module.exports = function(options) {

  function renderNumberFormattingPreview(format) {
    var precision = _.get(format, 'precision', null);
    var showThousandsSeparators = !(_.get(format, 'noCommas', false));
    var thousandsSeparator = _.get(format, 'groupSeparator', null);
    var decimalSeparator = _.get(format, 'decimalSeparator', null);
    var formattedNumber = '1{THOUSANDS}000{DECIMAL}1234567890';

    if (precision !== null) {
      if (precision === 0) {
        formattedNumber = formattedNumber.substring(0, 15);
      } else {
        formattedNumber = formattedNumber.substring(0, 24 + precision);
      }
    }

    if (!showThousandsSeparators) {
      formattedNumber = formattedNumber.replace('{THOUSANDS}', '');
    } else if (thousandsSeparator === null) {
      formattedNumber = formattedNumber.replace('{THOUSANDS}', ',');
    } else {
      formattedNumber = formattedNumber.replace('{THOUSANDS}', thousandsSeparator);
    }

    if (decimalSeparator === null) {
      formattedNumber = formattedNumber.replace('{DECIMAL}', '.');
    } else {
      formattedNumber = formattedNumber.replace('{DECIMAL}', decimalSeparator);
    }

    return formattedNumber;
  }

  function renderColumnEditor(viewUid, columnsToRender) {

    function renderNumberFormatting(column) {

      function renderDisplayFormatOptions() {
        var displayFormat = _.get(column, 'format.precisionStyle', 'standard');
        var formats = [
          {value: 'standard', text: $.t('core.precision_style.standard')},
          {value: 'scientific', text: $.t('core.precision_style.scientific')},
          {value: 'percentage', text: $.t('core.precision_style.percentage')},
          {value: 'currency', text: $.t('core.precision_style.currency')},
          {value: 'financial', text: $.t('core.precision_style.financial')}
        ];

        return formats.map(function(option) {
          var isSelected = (option.value === displayFormat) ? ' selected' : '';

          return (
            '<option ' +
              'value="' + option.value + '"' +
              isSelected + '>' +
                option.text +
            '</option>'
          );
        }).join('');
      }

      function renderCurrencyOptions() {
        var currencyStyle = _.get(column, 'format.currencyStyle', 'USD');

        function renderCurrencies(group) {

          return group.map(function(option) {
            var isSelected = (option.value === currencyStyle) ? ' selected' : '';

            return (
              '<option ' +
                'value="' + option.value + '"' +
                isSelected + '>' +
                  option.text +
              '</option>'
            );
          }).join('');
        }

        var commonCurrencies = [
          {value: 'USD', text: 'United States, Dollars (USD)'},
          {value: 'EUR', text: 'Eurozone, Euros (EUR)'},
          {value: 'GBP', text: 'Great Britain, Pounds (GBP)'},
          {value: 'RUB', text: 'Russia, Rubles (RUB)'},
          {value: 'CAD', text: 'Canada, Dollars (CAD)'}
        ];
        var otherCurrencies = [
          {value: 'AFN', text: 'Afghanistan, Afghanis (AFN)'},
          {value: 'ALL', text: 'Albania, Leke (ALL)'},
          {value: 'ARS', text: 'Argentina, Pesos (ARS)'},
          {value: 'AUD', text: 'Australia, Dollars (AUD)'},
          {value: 'AZN', text: 'Azerbaijan, New Manats (AZN)'},
          {value: 'BSD', text: 'Bahamas, Dollars (BSD)'},
          {value: 'BBD', text: 'Barbados, Dollars (BBD)'},
          {value: 'BYR', text: 'Belarus, Rubles (BYR)'},
          {value: 'BZD', text: 'Belize, Dollars (BZD)'},
          {value: 'BMD', text: 'Bermuda, Dollars (BMD)'},
          {value: 'BOB', text: 'Bolivia, Bolivianos (BOB)'},
          {value: 'BAM', text: 'Bosnia and Herzegovina, Convertible Marka (BAM)'},
          {value: 'BWP', text: 'Botswana, Pulas (BWP)'},
          {value: 'BRL', text: 'Brazil, Real (BRL)'},
          {value: 'BGN', text: 'Bulgaria, Leva (BGN)'},
          {value: 'KHR', text: 'Cambodia, Riels (KHR)'},
          {value: 'CLP', text: 'Chile, Pesos (CLP)'},
          {value: 'CNY', text: 'China, Yuan Renminbi (CNY)'},
          {value: 'COP', text: 'Colombia, Pesos (COP)'},
          {value: 'CRC', text: 'Costa Rica, Colones (CRC)'},
          {value: 'HRK', text: 'Croatia, Kuna (HRK)'},
          {value: 'CZK', text: 'Czech Republic, Koruny (CZK)'},
          {value: 'DKK', text: 'Denmark, Kroner (DKK)'},
          {value: 'DOP', text: 'Dominican Republic, Pesos (DOP)'},
          {value: 'EGP', text: 'Egypt, Pounds (EGP)'},
          {value: 'EEK', text: 'Estonia, Krooni (EEK)'},
          {value: 'FJD', text: 'Fiji, Dollars (FJD)'},
          {value: 'GHC', text: 'Ghana, Cedis (GHC)'},
          {value: 'GTQ', text: 'Guatemala, Quetzales (GTQ)'},
          {value: 'GYD', text: 'Guyana, Dollars (GYD)'},
          {value: 'HKD', text: 'Hong Kong, Dollars (HDK)'},
          {value: 'HNL', text: 'Honduras, Lempiras (HNL)'},
          {value: 'HUF', text: 'Hungary, Forint (HUF)'},
          {value: 'ISK', text: 'Iceland, Kronur (ISK)'},
          {value: 'INR', text: 'India, Rupees (INR)'},
          {value: 'IDR', text: 'Indonesia, Rupiahs (IDR)'},
          {value: 'IRR', text: 'Iran, Rials (IRR)'},
          {value: 'ILS', text: 'Israel, New Shekels (ILS)'},
          {value: 'JMD', text: 'Jamaica, Dollars (JMD)'},
          {value: 'JPY', text: 'Japanese Yen (JPY)'},
          {value: 'KZT', text: 'Kazakhstan, Tenge (KZT)'},
          {value: 'KES', text: 'Kenya, Shilling (KES)'},
          {value: 'KRW', text: 'Korea, Won (KRW)'},
          {value: 'KGS', text: 'Kyrgyzstan, Soms (KGS)'},
          {value: 'LAK', text: 'Laos, Kips (LAK)'},
          {value: 'LVL', text: 'Latvia, Lati (LVL)'},
          {value: 'LBP', text: 'Lebanon, Pounds (LBP)'},
          {value: 'LRD', text: 'Liberia, Dollars (LRD)'},
          {value: 'LTL', text: 'Lithuania, Litai (LTL)'},
          {value: 'MKD', text: 'Macedonia, Denars (MKD)'},
          {value: 'MYR', text: 'Malaysia, Ringgits (MYR)'},
          {value: 'MXN', text: 'Mexico, Pesos (MXN)'},
          {value: 'MNT', text: 'Mongolia, Tugriks (MNT)'},
          {value: 'MZN', text: 'Mozambique, Meticais (MZN)'},
          {value: 'NAD', text: 'Namibia, Dollars (NAD)'},
          {value: 'NPR', text: 'Nepal, Nepal Rupees (NPR)'},
          {value: 'NZD', text: 'New Zealand, Dollar (NZD)'},
          {value: 'NIO', text: 'Nicaragua, Cordobas (NIO)'},
          {value: 'NGN', text: 'Nigeria, Nairas (NGN)'},
          {value: 'NOK', text: 'Norway, Krone (NOK)'},
          {value: 'OMR', text: 'Oman, Rials (OMR)'},
          {value: 'PKR', text: 'Pakistan, Rupees (PKR)'},
          {value: 'PYG', text: 'Paraguay, Guarani (PYG)'},
          {value: 'PEN', text: 'Peru, Nuevos Soles (PEN)'},
          {value: 'PHP', text: 'Philippines, Pesos (PHP)'},
          {value: 'PLN', text: 'Poland, Klotych (PLN)'},
          {value: 'QAR', text: 'Qatar, Rials (QAR)'},
          {value: 'RON', text: 'Romania, New Lei (RON)'},
          {value: 'SAR', text: 'Saudi Arabia, Riyals (SAR)'},
          {value: 'RSD', text: 'Serbia, Dinars (RSD)'},
          {value: 'SGD', text: 'Singapore, Dollars (SGD)'},
          {value: 'SOS', text: 'Somalia, Shillings (SOS)'},
          {value: 'ZAR', text: 'South Africa, Rand (ZAR)'},
          {value: 'LKR', text: 'Sri Lanka, Rupees (LKR)'},
          {value: 'SEK', text: 'Sweden, Kronor (SEK)'},
          {value: 'CHF', text: 'Swiss, Francs (CHF)'},
          {value: 'SYP', text: 'Syria, Pounds (SYP)'},
          {value: 'TWD', text: 'Taiwan, New Dollars (TWD)'},
          {value: 'THB', text: 'Thailand, Baht (THB)'},
          {value: 'TRY', text: 'Turkey, New Lira (TRY)'},
          {value: 'UAH', text: 'Ukraine, Hryvnia (UAH)'},
          {value: 'UYU', text: 'Uruguay, Pesos (UYU)'},
          {value: 'UZS', text: 'Uzbekistan, Sums (UZS)'},
          {value: 'VEF', text: 'Venezuela, Bolivares Fuertes (VEF)'},
          {value: 'VND', text: 'Vietnam, Dong (VND)'},
          {value: 'YER', text: 'Yemen, Rials (YER)'}
        ];

        return (
          '<optgroup ' +
            'label="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.currency.common') + '">' +
            renderCurrencies(commonCurrencies) +
          '</optgroup>' +
          '<optgroup ' +
            'label="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.currency.other_currency') + '">' +
            renderCurrencies(otherCurrencies) +
          '</optgroup>'
        );
      }

      var id = column.id;
      var format = _.get(column, 'format', {});
      // Currency
      var currencyHidden = (_.get(format, 'precisionStyle', 'standard') !== 'currency') ? ' hidden' : '';
      // Precision
      var precisionValue = _.get(format, 'precision', 5);
      var overridePrecision = _.get(format, 'precision', null);
      var overridePrecisionChecked = (overridePrecision === null) ? '' : ' checked ';
      var overridePrecisionControlHidden = (overridePrecision === null) ? ' hidden' : '';
      // Show thousands separators
      // Note that we are inverting the truthiness of the 'noCommas' property in
      // the view in order to make it easier to understand as "show this thing"
      // as opposed to "don't show this thing", and furthermore, that the
      // thousands-separator might not actually be a comma (ugh).
      var showThousandsSeparators = !_.get(format, 'noCommas', false);
      var showThousandsSeparatorsChecked = (showThousandsSeparators) ? ' checked' : '';
      // Override thousands separator
      var overrideThousandsSeparator = _.get(format, 'groupSeparator', null);
      var overrideThousandsSeparatorChecked = (overrideThousandsSeparator === null) ? '' : ' checked ';
      var overrideThousandsSeparatorControlHidden = (overrideThousandsSeparator === null) ? ' hidden' : '';
      var thousandsSeparatorValue = (overrideThousandsSeparator === null) ?
        ',' :
        _.get(format, 'groupSeparator', '');
      // Override decimal separator
      var overrideDecimalSeparator = _.get(format, 'decimalSeparator', null);
      var overrideDecimalSeparatorChecked = (overrideDecimalSeparator === null) ? '' : ' checked ';
      var overrideDecimalSeparatorControlHidden = (overrideDecimalSeparator === null) ? ' hidden' : '';
      var decimalSeparatorValue = (overrideDecimalSeparator === null) ?
        '.' :
        _.get(format, 'decimalSeparator', '');

      return (
        '<div class="field-group number-formatting">' +
          // Display format
          '<div class="field">' +
            '<label ' +
              'class="top" ' +
              'for="column-number-formatting-display-format-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.display_format.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.display_format.title') +
            '</label>' +
            '<select ' +
              'id="column-number-formatting-display-format-' + id + '" ' +
              'class="column-number-formatting-display-format" ' +
              'name="column-number-formatting-display-format-' + id + '">' +
              renderDisplayFormatOptions() +
            '</select>' +
          '</div>' +
          // Currency
          '<div class="field optional' + currencyHidden + '">' +
            '<label ' +
              'class="top" ' +
              'for="column-number-formatting-currency-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.currency.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.currency.title') +
            '</label>' +
            '<select ' +
              'id="column-number-formatting-currency-' + id + '" ' +
              'class="column-number-formatting-currency" ' +
              'name="column-number-formatting-currency-' + id + '">' +
              renderCurrencyOptions() +
            '</select>' +
          '</div>' +
          '<h4>' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.title') + '</h4>' +
          '<div class="field">' +
            '<input ' +
              'id="column-number-formatting-override-precision-' + id + '" ' +
              'class="column-number-formatting-override-precision" ' +
              'type="checkbox" ' +
              'name="column-number-formatting-override-precision-' + id + '" ' +
              'value="override" ' +
              overridePrecisionChecked + '/>' +
            '<label ' +
              'class="right" ' +
              'for="column-number-formatting-override-precision-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.precision') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.precision') +
            '</label>' +
            '<div ' +
              'id="column-number-formatting-override-precision-' + id + '-control" ' +
              'class="column-number-formatting-override-precision-control' + overridePrecisionControlHidden + '">' +
              '<input ' +
                'id="column-number-formatting-override-precision-' + id + '-range" ' +
                'class="column-number-formatting-override-precision-range" ' +
                'type="range" ' +
                'min="0" ' +
                'max="10" ' +
                'step="1" ' +
                'list="column-number-formatting-override-precision-' + id + '-range-tickmarks" ' +
                'value="' + precisionValue + '" />' +
              '<datalist id="column-number-formatting-override-precision-' + id + '-range-tickmarks">' +
                '<option value="0" label="0">' +
                '<option value="1">' +
                '<option value="2">' +
                '<option value="3">' +
                '<option value="4">' +
                '<option value="5" label="5">' +
                '<option value="6">' +
                '<option value="7">' +
                '<option value="8">' +
                '<option value="9">' +
                '<option value="10" label="10">' +
              '</datalist>' +
            '</div>' +
          '</div>' +
          // Show thousands separators
          '<div class="field">' +
            '<input ' +
              'id="column-number-formatting-show-thousands-separators-' + id + '" ' +
              'class="column-number-formatting-show-thousands-separators" ' +
              'type="checkbox" ' +
              'name="column-number-formatting-show-thousands-separators-' + id + '"' + showThousandsSeparatorsChecked + '>' +
            '<label ' +
              'class="right" ' +
              'for="column-number-formatting-show-thousands-separators-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.show_thousands_separators') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.show_thousands_separators') +
            '</label>' +
          '</div>' +
          // Override thousands separator
          '<div class="field">' +
            '<input ' +
              'id="column-number-formatting-override-thousands-separator-' + id + '" ' +
              'class="column-number-formatting-override-thousands-separator" ' +
              'type="checkbox" ' +
              'name="column-number-formatting-override-thousands-separator-' + id + '"' + overrideThousandsSeparatorChecked + '>' +
            '<label ' +
              'class="right" ' +
              'for="column-number-formatting-override-thousands-separator-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_thousands_separator.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_thousands_separator.title') +
            '</label>' +
            '<div ' +
              'id="column-number-formatting-override-thousands-separator-' + id + '-control" ' +
              'class="column-number-formatting-override-thousands-separator-control' + overrideThousandsSeparatorControlHidden + '">' +
              '<input ' +
                'id="column-number-formatting-override-thousands-separator-' + id + '-value" ' +
                'class="column-number-formatting-override-thousands-separator-value" ' +
                'type="text" ' +
                'name="column-number-formatting-override-thousands-separator-' + id + '-value" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_thousands_separator.title') + '" ' +
                'value="' + thousandsSeparatorValue + '" ' +
                'placeholder="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_thousands_separator.placeholder') + '">' +
            '</div>' +
          '</div>' +
          // Override decimal separator
          '<div class="field">' +
            '<input ' +
              'id="column-number-formatting-override-decimal-separator-' + id + '" ' +
              'class="column-number-formatting-override-decimal-separator" ' +
              'type="checkbox" ' +
              'name="column-number-formatting-override-decimal-separator-' + id + '"' + overrideDecimalSeparatorChecked + '>' +
            '<label ' +
              'class="right" ' +
              'for="column-number-formatting-override-decimal-separator-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_decimal_separator.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_decimal_separator.title') +
            '</label>' +
            '<div ' +
              'id="column-number-formatting-override-decimal-separator-' + id + '-control" ' +
              'class="column-number-formatting-override-decimal-separator-control' + overrideDecimalSeparatorControlHidden + '">' +
              '<input ' +
                'id="column-number-formatting-override-decimal-separator-' + id + '-value" ' +
                'class="column-number-formatting-override-decimal-separator-value" ' +
                'type="text" ' +
                'name="column-number-formatting-override-decimal-separator-' + id + '-value" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_decimal_separator.title') + '" ' +
                'value="' + decimalSeparatorValue + '" ' +
                'placeholder="' + $.t('controls.grid_view_column_editor.column_fields.number_formatting.advanced.override_decimal_separator.placeholder') + '">' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Preview
        '<div class="field-group preview">' +
          '<div class="field">' +
            '<label ' +
              'class="top" ' +
              'for="column-number-formatting-' + id + '-preview" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.preview.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.preview.title') +
            '</label>' +
            '<input ' +
              'id="column-number-formatting-' + id + '-preview" ' +
              'class="column-number-formatting-preview" ' +
              'type="text" ' +
              'value="' + renderNumberFormattingPreview(column.format) + '" ' +
              'disabled>' +
            '<span class="column-number-formatting-preview-note">' +
              $.t('controls.grid_view_column_editor.column_fields.preview.note') +
            '</span>' +
          '</div>' +
        '</div>'
      );
    }

    function renderDateFormatting(column) {

      function renderDateFormatOptions() {
        var displayFormat = _.get(column, 'format.view', null);
        var formats = [
            {value: null, text: $.t('controls.grid_view_column_editor.column_fields.date_formatting.display_format.use_default')},
            {value: 'date_time', text: '05/23/2017 01:45:31 PM'},
            {value: 'date', text: '05/23/2017'},
            {value: 'date_dmy_time', text: '23/05/2017 01:45:31 PM'},
            {value: 'date_dmy', text: '23/05/2017'},
            {value: 'date_ymd_time', text: '2017/05/23 01:45:31 PM'},
            {value: 'date_ymd', text: '2017/05/23'},
            {value: 'date_monthdy_shorttime', text: 'May 23, 2017 01:45 PM'},
            {value: 'date_monthdy', text: 'May 23, 2017'},
            {value: 'date_shortmonthdy', text: 'May 23, 2017'},
            {value: 'date_monthdy_time', text: 'May 23, 2017 01:45:31 PM'},
            {value: 'date_dmonthy', text: '23 May 2017'},
            {value: 'date_shortmonthdy_shorttime', text: 'May 23, 2017 01:45 PM'},
            {value: 'date_ymonthd', text: '2017 May 23'},
            {value: 'date_ymonthd_time', text: '2017 May 23 01:45:31 PM'},
            {value: 'date_my', text: '05/2017'},
            {value: 'date_ym', text: '2017/05'},
            {value: 'date_shortmonthy', text: 'May 2017'},
            {value: 'date_yshortmonth', text: '2017 May'},
            {value: 'date_monthy', text: 'May 2017'},
            {value: 'date_ymonth', text: '2017 May'},
            {value: 'date_y', text: '2017'}
        ];

        return formats.map(function(option) {
          var isSelected = (option.value === displayFormat) ? ' selected' : '';

          return '<option value="' + option.value + '"' + isSelected + '>' + option.text + '</option>';
        }).join('');
      }

      var id = column.id;

      return (
        '<div class="field-group date-formatting">' +
          '<div class="field">' +
            '<label ' +
              'class="top" ' +
              'for="column-date-formatting-display-format-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.date_formatting.display_format.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.date_formatting.display_format.title') +
            '</label>' +
            '<select ' +
              'id="column-date-formatting-display-format-' + id + '" ' +
              'class="column-date-formatting-display-format" ' +
              'name="column-date-formatting-display-format-' + id + '">' +
              renderDateFormatOptions() +
            '</select>' +
          '</div>' +
        '</div>'
      );
    }

    function renderColumnProperties(column) {

      function renderConvertDataTypeOptions() {
        var dataTypeConversionMappings = {
          blob: [],
          calendar_date: ['text'],
          checkbox: ['text'],
          dataset_link: [],
          date: ['calendar_date', 'text'],
          document: [],
          drop_down_list: [],
          email: ['text'],
          flag: ['text'],
          geospatial: [],
          html: ['text'],
          line: [],
          list: [],
          location: [],
          money: ['number'],
          multiline: [],
          multipoint: [],
          multipolygon: [],
          nested_table: [],
          number: ['money'],
          object: [],
          percent: ['number'],
          phone: ['text'],
          photo: [],
          point: [],
          polygon: [],
          stars: ['number'],
          text: ['calendar_date', 'checkbox'],
          undefined: [],
          url: []
        };

        // NBE doesn't support datetime-with-timezone, but we need to support the OBE case, so
        // conditionally make that conversion option available according to the NBE-ness of the
        // dataset.
        if (!window.blist.dataset.newBackend) {
          dataTypeConversionMappings.calendar_date = ['date', 'text'];
        }

        var dataType = _.get(column, 'dataTypeName');
        var dataTypeName = $.t('controls.grid_view_row_editor.data_types.' + dataType + '.name');
        var conversionOptions = _.get(dataTypeConversionMappings, dataType, []).
          map(function(conversionOptionDataType) {
            var conversionOptionDataTypeName = $.t('controls.grid_view_row_editor.data_types.' + conversionOptionDataType + '.name');

            return '<option value="' + conversionOptionDataType + '">' + conversionOptionDataTypeName + '</option>';
          }).join('');

        return '<option value="' + dataType + '" selected>' + dataTypeName + '</option>' + conversionOptions;
      }

      function renderColumnDataTypeSection(columnId) {
        var columnDataTypeSection;
        var dataType = _.get(column, 'dataTypeName');

        // The NBE doesn't currently have the capability to convert column data types.
        if (window.blist.dataset.newBackend || !window.blist.dataset.isDefault()) {

          columnDataTypeSection = (
            '<input ' +
              'id="column-data-type-' + columnId + '" ' +
              'class="column-data-type" ' +
              'type="text" ' +
              'name="column-data-type-' + columnId + '" ' +
              'value="' + dataType + '" ' +
              'disabled="disabled" />'
          );
        } else {

          columnDataTypeSection = (
            '<select ' +
              'id="column-data-type-' + columnId + '" ' +
              'class="column-data-type" ' +
              'type="text" ' +
              'name="column-data-type-' + columnId + '">' +
              renderConvertDataTypeOptions() +
            '</select>' +
            '<button class="convert-column-data-type" data-column-id="' + columnId + '">' +
              $.t('controls.grid_view_column_editor.convert_column_data_type') +
            '</button>' +
            '<div id="convert-column-data-type-status-' + columnId + '" class="convert-column-data-type-status">' +
              '<span class="spinner"></span>' +
              '<span class="convert-column-data-type-status-text"></span>' +
            '</div>' +
          '</div>'
          );
        }

        return columnDataTypeSection;
      }

      var id = column.id;
      var fieldName = column.fieldName;
      var hiddenValue = ((_.get(column, 'flags') || []).indexOf('hidden') >= 0) ? ' checked' : '';
      var nameValue = _.get(column, 'name', '');
      var descriptionValue = _.get(column, 'description', '');

      return (
        '<div class="tab-content" data-tab-content data-tab-id="column-properties">' +
          '<div class="field-group">' +
            '<div class="field">' +
              // Column is hidden in the view
              '<input ' +
                'id="column-hidden-' + id + '" ' +
                'class="column-hidden" ' +
                'type="checkbox" ' +
                'name="column-hidden-' + id + '"' +
                hiddenValue + '>' +
              '<label ' +
                'class="right" ' +
                'for="column-hidden-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.hidden.title') + '">' +
                $.t('controls.grid_view_column_editor.column_fields.hidden.title') +
              '</label>' +
            '</div>' +
            '<div class="field">' +
              // Column name
              '<label ' +
                'class="top" ' +
                'for="column-name-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.name.title') + '" ' +
                'aria-required="true">' +
                $.t('controls.grid_view_column_editor.column_fields.name.title') +
              '</label>' +
              '<input ' +
                'id="column-name-' + id + '" ' +
                'class="column-name" ' +
                'type="text" ' +
                'name="column-name-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.name.title') + '" ' +
                'value="' + nameValue + '" ' +
                'placeholder="' + $.t('controls.grid_view_column_editor.column_fields.name.placeholder') + '" ' +
                'aria-required="true" ' +
                'aria-invalid="false">' +
            '</div>' +
            // Column description
            '<div class="field">' +
              '<label ' +
                'class="top" ' +
                'for="column-description-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.description.title') + '">' +
                $.t('controls.grid_view_column_editor.column_fields.description.title') +
              '</label>' +
              '<textarea ' +
                'id="column-description-' + id + '" ' +
                'class="column-description" ' +
                'name="column-description-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.column_fields.description.title') + '" ' +
                'placeholder="' + $.t('controls.grid_view_column_editor.column_fields.description.placeholder') + '">' +
                descriptionValue +
              '</textarea>' +
            '</div>' +
          '</div>' +
          '<div class="field-group">' +
            '<div class="field column-field-name">' +
              '<label ' +
                'class="top" ' +
                'for="column-field-name-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.field_name.title') + '">' +
                $.t('controls.grid_view_column_editor.field_name.title') +
              '</label>' +
              '<input ' +
                'id="column-field-name-' + id + '" ' +
                'class="column-field-name" ' +
                'type="text" ' +
                'name="column-field-name-' + id + '" ' +
                'value="' + fieldName + '" />' +
            '</div>' +
            '<div class="field column-data-type">' +
              '<label ' +
                'class="top" ' +
                'for="column-data-type-' + id + '" ' +
                'title="' + $.t('controls.grid_view_column_editor.data_type.title') + '">' +
                $.t('controls.grid_view_column_editor.data_type.title') +
              '</label>' +
              '<div id="column-data-type-container-' + id + '" class="convert-column-type-container">' +
                renderColumnDataTypeSection(id) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function renderColumnFormatting(column) {

      function renderAlignmentOptions() {
        var alignment = _.get(column, 'format.align', 'right');
        var alignments = [
          {value: 'left', text: $.t('controls.grid_view_column_editor.column_fields.alignment.left')},
          {value: 'center', text: $.t('controls.grid_view_column_editor.column_fields.alignment.center')},
          {value: 'right', text: $.t('controls.grid_view_column_editor.column_fields.alignment.right')}
        ];

        return alignments.map(function(option) {
          var isSelected = (option.value === alignment) ? ' selected' : '';

          return '<option value="' + option.value + '"' + isSelected + '>' + option.text + '</option>';
        }).join('');
      }

      var id = column.id;
      var formattingOptions =
        '<div class="field-group">' +
          // Column alignment
          '<div class="field">' +
            '<label ' +
              'class="top" ' +
              'for="column-alignment-' + id + '" ' +
              'title="' + $.t('controls.grid_view_column_editor.column_fields.alignment.title') + '">' +
              $.t('controls.grid_view_column_editor.column_fields.alignment.title') +
            '</label>' +
            '<select ' +
              'id="column-alignment-' + id + '" ' +
              'class="column-alignment" ' +
              'name="column-alignment-' + id + '">' +
              renderAlignmentOptions() +
            '</select>' +
          '</div>' +
        '</div>';

      switch (column.dataTypeName.toLowerCase()) {
        case 'number':
          formattingOptions += renderNumberFormatting(column);
          break;
        case 'calendar_date':
          formattingOptions += renderDateFormatting(column);
          break;
        default:
          break;
      }

      return (
        '<div ' +
          'class="tab-content hidden" ' +
          'data-tab-content ' +
          'data-tab-id="column-formatting">' +
          formattingOptions +
        '</div>'
      );
    }

    function renderColumnDelete(column) {

      return (
        '<div ' +
          'class="tab-content hidden" ' +
          'data-tab-content ' +
          'data-tab-id="column-delete">' +
          '<button class="delete" data-column-id="' + column.id + '">' +
            $.t('controls.grid_view_column_editor.delete_column') +
          '</button>' +
        '</div>'
      );
    }

    function renderColumn(column) {
      var id = column.id;

      return $(
        '<div class="column hidden" data-column-id="' + id + '" data-tabs>' +
          '<ul class="nav-tabs">' +
            '<li class="tab-link current" data-tab-id="column-properties">' +
              $.t('controls.grid_view_column_editor.column_properties') +
            '</li>' +
            '<li class="tab-link" data-tab-id="column-formatting">' +
              $.t('controls.grid_view_column_editor.column_formatting') +
            '</li>' +
            '<li class="tab-link" data-tab-id="column-delete">' +
              $.t('controls.grid_view_column_editor.delete_column') +
            '</li>' +
          '</ul>' +
          renderColumnProperties(column) +
          renderColumnFormatting(column) +
          renderColumnDelete(column) +
        '</div>'
      );
    }

    var columnEditorHtml =
      '<div id="grid-view-column-editor">' +
        '<div class="overlay"></div>' +
        '<div class="modal">' +
          '<div class="header">' +
            '<span class="socrata-icon-settings"></span>' +
            '<h2 id="column-name"></h2>' +
            '<button class="cancel">' +
              '<span class="socrata-icon-close-2"></span>' +
            '</button>' +
          '</div>' +
          '<div class="columns-container">' +
            '<div class="columns"></div>' +
          '</div>' +
          '<div class="controls">' +
            '<button class="prev">' +
              '<span class="socrata-icon-arrow-left"></span>' +
              $.t('controls.grid_view_column_editor.controls.prev') +
            '</button>' +
            '<button class="next">' +
              $.t('controls.grid_view_column_editor.controls.next') +
              '<span class="socrata-icon-arrow-right"></span>' +
            '</button>' +
            '<button class="cancel">' +
              $.t('controls.grid_view_column_editor.controls.cancel') +
            '</button>' +
            '<button class="save">' +
              $.t('controls.grid_view_column_editor.controls.save') +
            '</button>' +
          '</div>' +
          '<div class="loadingSpinnerContainer hidden">' +
            '<div class="loadingSpinner"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Render modal skeleton
    var $columnEditorModal = $(columnEditorHtml);

    // Render column headers and columns
    //
    // Whatever version of jQuery is running on this page doesn't support the
    // $().append([$(), $()]) syntax, so do a forEach and call $().append() on
    // each column form instead.
    var $columnEditorColumnsContainer = $columnEditorModal.
      find('.columns-container');
    var $columnEditorColumnsContainerColumns = $columnEditorColumnsContainer.
      find('.columns');

    columnsToRender.forEach(function(column) {
      $columnEditorColumnsContainerColumns.append(renderColumn(column));
    });

    return $columnEditorModal;
  }

  function generateColumnPositionString(columnName, columnIndex, columnCount) {

    return (
      columnName +
      ' (' +
      (columnIndex + 1) +
      ' ' +
      $.t('controls.grid_view_column_editor.of') +
      ' ' +
      columnCount +
      ')'
    );
  }

  function attachColumnEditorEvents($manager) {

    function getColumnIdFromEvent(e) {

      return Number(
        $(e.target).parents('.column')[0].getAttribute('data-column-id')
      );
    }
    function getColumnById(id) {

      return _.find(columns, function(col) {
        return col.id === id;
      });
    }

    function getColumnDefaultOptions(id) {
      var originalColumn = getColumnById(id);
      var fieldName = $('#column-field-name-' + id).value();
      var name = $('#column-name-' + id).value();
      var description = $('#column-description-' + id).value();
      var hidden = $('#column-hidden-' + id).value();
      var columnFlags = _.cloneDeep(_.get(originalColumn, 'flags') || []);
      var column = {
        id: id,
        fieldName: fieldName,
        name: name,
        description: description
      };

      if (hidden && columnFlags.indexOf('hidden') < 0) {
        columnFlags.push('hidden');
        column.flags = columnFlags;
      }

      return column;
    }

    function getColumnFormatOptions(id) {
      var alignment = $('#column-alignment-' + id).value();
      var numberFormatting = ($('.column[data-column-id="' + id + '"]').
        find('.field-group.number-formatting').length > 0);
      var dateFormatting = ($('.column[data-column-id="' + id + '"]').
        find('.field-group.date-formatting').length > 0);
      var format = {
        align: alignment
      };

      if (numberFormatting) {
        var displayFormat = $('#column-number-formatting-display-format-' + id).value();
        var currencyStyle = $('#column-number-formatting-currency-' + id).value();
        var overridePrecision = $('#column-number-formatting-override-precision-' + id).value();
        var overridePrecisionValue = parseInt($('#column-number-formatting-override-precision-' + id + '-range').value(), 10);
        var showThousandsSeparators = $('#column-number-formatting-show-thousands-separators-' + id).value();
        var overrideThousandsSeparator = $('#column-number-formatting-override-thousands-separator-' + id).value();
        var overrideThousandsSeparatorValue = $('#column-number-formatting-override-thousands-separator-' + id + '-value').value();
        var overrideDecimalSeparator = $('#column-number-formatting-override-decimal-separator-' + id).value();
        var overrideDecimalSeparatorValue = $('#column-number-formatting-override-decimal-separator-' + id + '-value').value();

        format.precisionStyle = displayFormat;

        if (displayFormat === 'currency') {
          format.currencyStyle = currencyStyle;
        }

        if (overridePrecision) {
          format.precision = overridePrecisionValue;
        }

        if (!showThousandsSeparators) {
          format.noCommas = true;
        }

        if (overrideThousandsSeparator) {
          format.groupSeparator = overrideThousandsSeparatorValue;
        }

        if (overrideDecimalSeparator) {
          format.decimalSeparator = overrideDecimalSeparatorValue;
        }
      }

      if (dateFormatting) {
        var dateFormat = $('#column-date-formatting-display-format-' + id).value();

        if (!_.isNull(dateFormat) && dateFormat !== 'null') {
          format.view = dateFormat;
        }
      }

      return format;
    }

    function updateNumberFormattingPreview(id) {

      $('#column-number-formatting-' + id + '-preview').value(
        renderNumberFormattingPreview(getColumnFormatOptions(id))
      );
    }

    function updatePagination(argument, $columnsElements) {
      var columnElementsAsArray = $columnsElements.toArray();
      var newIndex = 0;
      var $newColumn;
      var columnName;

      columnElementsAsArray.forEach(function(column, i) {
        var $column = $(column);

        if (!$column.hasClass('hidden')) {
          newIndex = (i + argument) % columns.length;

          if (newIndex < 0) {
            newIndex += columns.length;
          }

          $column.addClass('hidden');
        }
      });

      $newColumn = $columns.eq(newIndex);
      columnName = $newColumn.find('input.column-name').value();
      $manager.find('#column-name').text(
        generateColumnPositionString(columnName, newIndex, $columnsElements.length)
      );
      $newColumn.removeClass('hidden');
    }

    function saveView(onComplete) {
      var viewToPut = {};

      // Update the column metadata with the values in the forms.
      viewToPut.columns = $columns.toArray().map(function(columnForm) {
        var id = parseInt(columnForm.getAttribute('data-column-id'), 10);
        var column = getColumnDefaultOptions(id);

        column.format = getColumnFormatOptions(id);

        return column;
      });

      var ajaxOptions = {
        url: '/api/views/' + window.blist.dataset.id + '.json',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(viewToPut),
        dataType: 'json',
        success: onComplete,
        error: function() {
          $columnEditor.find('.loadingSpinnerContainer').addClass('hidden');
          alert(
            $.t('controls.grid_view_column_editor.error.save')
          );
          $columnEditor.find('.controls').find('button').attr('disabled', false);
        }
      };

      $columnEditor.find('button').attr('disabled', true);
      $columnEditor.find('.loadingSpinnerContainer').removeClass('hidden');

      $.ajax(ajaxOptions);
    }

    function pollConvertColumnEndpointUntilComplete(url, onComplete) {
      var ajaxOptions = {
        url: url,
        type: 'GET',
        contentType: 'application/json',
        success: function(response) {
          if (response.hasOwnProperty('id') && response.hasOwnProperty('fieldName')) {
            window.location.reload(true);
          } else {

            $('.convert-column-data-type-status-text').text(response.details.message).show();

            setTimeout(function() { pollConvertColumnEndpointUntilComplete(url, onComplete); }, 5000);
          }
        },
        error: function() {
          alert(
            $.t('controls.grid_view_column_editor.error.convert_column_data_type')
          );
          $columnEditor.find('button').attr('disabled', false);
          $columnEditor.find('.loadingSpinnerContainer').addClass('hidden');
        }
      };

      $.ajax(ajaxOptions);
    }

    var $columnsContainer = $manager.find('.columns-container');
    var $columns = $manager.find('.column');
    var $tabLinks = $manager.find('.tab-link');
    var $hidden = $columns.find('.column-hidden');
    var $name = $columns.find('.column-name');
    var $displayFormat = $columns.
      find('.column-number-formatting-display-format');
    var $overridePrecision = $columns.
      find('.column-number-formatting-override-precision');
    var $overridePrecisionRange = $columns.
      find('.column-number-formatting-override-precision-range');
    var $showThousandsSeparators = $columns.
      find('.column-number-formatting-show-thousands-separators');
    var $overrideThousandsSeparator = $columns.
      find('.column-number-formatting-override-thousands-separator');
    var $overrideThousandsSeparatorValue = $columns.
      find('.column-number-formatting-override-thousands-separator-value');
    var $overrideDecimalSeparator = $columns.
      find('.column-number-formatting-override-decimal-separator');
    var $overrideDecimalSeparatorValue = $columns.
      find('.column-number-formatting-override-decimal-separator-value');
    var $prev = $manager.find('.prev');
    var $next = $manager.find('.next');
    var $save = $manager.find('.save');
    var $convertColumnDataType = $manager.find('.convert-column-data-type');
    var $delete = $manager.find('.delete');
    var $cancel = $manager.find('.overlay, .cancel');

    $tabLinks.on('click', function() {
      var tabId = this.getAttribute('data-tab-id');

      $tabLinks.removeClass('current');
      $columns.find('.tab-content').addClass('hidden');

      if (tabId === 'column-properties') {
        $columnsContainer.find('.tab-link[data-tab-id="column-properties"]').addClass('current');
        $columnsContainer.find('.tab-content[data-tab-id="column-properties"]').removeClass('hidden');
      } else if (tabId === 'column-formatting') {
        $columnsContainer.find('.tab-link[data-tab-id="column-formatting"]').addClass('current');
        $columnsContainer.find('.tab-content[data-tab-id="column-formatting"]').removeClass('hidden');
      } else if (tabId === 'column-delete') {
        $columnsContainer.find('.tab-link[data-tab-id="column-delete"]').addClass('current');
        $columnsContainer.find('.tab-content[data-tab-id="column-delete"]').removeClass('hidden');
      }
    });

    $hidden.on('change', function() {

      $(this).
        parents('.content').
        toggleClass('hidden', $(this).value());
    });

    $name.on('input', function() {

      if ($(this).value() === null) {
        $save.attr('disabled', true);
      } else {
        $save.attr('disabled', false);
      }
    });

    $displayFormat.on('change', function() {

      $(this).
        parents('.field-group').
        find('.column-number-formatting-currency').
        parents('.field.optional').
        toggleClass('hidden', $(this).value() !== 'currency');
    });

    $overridePrecision.on('change', function(e) {
      var id = getColumnIdFromEvent(e);

      $(this).
        siblings('.column-number-formatting-override-precision-control').
        toggleClass('hidden', !$(this).value());

      updateNumberFormattingPreview(id);
    });

    $overridePrecisionRange.on('input', function(e) {
      var id = getColumnIdFromEvent(e);

      updateNumberFormattingPreview(id);
    });

    $showThousandsSeparators.on('change', function(e) {
      var id = getColumnIdFromEvent(e);

      updateNumberFormattingPreview(id);
    });

    $overrideThousandsSeparator.on('change', function(e) {
      var id = getColumnIdFromEvent(e);

      $(this).
        siblings('.column-number-formatting-override-thousands-separator-control').
        toggleClass('hidden', !$(this).value());

      updateNumberFormattingPreview(id);
    });

    $overrideThousandsSeparatorValue.on('input', function(e) {
      var id = getColumnIdFromEvent(e);

      updateNumberFormattingPreview(id);
    });

    $overrideDecimalSeparator.on('change', function(e) {
      var id = getColumnIdFromEvent(e);

      $(this).
        siblings('.column-number-formatting-override-decimal-separator-control').
        toggleClass('hidden', !$(this).value());

      updateNumberFormattingPreview(id);
    });

    $overrideDecimalSeparatorValue.on('input', function(e) {
      var id = getColumnIdFromEvent(e);

      updateNumberFormattingPreview(id);
    });

    $prev.on('click', function() {
      updatePagination(-1, $columns);
    });

    $next.on('click', function() {
      updatePagination(+1, $columns);
    });

    $cancel.on('click', function() {

      if (confirm($.t('controls.grid_view_column_editor.close_without_saving'))) {
        $columnEditor.remove();
      }
    });

    $save.on('click', function() {
      saveView(function() { window.location.reload(true); });
    });

    $convertColumnDataType.on('click', function(e) {

      // The NBE doesn't currently have the capability to convert column data types.
      if (window.blist.dataset.newBackend) {
        return;
      }

      if (confirm($.t('controls.grid_view_column_editor.convert_column_data_type_confirm'))) {
        var columnId = $(e.target).attr('data-column-id');
        var $convertColumnDataTypeStatus = $('#convert-column-data-type-status-' + columnId);
        var convertColumn = function() {
          var dataType = $('#column-data-type-' + columnId).value();
          var ajaxOptions = {
            url: '/views/' + window.blist.dataset.id + '/columns/' + columnId + '.json?method=convert&type=' + dataType,
            type: 'POST',
            contentType: 'application/json',
            success: function(response) {
              var responseIsNewColumnJson = response.hasOwnProperty('tableColumnId');
              var onComplete = function() {
                window.location.reload(true);
              };

              if (responseIsNewColumnJson) {
                onComplete();
              } else {

                var url = (
                  '/views/' +
                  window.blist.dataset.id +
                  '/columns/' +
                  columnId +
                  '.json?method=convert&type=' +
                  dataType +
                  '&ticket=' +
                  response.ticket
                );

                pollConvertColumnEndpointUntilComplete(url, $convertColumnDataTypeStatus, onComplete);
              }
            },
            error: function() {
              alert(
                $.t('controls.grid_view_column_editor.error.delete')
              );
              $columnEditor.find('button').attr('disabled', false);
              $columnEditor.find('.loadingSpinnerContainer').addClass('hidden');
            }
          };

          $columnEditor.find('button').attr('disabled', true);
          $columnEditor.find('.loadingSpinnerContainer').removeClass('hidden');

          $.ajax(ajaxOptions);
        };

        $convertColumnDataTypeStatus.show();

        saveView(convertColumn);
      }
    });

    $delete.on('click', function(e) {

      if (confirm($.t('controls.grid_view_column_editor.delete_column_confirm'))) {
        var columnId = $(e.target).attr('data-column-id');
        var ajaxOptions = {
          url: '/api/views/' + window.blist.dataset.id + '/columns/' + columnId + '.json',
          type: 'DELETE',
          contentType: 'application/json',
          success: function() {
            window.location.reload(true);
          },
          error: function() {
            alert(
              $.t('controls.grid_view_column_editor.error.delete')
            );
            $columnEditor.find('button').attr('disabled', false);
            $columnEditor.find('.loadingSpinnerContainer').addClass('hidden');
          }
        };

        $columnEditor.find('.loadingSpinnerContainer').removeClass('hidden');
        $columnEditor.find('button').attr('disabled', true);

        $.ajax(ajaxOptions);
      }
    });
  }

  var columns = _.get(options, 'columns', []);
  var selectedColumnId = _.get(options, 'id', false);
  var selectedColumnIndex = columns.
    map(function(column) {
      return column.id;
    }).
    indexOf(selectedColumnId);
  var $columnEditor = renderColumnEditor(window.blist.dataset.id, columns);
  var $firstColumn;
  var firstColumnName;

  attachColumnEditorEvents($columnEditor, columns);

  $('body').append($columnEditor);

  if (selectedColumnId && selectedColumnIndex >= 0) {
    var $columnToShow = $columnEditor.find('.column[data-column-id="' + selectedColumnId + '"]');
    $columnEditor.find('#column-name').text(
      generateColumnPositionString($columnToShow.find('.column-name').value(), selectedColumnIndex, columns.length)
    );
    $columnEditor.find('.column').addClass('hidden');
    $columnToShow.removeClass('hidden');
  } else {
    $firstColumn = $columnEditor.find('.column').first();
    firstColumnName = $firstColumn.find('input.column-name').value();
    $columnEditor.find('#column-name').text(
      generateColumnPositionString(firstColumnName, 0, columns.length)
    );
    $firstColumn.removeClass('hidden');
  }
};
