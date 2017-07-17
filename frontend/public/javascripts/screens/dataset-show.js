var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

/**
 * EN-16481 - Alternate column edit mechanism for NBE-only grid view
 *
 * There were enough bugs around NBE-only datasets having slightly different
 * column editing behavior that I felt it was more managable to provide
 * an alternate column editing experience for NBE-only datasets, and that that
 * new experience would be presented as a single modal window instead of spread
 * out across different controls (specifically the column header dropdown and
 * the edit column pane).
 *
 * This function is called whenever the user clicks any of the buttons that
 * would, on a 'default' grid view page, cause one of those controls to open.
 * It instead draws a modal window that allows editing of all columns' metadata
 * en masse, and which forces an update to the view using the API and then a
 * hard page refresh instead of trying to track/predict/preempt the view's
 * representation in Core by mimicking Core's behavior poorly in Javascript.
 */
blist.datasetPage.launchNbeColumnManager = function(options) {

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

  function renderNbeColumnManager(viewUid, columnsToRender) {

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

        var common = [
          {value: 'USD', text: 'United States, Dollars (USD)'},
          {value: 'EUR', text: 'Eurozone, Euros (EUR)'},
          {value: 'GBP', text: 'Great Britain, Pounds (GBP)'},
          {value: 'RUB', text: 'Russia, Rubles (RUB)'},
          {value: 'CAD', text: 'Canada, Dollars (CAD)'}
        ];
        var other = [
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
            'label="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.currency.common') + '">' +
            renderCurrencies(common) +
          '</optgroup>' +
          '<optgroup ' +
            'label="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.currency.other') + '">' +
            renderCurrencies(other) +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.display_format.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.display_format.title') +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.currency.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.currency.title') +
            '</label>' +
            '<select ' +
              'id="column-number-formatting-currency-' + id + '" ' +
              'class="column-number-formatting-currency" ' +
              'name="column-number-formatting-currency-' + id + '">' +
              renderCurrencyOptions() +
            '</select>' +
          '</div>' +
          '<h4>' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.title') + '</h4>' +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.precision') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.precision') +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.show_thousands_separators') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.show_thousands_separators') +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_thousands_separator.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_thousands_separator.title') +
            '</label>' +
            '<div ' +
              'id="column-number-formatting-override-thousands-separator-' + id + '-control" ' +
              'class="column-number-formatting-override-thousands-separator-control' + overrideThousandsSeparatorControlHidden + '">' +
              '<input ' +
                'id="column-number-formatting-override-thousands-separator-' + id + '-value" ' +
                'class="column-number-formatting-override-thousands-separator-value" ' +
                'type="text" ' +
                'name="column-number-formatting-override-thousands-separator-' + id + '-value" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_thousands_separator.title') + '" ' +
                'value="' + thousandsSeparatorValue + '" ' +
                'placeholder="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_thousands_separator.placeholder') + '">' +
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_decimal_separator.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_decimal_separator.title') +
            '</label>' +
            '<div ' +
              'id="column-number-formatting-override-decimal-separator-' + id + '-control" ' +
              'class="column-number-formatting-override-decimal-separator-control' + overrideDecimalSeparatorControlHidden + '">' +
              '<input ' +
                'id="column-number-formatting-override-decimal-separator-' + id + '-value" ' +
                'class="column-number-formatting-override-decimal-separator-value" ' +
                'type="text" ' +
                'name="column-number-formatting-override-decimal-separator-' + id + '-value" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_decimal_separator.title') + '" ' +
                'value="' + decimalSeparatorValue + '" ' +
                'placeholder="' + $.t('controls.nbe_column_manager.column_fields.number_formatting.advanced.override_decimal_separator.placeholder') + '">' +
            '</div>' +
          '</div>' +
        '</div>' +
        // Preview
        '<div class="field-group preview">' +
          '<div class="field">' +
            '<label ' +
              'class="top" ' +
              'for="column-number-formatting-' + id + '-preview" ' +
              'title="' + $.t('controls.nbe_column_manager.column_fields.preview.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.preview.title') +
            '</label>' +
            '<input ' +
              'id="column-number-formatting-' + id + '-preview" ' +
              'class="column-number-formatting-preview" ' +
              'type="text" ' +
              'value="' + renderNumberFormattingPreview(column.format) + '" ' +
              'disabled>' +
            '<span class="column-number-formatting-preview-note">' +
              $.t('controls.nbe_column_manager.column_fields.preview.note') +
            '</span>' +
          '</div>' +
        '</div>'
      );
    }

    function renderDateFormatting(column) {

      function renderDateFormatOptions() {
        var displayFormat = _.get(column, 'format.view', null);
        var formats = [
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.date_formatting.display_format.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.date_formatting.display_format.title') +
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
      var id = column.id;
      var fieldName = column.fieldName;
      var dataType = column.dataTypeName;
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
                'title="' + $.t('controls.nbe_column_manager.column_fields.hidden.title') + '">' +
                $.t('controls.nbe_column_manager.column_fields.hidden.title') +
              '</label>' +
            '</div>' +
            '<div class="field">' +
              // Column name
              '<label ' +
                'class="top" ' +
                'for="column-name-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.name.title') + '" ' +
                'aria-required="true">' +
                $.t('controls.nbe_column_manager.column_fields.name.title') +
              '</label>' +
              '<input ' +
                'id="column-name-' + id + '" ' +
                'class="column-name" ' +
                'type="text" ' +
                'name="column-name-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.name.title') + '" ' +
                'value="' + nameValue + '" ' +
                'placeholder="' + $.t('controls.nbe_column_manager.column_fields.name.placeholder') + '" ' +
                'aria-required="true" ' +
                'aria-invalid="false">' +
            '</div>' +
            // Column description
            '<div class="field">' +
              '<label ' +
                'class="top" ' +
                'for="column-description-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.description.title') + '">' +
                $.t('controls.nbe_column_manager.column_fields.description.title') +
              '</label>' +
              '<textarea ' +
                'id="column-description-' + id + '" ' +
                'class="column-description" ' +
                'name="column-description-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.column_fields.description.title') + '" ' +
                'placeholder="' + $.t('controls.nbe_column_manager.column_fields.description.placeholder') + '">' +
                descriptionValue +
              '</textarea>' +
            '</div>' +
          '</div>' +
          '<div class="field-group">' +
            '<div class="field column-field-name">' +
              '<label ' +
                'class="top" ' +
                'for="column-field-name-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.field_name.title') + '">' +
                $.t('controls.nbe_column_manager.field_name.title') +
              '</label>' +
              '<input ' +
                'id="column-field-name-' + id + '" ' +
                'class="column-field-name" ' +
                'type="text" ' +
                'name="column-field-name-' + id + '" ' +
                'value="' + fieldName + '" ' +
                'disabled />' +
            '</div>' +
            '<div class="field column-data-type">' +
              '<label ' +
                'class="top" ' +
                'for="column-data-type-' + id + '" ' +
                'title="' + $.t('controls.nbe_column_manager.data_type.title') + '">' +
                $.t('controls.nbe_column_manager.data_type.title') +
              '</label>' +
              '<input ' +
                'id="column-data-type-' + id + '" ' +
                'class="column-data-type" ' +
                'type="text" ' +
                'name="column-data-type-' + id + '" ' +
                'value="' + $.t('controls.nbe_column_manager.data_type.types.' + dataType) + '" ' +
                'disabled />' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function renderColumnFormatting(column) {

      function renderAlignmentOptions() {
        var alignment = _.get(column, 'format.align', 'right');
        var alignments = [
          {value: 'left', text: $.t('controls.nbe_column_manager.column_fields.alignment.left')},
          {value: 'center', text: $.t('controls.nbe_column_manager.column_fields.alignment.center')},
          {value: 'right', text: $.t('controls.nbe_column_manager.column_fields.alignment.right')}
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
              'title="' + $.t('controls.nbe_column_manager.column_fields.alignment.title') + '">' +
              $.t('controls.nbe_column_manager.column_fields.alignment.title') +
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

    function renderColumn(column) {
      var id = column.id;

      return $(
        '<div class="column hidden" data-column-id="' + id + '" data-tabs>' +
          '<ul class="nav-tabs">' +
            '<li class="tab-link current" data-tab-id="column-properties">' +
              'Column Properties' +
            '</li>' +
            '<li class="tab-link" data-tab-id="column-formatting">' +
              'Column Formatting' +
            '</li>' +
          '</ul>' +
          renderColumnProperties(column) +
          renderColumnFormatting(column) +
        '</div>'
      );
    }

    var nbeColumnManagerHtml =
      '<div id="nbe-column-manager">' +
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
              $.t('controls.nbe_column_manager.controls.prev') +
            '</button>' +
            '<button class="next">' +
              $.t('controls.nbe_column_manager.controls.next') +
              '<span class="socrata-icon-arrow-right"></span>' +
            '</button>' +
            '<button class="cancel">' +
              $.t('controls.nbe_column_manager.controls.cancel') +
            '</button>' +
            '<button class="save">' +
              $.t('controls.nbe_column_manager.controls.save') +
            '</button>' +
          '</div>' +
          '<div class="loadingSpinnerContainer hidden">' +
            '<div class="loadingSpinner"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Render modal skeleton
    var $nbeColumnManagerModal = $(nbeColumnManagerHtml);

    // Render column headers and columns
    //
    // Whatever version of jQuery is running on this page doesn't support the
    // $().append([$(), $()]) syntax, so do a forEach and call $().append() on
    // each column form instead.
    var $nbeColumnManagerColumnsContainer = $nbeColumnManagerModal.
      find('.columns-container');
    var $nbeColumnManagerColumnsContainerColumns = $nbeColumnManagerColumnsContainer.
      find('.columns');

    columnsToRender.forEach(function(column) {
      $nbeColumnManagerColumnsContainerColumns.append(renderColumn(column));
    });

    return $nbeColumnManagerModal;
  }

  function attachNbeColumnManagerEvents($manager) {

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
      var fieldName = originalColumn.fieldName;
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

        format.view = dateFormat;
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

          $column.addClass('hidden');
        }
      });

      $newColumn = $columns.eq(newIndex);
      columnName = $newColumn.find('input.column-name').value();
      $manager.find('#column-name').text(columnName);
      $newColumn.removeClass('hidden');
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
    var $cancel = $manager.find('.overlay, .cancel');

    $tabLinks.on('click', function() {
      var tabId = this.getAttribute('data-tab-id');

      $tabLinks.removeClass('current');

      if (tabId === 'column-properties') {
        $columns.find('.tab-content[data-tab-id="column-properties"]').
          removeClass('hidden');
        $columns.find('.tab-content[data-tab-id="column-formatting"]').
          addClass('hidden');
        $columnsContainer.find('.tab-link[data-tab-id="column-properties"]').
          addClass('current');
      } else {
        $columns.find('.tab-content[data-tab-id="column-properties"]').
          addClass('hidden');
        $columns.find('.tab-content[data-tab-id="column-formatting"]').
          removeClass('hidden');
        $columnsContainer.find('.tab-link[data-tab-id="column-formatting"]').
          addClass('current');
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
      $nbeColumnManager.remove();
    });

    $save.on('click', function() {
      // Update the column metadata with the values in the forms.
      var viewToPut = {};
      viewToPut.columns = $columns.toArray().map(function(columnForm) {
        var id = parseInt(columnForm.getAttribute('data-column-id'), 10);
        var column = getColumnDefaultOptions(id);

        column.format = getColumnFormatOptions(id);

        return column;
      });

      var ajaxOptions = {
        url: '/api/views/' + blist.dataset.id + '.json',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(viewToPut),
        dataType: 'json',
        success: function() {
          window.location.reload(true);
        },
        error: function() {
          $nbeColumnManager.find('.loadingSpinnerContainer').addClass('hidden');
          alert(
            $.t('controls.nbe_column_manager.error.save')
          );
          $nbeColumnManager.find('.controls').find('button').attr('disabled', false);
        }
      };

      $nbeColumnManager.find('.controls').find('button').attr('disabled', true);
      $nbeColumnManager.find('.loadingSpinnerContainer').removeClass('hidden');

      $.ajax(ajaxOptions);
    });
  }

  // Get all columns as JSON objects, not instances. Because we are pulling from
  // blist.dataset, they should be up-to-date with regard to other changes the
  // user has made (e.g. to column order), and since we get the 'fresh' version
  // every time we render the modal, we should not run into metadata drift any
  // worse than we already do on account of the Dataset model being a little
  // iffy.
  var columns = blist.dataset.columns.map(function(column) {
    var cleanColumn = column.cleanCopy();
    // The 'noCommas' and 'precision' properties, when present, have values that
    // are essentially booleans and numbers but represented as strings,
    // respectively (ugh), so in order to simplify the code that actually deals
    // with these things above we do those conversions here in a
    // 'pre-processing' step. We'll also have to convert these values, if
    // present, back into strings in a 'post-processing' step before we PUT to
    // /api/views/<viewUid>.
    //
    // I'd really like to know who, if anyone, thought this arrangement was a
    // good idea in the first place. I'm guessing it has something to do with
    // Rails (originally) handling a lot of this stuff automatically, but that's
    // mainly because I find The Rails Way an irritating crop blight that
    // quickly spreads beyond Rails and into the rest of the stack out of hubris
    // or carelessness. YMMV.
    if (cleanColumn.format.hasOwnProperty('noCommas')) {
      cleanColumn.format.noCommas = (cleanColumn.format.noCommas === 'true') ?
        true :
        false;
    }
    // This is also the case for the 'precision' property, which is apparently
    // a string represenation of a number when it is present.
    if (cleanColumn.format.hasOwnProperty('precision')) {
      cleanColumn.format.precision = parseInt(cleanColumn.format.precision, 10);
    }

    return cleanColumn;
  // Remove system columns (which have an id of -1)
  }).filter(function(column) {
    return column.id >= 0;
  // Sort by position
  }).sort(function(a, b) {
    var aPosition = _.get(a, 'position', -1);
    var bPosition = _.get(b, 'position', -1);

    return (aPosition <= bPosition) ? -1 : 1;
  });
  var selectedColumnId = _.get(options, 'id', false);
  var $nbeColumnManager = renderNbeColumnManager(blist.dataset.id, columns);
  var $firstColumn;
  var firstColumnName;

  attachNbeColumnManagerEvents($nbeColumnManager, columns);

  $('body').append($nbeColumnManager);

  if (selectedColumnId) {
    var $columnToShow = $nbeColumnManager.find('.column[data-column-id="' + selectedColumnId + '"]');
    $nbeColumnManager.find('#column-name').text($columnToShow.find('.column-name').value());
    $nbeColumnManager.find('.column').addClass('hidden');
    $columnToShow.removeClass('hidden');
  } else {
    $firstColumn = $nbeColumnManager.find('.column').first();
    firstColumnName = $firstColumn.find('input.column-name').value();
    $nbeColumnManager.find('#column-name').text(firstColumnName);
    $firstColumn.removeClass('hidden');
  }
};

blist.datasetPage.adjustSize = function() {
  $(window).resize();
};

blist.datasetPage.clearTempView = function() {
  $('#sidebarOptions a.alert').removeClass('alert');
  $('body, #datasetBar').removeClass('unsavedView minorChange');
  datasetPageNS.sidebar.updateEnabledSubPanes();

  // If pill buttons don't match ADT, then hide them
  $('#renderTypeOptions li a:visible').each(function() {
    var $a = $(this);
    var type = $.urlParam($a.attr('href'), 'defaultRender');
    if (type == 'richList') {
      type = 'fatrow';
    }
    if (!_.include(blist.dataset.metadata.availableDisplayTypes, type)) {
      $a.addClass('hide');
    }
  });
};

blist.datasetPage.flashTimedNotice = function(warning, timeout) {
  var closeIcon = {
    _: 'a',
    href: '#',
    className: 'close',
    contents: {
      _: 'span',
      className: 'icon',
      contents: 'close'
    }
  };
  var flash = $.tag2({
    _: 'div',
    className: 'flash notice',
    contents: [closeIcon, warning]
  });
  $('#noticeContainer').append(flash);
  flash.find('a.close').click(function(e) {
    e.preventDefault();
    flash.fadeOut();
  });
  if (timeout) {
    setTimeout(flash.fadeOut.bind(flash), timeout);
  }
};

blist.datasetPage.setTempView = function() {
  if (blist.dataset.minorChange && !blist.dataset.hasRight(blist.rights.view.UPDATE_VIEW)) {
    return;
  }

  $('body, #datasetBar').addClass('unsavedView').
  toggleClass('minorChange', blist.dataset.minorChange);
  // For now unsaved view means something has changed in filter tab
  $('#sidebarOptions .tabFilter a').addClass('alert');
  datasetPageNS.sidebar.updateEnabledSubPanes();

  if (!blist.currentUserId) {
    blist.datasetPage.flashTimedNotice($.t('screens.ds.show.unauthenticated_alert'), 10000);
  }
};

blist.datasetPage.updateValidView = function() {
  $('.invalidView').removeClass('invalidView');
  datasetPageNS.sidebar.updateEnabledSubPanes();
};

(function($) {
  if (!blist.dataset) {
    blist.dataset = {};
  }
  if (!blist.dataset.valid) {
    $('body').addClass('invalidView');
  }

})(jQuery);

$(function() {

  // Before we do anything else, clear away the about metadata.
  $('.aboutLoad .aboutDataset').appendTo('#js-appended-templates');
  $('.aboutLoad').remove();

  // Before we fullscreen, move the footer inside the sizing container.
  $('#siteFooter, #site-chrome-footer').
  addClass('clearfix').
  appendTo('.siteInnerWrapper');

  $('.outerContainer').fullScreen();

  // Set up pill buttons to change render types
  if ($('#renderTypeOptions').length > 0) {
    // Render types
    $('#renderTypeOptions').pillButtons({
      multiState: true,
      defaultSelector: null,
      hasClickHandler: function($button) {
        return $button.data('popupSelect-tip');
      }
    });
    $.live('#renderTypeOptions a', 'click', function(e) {
      e.preventDefault();
      var $button = $(this);
      var rt = $.urlParam($button.attr('href'), 'defaultRender');
      if (rt == 'richList') {
        rt = 'fatrow';
      }

      if ($button.data('popupSelect-tip')) {
        return;
      }

      var finished = function(id) {
        // Would call show on renderTypeManager; but updating the
        // dataset fires an event that RTM listens to. Except that if
        // we have a dt/rt mismatch, then just run a show
        if (blist.dataset.metadata.renderTypeConfig.visible[rt] !=
          datasetPageNS.rtManager.visibleTypes[rt]) {
          datasetPageNS.rtManager.toggle(rt);
        } else if (id) {
          var activeId = _.get(
            blist,
            'dataset.metadata.renderTypeConfig.active.' + rt + '.id',
            blist.dataset.id
          );
          if (id != activeId) {
            var newMD = $.extend({}, blist.dataset.metadata);
            $.deepSet(newMD, id, 'renderTypeConfig', 'active', rt, 'id');
            blist.dataset.update({
              metadata: newMD
            });
          }
          if (datasetPageNS.rtManager.visibleTypes[rt]) {
            datasetPageNS.rtManager.hide(rt);
          }
          datasetPageNS.rtManager.show(rt);
        } else {
          blist.dataset.toggleRenderType(rt);
        }
      };

      if ($button.data('noChildren')) {
        finished();
        return;
      }

      blist.dataset.getChildOptionsForType(rt, function(options) {
        if (options.length > 1) {
          $button.toggleClass('active', blist.dataset.metadata.renderTypeConfig.visible[rt]).
          popupSelect({
            canDeselect: true,
            choices: options,
            isSelected: function(option) {
              var selId = $.deepGetStringField(blist.dataset.metadata,
                'renderTypeConfig.active.' + rt + '.id');
              return $.deepGetStringField(blist.dataset.metadata,
                  'renderTypeConfig.visible.' + rt) &&
                (option.id == selId || $.isBlank(selId) && option.id == blist.dataset.id);
            },
            prompt: 'Select a layer:',
            renderer: function(option) {
              return option.name;
            },
            selectCallback: function(option, checked) {
              if (checked) {
                if (option === blist.dataset) {
                  // User selected the parent dataset.
                  // If the user previously saved the view with the table displaying another dataset
                  // (map layer), getViewForDisplay will give us the ID of that other dataset (because,
                  // technically, that's the tabular view to display for that dataset).
                  // So, assume the user wants to display the parent dataset here (because they
                  // clicked its name).
                  // We still need to call getViewForDisplay for non-parent views, to ensure
                  // children always load a displayable view.
                  finished(option.id);
                } else {
                  option.getViewForDisplay(rt, function(viewToDisplay) {
                    finished(viewToDisplay.id);
                  });
                }
              } else {
                finished();
              }
              return checked;
            }
          }).data('popupSelect-tip').show();

          $button.data('popupSelect-width', $(window).width());
          $(window).resize(function() {
            var width = $(window).width();
            $button.data('popupSelect-tip').
            adjustPosition({
              left: width - $button.data('popupSelect-width')
            });
            $button.data('popupSelect-width', width);
          });
        } else {
          $button.data('noChildren', true);
          finished();
        }
      });
    });
  }

  blist.$container.bind('render_type_shown', function(e, newType) {
    $('body').addClass(newType + '-renderType');

    if ($('#renderTypeOptions').length > 0) {
      var $pb = $('#renderTypeOptions li .' + newType);
      if ($pb.length < 1) {
        var $li = $('#renderTypeOptions li .template').parent().clone();
        $pb = $li.find('a').removeClass('template hide').addClass(newType);
        $pb.attr('title', $pb.attr('title').replace('template', newType));
        $pb.attr('href', $.urlParam($pb.attr('href'),
          'defaultRender', newType));
        $('#renderTypeOptions').prepend($li);
      }
      $pb.addClass('active').removeClass('hide');
    }

    if (!blist.dataset.metadata.renderTypeConfig.visible[newType]) {
      blist.dataset.showRenderType(newType);
    }
  });

  blist.$container.bind('render_type_hidden', function(e, oldType) {
    $('body').removeClass(oldType + '-renderType');

    if ($('#renderTypeOptions').length > 0) {
      var $pb = $('#renderTypeOptions li .' + oldType);
      if ($pb.length > 0) {
        $pb.removeClass('active');
      }
    }

    if (blist.dataset.metadata.renderTypeConfig.visible[oldType]) {
      blist.dataset.hideRenderType(oldType);
    }
  });

  // Initialize all data rendering
  var defRen = $.urlParam(window.location.href, 'defaultRender');
  if (defRen == 'richList') {
    defRen = 'fatrow';
  }
  if (!$.isBlank(blist.initialRowId)) {
    defRen = 'page';
  }

  var openSidebar = false;
  if (blist.dataset.displayFormat.viewDefinitions) {
    if (!blist.dataset.childViews) {
      blist.dataset.childViews = _.pluck(blist.dataset.displayFormat.viewDefinitions, 'uid');
    }

    var viewId = blist.dataset.displayFormat.viewDefinitions[0].uid;
    if (viewId != 'self') {
      _.each(blist.dataset.metadata.renderTypeConfig.visible || [], function(v, type) {
        if (v && _.include(['table', 'page', 'fatrow'], type) && !$.subKeyDefined(blist.dataset.metadata, 'renderTypeConfig.active.' + type + '.id')) {
          $.deepSet(blist.dataset.metadata, viewId, 'renderTypeConfig', 'active', type, 'id');
        }
      });

      if ($.subKeyDefined(blist.dataset, 'metadata.query.' + viewId + '.filterCondition') && (blist.dataset.metadata.query[viewId].filterCondition.children || []).length > 0) {
        openSidebar = true;
      }
    }
  }

  datasetPageNS.rtManager = blist.$container.renderTypeManager({
    view: blist.dataset,
    defaultTypes: defRen,
    editEnabled: (
      // EN-10110/EN-16621 - Disable cell-level editing for NBE-only datasets
      !blist.feature_flags.enable_nbe_only_grid_view_optimizations &&
      !blist.dataset.isImmutable() &&
      (blist.dataset.isUnpublished() || blist.dataset.viewType != 'tabular')
    ),
    columnEditEnabled: !blist.dataset.isImmutable(),
    common: {
      editColumnCallback: function(col) {
        // EN-10110/EN-16481 - Alternate column edit mechanism for NBE-only grid view
        if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
          blist.datasetPage.launchNbeColumnManager();
        } else {
          datasetPageNS.sidebar.hide();
          datasetPageNS.sidebar.show('columnProperties', col);
        }
      },
      showRowHandle: true,
      manualResize: true
    },
    table: {
      addColumnCallback: function(parId) {
        datasetPageNS.sidebar.show('edit.addColumn', {
          parentId: parId
        });
      }
    },
    socrataVizTable: {
      addColumnCallback: function(parId) {
        datasetPageNS.sidebar.show('edit.addColumn', {
          parentId: parId
        });
      }
    },
    page: {
      defaultRowId: blist.initialRowId
    }
  });

  var $dataGrid;
  if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
    $dataGrid = datasetPageNS.rtManager.$domForType('socrataVizTable');
  } else {
    $dataGrid = datasetPageNS.rtManager.$domForType('table');
  }

  $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId, updateOnly) {
    var uid;
    if (typeof rowId == 'string' && rowId.indexOf('/') > -1) {
      var splitRowId = rowId.split('/');
      uid = splitRowId[0];
      rowId = splitRowId[1];
    }

    var curId = $.deepGet(blist.dataset.metadata.renderTypeConfig, 'active', 'page', 'id');
    var sameDS = curId == uid || $.isBlank(curId) && uid == blist.dataset.id;
    if (!updateOnly || (blist.dataset.metadata.renderTypeConfig.visible.page && !sameDS)) {
      datasetPageNS.rtManager.setTypeConfig('page', {
        defaultRowId: rowId
      });
      blist.dataset.showRenderType('page', uid, !sameDS);
    }
  });

  // sidebar and sidebar tabs
  var $columnChoosersDomForType;
  var waitOnDataset;
  if (blist.feature_flags.enable_nbe_only_grid_view_optimizations) {
    $columnChoosersDomForType = blist.$container.renderTypeManager().$domForType('socrataVizTable');
    waitOnDataset = false;
  } else {
    $columnChoosersDomForType = blist.$container.renderTypeManager().$domForType('table');
    waitOnDataset = blist.dataset.type != 'form' && blist.dataset.valid;
  }

  datasetPageNS.sidebar = $('#gridSidebar').gridSidebar({
    position: blist.sidebarPosition || 'right',
    waitOnDataset: waitOnDataset,
    onSidebarShown: function(primaryPane) {
      var $opts = $('#sidebarOptions');
      $opts.find('li').removeClass('active');

      var $activeLink = $('#sidebarOptions').find('a[data-paneName=' + primaryPane + ']');
      if ($activeLink.length > 0) {
        $opts.css('background-color', $activeLink.css('background-color'));
        $activeLink.closest('li').addClass('active');
      } else {
        $opts.css('background-color', 'transparent').find('li').removeClass('active');
      }
    },
    onSidebarClosed: function() {
      $('#sidebarOptions').css('background-color', 'transparent').
      find('li').removeClass('active');
    },
    columnChoosers: $columnChoosersDomForType,
    renderTypeManager: blist.$container.renderTypeManager(),
    resizeNeighbor: blist.$container,
    setSidebarTop: false,
    view: blist.dataset
  });

  // Conditionally hide sidebar option links based on whether a sidebar pane is present.
  // Note: Embed button visibility is also affected by the `enable_embed_widget_for_nbe` feature flag.
  $('#sidebarOptions').find('a[data-paneName]').each(function() {
    var $anchor = $(this);
    var dataPaneName = $anchor.attr('data-paneName');

    if (datasetPageNS.sidebar.hasPane(dataPaneName)) {
      $anchor.click(function(e) {
        e.preventDefault();
        datasetPageNS.sidebar.show(dataPaneName);
        $.analytics && $.analytics.trackEvent(
          'dataset page (v4-chrome)',
          dataPaneName + ' pane opened',
          blist.dataset.id
        );
      });
    } else {
      $anchor.closest('li').hide();
    }
  });

  datasetPageNS.$feedTab = $('#sidebarOptions').find('a.feed');
  if (datasetPageNS.$feedTab.is(':visible')) {
    datasetPageNS.$feedTab.
    contentIndicator().setText(blist.dataset.numberOfComments || '');
  }

  // Show guided filter by default if there is a default filter
  var hasConditions = function(filterCondition) {
    return (filterCondition.children || []).length > 0;
  };
  if (openSidebar ||
    ($.subKeyDefined(blist.dataset, 'query.filterCondition') &&
      hasConditions(blist.dataset.query.filterCondition)) ||
    ($.subKeyDefined(blist.dataset, 'metadata.filterCondition') &&
      hasConditions(blist.dataset.metadata.filterCondition))) {
    datasetPageNS.sidebar.setDefault('filter.unifiedFilter');
  }
  // Also, text search for viewDefinitions for the other case.

  // Pop a sidebar right away if they ask for it
  var paneName = $.urlParam(window.location.href, 'pane') || blist.defaultPane;
  if (_.isString(paneName) && !$.isBlank(paneName)) {
    datasetPageNS.sidebar.show(paneName);
  } else if (blist.dataset.visibleColumns &&
    blist.dataset.visibleColumns.length == 0 &&
    !blist.sidebarHidden.edit.addColumn) {
    datasetPageNS.sidebar.show('edit.addColumn');
  }

  var sidebarUpdate = function() {
    datasetPageNS.sidebar.updateEnabledSubPanes();
  };
  blist.dataset.
  bind('columns_changed', sidebarUpdate).
  bind('displaytype_change', sidebarUpdate);

  // Hook up search form
  var $clearSearch = $('#searchForm .clearSearch');
  var $searchForm = $('#searchForm');

  $searchForm.submit(function(e) {
    e.preventDefault();
    var searchString = $(e.currentTarget).find(':input.searchField').val();
    var inDatasetSearch = $(e.currentTarget).find(':input[name=inDatasetSearch]').val() === 'true';

    blist.dataset.setSearchString(searchString, inDatasetSearch);

    if (!searchString) {
      $clearSearch.hide();
    } else {
      $clearSearch.show();
    }
  });

  var resetSearchForm = function() {
    $searchForm.find(':input:text').focus().val(blist.dataset.metadata.jsonQuery.search).blur();
    $clearSearch.toggle(!$.isBlank(blist.dataset.metadata.jsonQuery.search));
  };

  $clearSearch.click(function(e) {
    e.preventDefault();
    var md = $.extend(true, {}, blist.dataset.metadata);
    delete md.jsonQuery.search;
    blist.dataset.update({
      metadata: md
    });
    resetSearchForm();
  }).hide();
  blist.dataset.bind('clear_temporary', function() {
    resetSearchForm();
  });

  if (!$.isBlank(blist.dataset.metadata.jsonQuery.search)) {
    $searchForm.find(':input').focus().val(blist.dataset.metadata.jsonQuery.search).blur();
    $clearSearch.show();
  }

  // toolbar area
  $('#description').expander({
    contentSelector: 'div.descriptionContent',
    expanderCollapsedClass: 'rightArrow',
    expandSelector: '.descriptionExpander',
    moveExpandTrigger: true,
    resizeFinishCallback: datasetPageNS.adjustSize
  });

  var $dsIcon = $('#datasetIcon');
  $dsIcon.socrataTip($dsIcon.text());

  $('.fullscreenButton').click(function(event) {
    event.preventDefault();

    $('#siteHeader, #site-chrome-header, #siteFooter, #site-chrome-footer').animate({
        opacity: 'toggle'
      },
      datasetPageNS.adjustSize);
    datasetPageNS.adjustSize(); // So that when animating in footer is visible.
    $(this).
    toggleClass('maximize').
    toggleClass('minimize');
  });

  $('#shareOptions .email').click(function(event) {
    event.preventDefault();
    if (_.isFunction(blist.dialog.sharing)) {
      blist.dialog.sharing(event);
    }
  });

  $('#shareOptions .subscribe').click(function(event) {
    event.preventDefault();
    if (_.isFunction(blist.dialog.subscribe)) {
      blist.dialog.subscribe();
    }
  });

  // Edit toolbar
  $('#editOptions .undo').click(function(event) {
    event.preventDefault();
    if (!$(event.target).is('.disabled')) {
      $dataGrid.blistModel().undo();
    }
  });
  $('#editOptions .redo').click(function(event) {
    event.preventDefault();
    if (!$(event.target).is('.disabled')) {
      $dataGrid.blistModel().redo();
    }
  });
  $dataGrid.bind('undo_redo_change', function() {
    var model = $dataGrid.blistModel(); // eslint-disable-line no-shadow
    $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
    $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
  });
  if (!$.isBlank($dataGrid.blistModel)) {
    var model = $dataGrid.blistModel(); // eslint-disable-line no-shadow
    $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
    $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
  }


  // Format toolbar
  $('#formatOptions select').uniform();

  $('#formatOptions').formatOptions({
    gridSelector: $dataGrid
  });


  // Unsaved view stuff
  blist.dataset.bind('set_temporary', datasetPageNS.setTempView);
  blist.dataset.bind('clear_temporary', datasetPageNS.clearTempView);

  blist.datasetControls.unsavedViewPrompt();

  $('.unsavedLine a.save').click(function(e) {
    e.preventDefault();
    var $a = $(this);
    if ($a.is('.disabled')) {
      return;
    }

    $a.data('saveText', $a.text());
    $a.text($a.attr('data-savingText'));
    $a.addClass('disabled');

    blist.dataset.save(function() {
      $a.text($a.data('saveText'));
      $a.removeClass('disabled');
    });
  });

  $('.unsavedLine a.saveAs').click(function(e) {
    e.preventDefault();
    blist.datasetControls.showSaveViewDialog();
  });

  $('.unsavedLine a.revert, .basedOnTemp .revertLink').click(function(e) {
    // start reloading ASAP; visual indicator and preventDefault are helpful but
    // totally moot if the page reload begins quickly enough
    window.location.reload();
    $('.innerContainer .loadingSpinnerContainer').removeClass('hidden hide');
    e.preventDefault();
  });

  // Publishing
  blist.datasetControls.hookUpPublishing($('#infoBox'));

  blist.$container.bind('attempted_edit', function(e) {
    if (!blist.dataset.isPublished() || !blist.dataset.canEdit() ||
      $.isBlank(blist.currentUserId)) {
      return;
    }

    var showTip = function() {
      $(e.target).socrataTip({
        content: blist.datasetControls.editPublishedMessage(),
        showSpike: false,
        trigger: 'now'
      });
    };
    if (!blist.dataset.isDefault()) {
      blist.dataset.getParentDataset(function(parDS) {
        if (!$.isBlank(parDS) && parDS.canEdit()) {
          showTip();
        }
      });
    } else {
      showTip();
    }
  });

  $.live('.button.editPublished', 'click', function(e) {
    e.preventDefault();
    var $t = $(this);
    if ($t.hasClass('disabled')) {
      return;
    }

    if ($t.closest('.bt-wrapper').length > 0) {
      $t.closest('.bt-wrapper').data('socrataTip-$element').socrataTip().hide();
    }

    blist.dataset.getUnpublishedDataset(function(unpub) {
      if (!$.isBlank(unpub)) {
        unpub.redirectTo();
      } else {

        var onAsyncComputationComplete = function() {
          var wasPending = false;

          var success = function(copyView) {
            if (wasPending) {
              datasetPageNS.sidebar.show('edit');
              $('.editAlert').find('.editPublished, .doneCopyingMessage').removeClass('hide');
              $('.editAlert').find('.copyingMessage').addClass('hide');
            } else {
              copyView.redirectTo();
            }
          };

          var pending = function() {
              $('.editAlert').find('.editPublished, .editMessage').addClass('hide');
              $('.editAlert').find('.copyingMessage').removeClass('hide');
              wasPending = true;
          };

          var error = function() {
              if (wasPending) {
                datasetPageNS.sidebar.show('edit');
              }
              $('.editAlert').find('.errorMessage').removeClass('hide');
              $('.editAlert').find('.copyingMessage, .editPublished, .editMessage').addClass('hide');
          };

          blist.dataset.makeUnpublishedCopy(success, pending, error);
        };

        var onAsyncComputationError = function(errorMessage) {
          var $editPublishedButton = $('.editAlert').find('.editPublished');

          // Socrata Tip seems to refuse to re-render itself if you attempt to
          // re-instantiate it on an object to which a Socrata Tip is already bound,
          // so we will destroy it first (if it is a Socrata Tip) and then reinstantiate
          // in order to persist the least amount of state possible.
          if ($editPublishedButton.isSocrataTip()) {
            $editPublishedButton.data('socrataTip').destroy();
          }

          // We use a defer here to escape the stack and allow the Socrata Tip to
          // destroy itself before attempting to reinstantiate it.
          _.defer(
            function() {
              $editPublishedButton.socrataTip({
                content: $.tag2({
                  _: 'p',
                  className: 'errorMessage',
                  contents: errorMessage
                }),
                showSpike: false,
                trigger: 'now'
              });
            }
          );
        };

        // First check if working copy creation is available (i.e. if geo- or region-coding is done)
        var isPublished = true;
        blist.dataset.isPublicationStageChangeAvailable(isPublished, function(isAvail, unavailMsg) {
          if (isAvail) {
            onAsyncComputationComplete();
          } else {
            onAsyncComputationError(unavailMsg);
          }
        });
      }
    });
  });

  // If this is a newly unpublished dataset on the first run, show a warning
  if (blist.dataset.isUnpublished() && $.urlParam(window.location.href, 'firstRun') == 'true') {
    $('#infoBox #datasetName').socrataTip({
      trigger: 'now',
      showSpike: false,
      closeOnClick: false,
      content: $.tag({
        tagName: 'div',
        'class': 'unpublishedAlert',
        contents: [{
          tagName: 'p',
          contents: $.t('screens.ds.show.unpublished_alert')
        }, {
          tagName: 'a',
          'class': ['button', 'close'],
          contents: 'OK'
        }]
      })
    });
    $.live('.unpublishedAlert .close', 'click', function(e) {
      e.preventDefault();
      $('#infoBox #datasetName').socrataTip().destroy();
    });
  }

  // Invalid views
  blist.dataset.bind('valid', function() {
    datasetPageNS.updateValidView();
  });

  $('.viewError').text(blist.dataset.invalidMessage());

  var viewEditPane = $.gridSidebar.
  paneForDisplayType[blist.dataset.metadata.availableDisplayTypes[0]] ||
    $.gridSidebar.paneForDisplayType[blist.dataset.type];
  if ($.isBlank(viewEditPane) || !datasetPageNS.sidebar.isPaneEnabled(viewEditPane)) {
    $('.invalidActions .editView').hide();
  } else {
    $('.invalidActions .editView').click(function(e) {
      e.preventDefault();
      datasetPageNS.sidebar.show(viewEditPane);
    });
  }

  $('.invalidActions .removeView').click(function(e) {
    e.preventDefault();
    if (!confirm($.t('screens.ds.show.remove_confirm'))) {
      return;
    }

    blist.dataset.remove(function() {
      blist.dataset.getParentView(function(parDS) {
        if (!$.isBlank(parDS)) {
          parDS.redirectTo();
        } else {
          window.location = '/datasets';
        }
      });
    });
  });

  $.fn.shortenActionBar = function(options) {
    var $this = $(this);
    var tooLong = function() {
      return _.uniq($this.find('#sidebarOptions li:visible').map(
        function() {
          return $(this).position().top;
        })).length > 1;
    };

    var $moreButton = $this.find('a.other').parent(),
      $dropdown = $('#moreActionBarButtons');

    if (!$dropdown.exists()) {
      $dropdown = $('<ul class="hide" id="moreActionBarButtons">');
      $this.append($dropdown);
      $moreButton.click(function(e) {
        e.preventDefault();
        $dropdown.toggleClass('hide');
      });
    }

    var priorityButtons = options.priorityForTruncate.slice(),
      movedButtons = [];

    var truncateButton = function() {
      $moreButton.addClass('hide');

      var $target;
      if (priorityButtons.length > 0) {
        $target = $this.find('a.' + priorityButtons.shift()).parent();
      } else {
        $target = $this.find('a:visible:last').parent();
      }

      movedButtons.push($target.index());
      $dropdown.append($target);
      $moreButton.removeClass('hide');
    };

    var restoreButton = function() {
      var index = movedButtons.pop(),
        $target = $dropdown.children(':last'),
        clsName = $target.find('a').attr('class');

      if (_.include(options.priorityForTruncate, clsName)) {
        priorityButtons.unshift(clsName);
      }
      $target.insertBefore($('#sidebarOptions li:eq(' + index + ')'));

      if (!$dropdown.children().exists()) {
        $moreButton.addClass('hide');
        $dropdown.addClass('hide');
      }
    };

    var windowWidth = Infinity,
      resizing = false,
      offset = $('#description').position().left - $('#sidebarOptions').padding().left;
    $(window).resize(_.debounce(function() {
      if (resizing) {
        return;
      }
      resizing = true;
      var width = $(window).width();

      // Not worth it to run calcs at this point.
      if (width < $('.siteOuterWrapper').width() - 70) {
        windowWidth = width;
        resizing = false;
        return;
      }

      var optionsWidth = function() {
        if (blist.sidebarPosition == 'left') {
          return width * 0.9;
        }
        var overlapWidth = $('#description, #description .collapsed').width();
        if (overlapWidth) {
          return width - (overlapWidth + offset);
        } else {
          return width * 0.85;
        }
      };
      $('.sidebarOptionsContainer').width(optionsWidth());

      if (windowWidth < width) { // Bigger!
        while (!tooLong() && $dropdown.children().exists()) {
          restoreButton();
        }
        if (tooLong()) {
          truncateButton();
        }
      } else if (windowWidth > width) {
        while (tooLong()) {
          truncateButton();
        }
      }

      windowWidth = width;
      resizing = false;
    }, 500));
  };
  $('#actionBar').shortenActionBar({
    priorityForTruncate: ['feed', 'embed', 'export']
  });

  // iPad special casing
  if ($.device.ipad) {
    // essentially, disable scrolling of the main container
    $(document).bind('touchmove', function(event) {
      event.originalEvent.preventDefault();
    });
  }

  blist.dataset.bind('dataset_last_modified', function(event) {
    var $notice = $('#datasetName + .outOfDate');
    var message = $.t('screens.ds.bar.up_to_date', {
      current: event.lastModified
    });
    if (!$notice[0]) {
      $('#datasetName').after($('<span>').addClass('outOfDate').text(message));
      $notice = $('#datasetName + .outOfDate');
    }
    // Update datasetName to reflect out-of-date status
    if (blist.dataset._dataOutOfDate === 'true') {
      message = $.t('screens.ds.bar.out_of_date', {
        age: event.age
      });
    }
    $notice.text(message);
  });

  // Data calls
  _.defer(function() {
    // register opening
    blist.dataset.registerOpening(document.referrer);

    // avoid showing "Based on" for default views
    if (!_.include(['blist', 'blob', 'href', 'metadata_table'], blist.dataset.type) &&
      !blist.dataset.isGeoDataset()) {
      blist.dataset.getParentView(function(parDS) {
        if (!$.isBlank(parDS)) {
          $('.basedOnParent').
          addClass('hasParent').
          find('.parentName').
          attr('href', parDS.url).
          text(parDS.name);
        } else {
          $('.basedOnParent').
          addClass('hasParent').
          find('.parentName').
          attr('href', null).
          text($.t('screens.ds.bar.based_on_private_view'));
        }
      });
    }

    // report to events analytics for easier aggregation
    $.analytics && $.analytics.trackEvent('dataset page (v4-chrome)', 'page loaded', blist.dataset.id);

    // disable "save as" button if the user isn't logged in
    if (!blist.currentUserId) {
      var $saveAs = $('.unsavedLine a.saveAs');
      $saveAs.addClass('disabled');
      $saveAs.off('click');
      $saveAs.socrataTip($.t('screens.ds.bar.save_as_button_disabled_tooltip'));
    }
  });
});
