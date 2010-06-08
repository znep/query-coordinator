var columnFormatNS = blist.namespace.fetch('blist.columns.properties.format');

columnFormatNS.renderPrecision = function(value)
{
    return '<tr><td class="labelColumn">' +
        '<label for="columnProperties_precisionEnabled">Fixed Precision:</label>' +
        '</td><td><input type="checkbox" id="columnProperties_precisionEnabled" ' +
        (value !== undefined ? 'checked="checked"' : '') + ' /></td></tr>' +
        '<tr><td class="labelColumn"><label for="columnProperties_precision">' +
        'Number of Decimal Places:</label></td><td>' +
        '<input class="incrementer" type="text" id="columnProperties_precision" ' +
        'value="' + value + '" /></td></tr>';
};

columnFormatNS.activatePrecision = function()
{
    $("#columnProperties_precision").spinner({min: 0});
    var precisionEnabledClick = function()
    {
        if ($('#columnProperties_precisionEnabled:checked').length > 0)
        { $('#columnProperties_precision').spinner('enable'); }
        else
        { $('#columnProperties_precision').spinner('disable'); }
    };
    $('#columnProperties_precisionEnabled').click(precisionEnabledClick);
    precisionEnabledClick();
};

columnFormatNS.renderers = {};

columnFormatNS.renderers['number'] =
function(column, $container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="number displayOptions"><table colspacing="0"><tbody>' +
        columnFormatNS.renderPrecision(column.decimalPlaces) +

        '<tr><td class="labelColumn">' +
        '<label for="columnProperties_precisionStyle">Number Style:</label>' +
        '</td><td>' +
        '<div class="blist-combo-wrapper precisionStyle lr_justified">' +
        '<div id="columnProperties_precisionStyle"></div></div>' +
        '</td></tr>' +

        '</tbody></table></div>';


    $container.append(render);
    columnFormatNS.activatePrecision();

    var precisionStyleValues = [
        { id: "standard", label: "1,020.4", info: "(Standard)" },
        { id: "scientific", label: "1.0204e+3", info: "(Scientific)" }
    ];

    $("#columnProperties_precisionStyle").combo({
        ddClass: 'lr_justified',
        name: "precisionStyle",
        values: precisionStyleValues,
        value: column.precisionStyle || 'standard',
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

columnFormatNS.renderers['money'] =
function(column, $container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="money displayOptions"><table colspacing="0"><tbody>' +

        '<tr><td class="labelColumn"><label for="columnProperties_precision">' +
        'Number of Decimal Places:</label></td><td>' +
        '<input class="incrementer" type="text" id="columnProperties_precision" ' +
        'value="' + column.decimalPlaces + '" /></td></tr>' +

        '<tr><td class="labelColumn">' +
        '<label for="columnProperties_currency">Currency:</label>' +
        '</td><td>' +
        '<div class="blist-combo-wrapper currency lr_justified">' +
        '<div id="columnProperties_currency"></div></div>' +
        '</td></tr>' +

        '<tr><td class="labelColumn"><label for="columnProperties_humane">' +
        'Human Readable:</label></td><td>' +
        '<input type="checkbox" id="columnProperties_humane" ' +
        (column.humane === 'true' ? 'checked="checked"' : '') +
        ' /></td></tr>' +

        '</tbody></table></div>';

    var curSymbols = blist.data.types.money.currencies;
    var currencyValues = [
        {id: 'dollar', label: curSymbols['dollar'], info: "US Dollar"},
        {id: 'pound', label: curSymbols['pound'], info: "Pound"},
        {id: 'euro', label: curSymbols['euro'], info: "Euro"},
        {id: 'yen', label: curSymbols['yen'], info: "Yen/Yuan"},
        {id: 'forint', label: curSymbols['forint'], info: "Forint"},
        {id: 'hk_dollar', label: curSymbols['hk_dollar'], info: "Hong Kong Dollar"},
        {id: 'kuna', label: curSymbols['kuna'], info: "Kuna"},
        {id: 'koruna', label: curSymbols['koruna'], info: "Koruna"},
        {id: 'lats', label: curSymbols['lats'], info: "Lats"},
        {id: 'litas', label: curSymbols['litas'], info: "Litas"},
        {id: 'nt_dollar', label: curSymbols['nt_dollar'],
            info: "New Taiwan Dollar"},
        {id: 'peso', label: curSymbols['peso'], info: "Peso"},
        {id: 'real', label: curSymbols['real'], info: "Real"},
        {id: 'rupiah', label: curSymbols['rupiah'], info: "Rupiah"},
        {id: 'rupee', label: curSymbols['rupee'], info: "Rupee"},
        {id: 'koruna', label: curSymbols['koruna'], info: "Koruna"},
        {id: 'lira', label: curSymbols['lira'], info: "Lira"},
        {id: 'new_lira', label: curSymbols['new_lira'], info: "New Lira"},
        {id: 'krone', label: curSymbols['krone'], info: "Krone"},
        {id: 'lei_noi', label: curSymbols['lei_noi'], info: "Lei Noi"},
        {id: 'zloty', label: curSymbols['zloty'], info: "Zloty"},
        {id: 'baht', label: curSymbols['baht'], info: "Baht"},
        {id: 'dong', label: curSymbols['dong'], info: "Dong"},
        {id: 'won', label: curSymbols['won'], info: "Won"},
        {id: 'ruble', label: curSymbols['ruble'], info: "Ruble"},
        {id: 'lev', label: curSymbols['lev'], info: "Lev"},
        {id: 'dinar', label: curSymbols['dinar'], info: "Dinar"},
        {id: 'hryvnia', label: curSymbols['hryvnia'], info: "Hryvnia"}
    ];

    $container.append(render);

    $("#columnProperties_precision").spinner({min: 0, max: 2});
    $("#columnProperties_currency").combo({
        ddClass: 'lr_justified',
        name: "currency",
        values: currencyValues,
        value: column.currency || 'dollar',
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

columnFormatNS.renderers['percent'] =
function(column, $container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="percent displayOptions"><table colspacing="0"><tbody>' +
        columnFormatNS.renderPrecision(column.decimalPlaces) +
        '<tr><td class="labelColumn"><label for="columnProperties_displayView">' +
        'Percent View Style:</label></td><td>' +
        '<div class="blist-combo-wrapper lr_justified format_percent_view">' +
        '<div id="columnProperties_displayView"></div></div>' +
        '</td></tr></tbody></table></div>';

    $container.append(render);
    columnFormatNS.activatePrecision();

    var percentFormatValues = [
        { id: "percent_bar_and_text", label: "90%", info: "Bar &amp; Text" },
        { id: "percent_bar", label: "&nbsp;", info: "Bar Only" },
        { id: "percent_text", label: "90%", info: "Text Only" }
    ];

    $("#columnProperties_displayView").combo({
        ddClass: 'lr_justified format_percent_view',
        name: "percent-view",
        values: percentFormatValues,
        value: column.format || 'percent_bar_and_text',
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

columnFormatNS.renderers['calendar_date'] =
columnFormatNS.renderers['date'] =
function(column, $container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="date displayOptions"><table colspacing="0"><tbody>' +
        '<tr><td class="labelColumn"><label for="columnProperties_displayView">' +
        'Date View Style:</label></td><td>' +
        '<div class="blist-combo-wrapper lr_justified format_date_view">' +
        '<div id="columnProperties_displayView"></div></div>' +
        '</td></tr>' +
        '</tbody></table></div>';
    $container.append(render);

    var today = new Date();
    var dateViews = [
        {id: 'date', info: '(Date [month/day/year])'},
        {id: 'date_time', info: '(Date &amp; Time [month/day/year])'},
        {id: 'date_dmy', info: '(Date [day/month/year])'},
        {id: 'date_dmy_time', info: '(Date &amp; Time [day/month/year])'},
        {id: 'date_ymd', info: '(Date [year/month/day])'},
        {id: 'date_ymd_time', info: '(Date &amp; Time [year/month/day])'},
        {id: 'date_monthdy', info: '(Date [month day, year])'},
        {id: 'date_dmonthy', info: '(Date [day month year])'},
        {id: 'date_ymonthd', info: '(Date [year month day])'}
    ];
    var type = blist.data.types[column.type] || blist.data.types.date;
    var dateFormatValues = $.map(dateViews, function(v)
        { return $.extend(v, {label: today.format(type.formats[v.id])}); });

    $("#columnProperties_displayView").combo({
      ddClass: 'lr_justified format_date_view',
      name: "date-view",
      values: dateFormatValues,
      value: column.format || 'date_time',
      renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

columnFormatNS.renderValueInfoFormatRow = function(value)
{
    var $row = $(this);
    var $span_value = $('<span class="value"></span>').html(value.label);
    var $span_info = $('<span class="value_info"></span>').html(value.info);
    $row.addClass(value.id).empty().append($span_value).append($span_info);
};

columnFormatNS.updateColumn = function(column)
{
    column.decimalPlaces =
        $("#columnProperties_precisionEnabled:checked").length > 0 ?
        $("#columnProperties_precision").val() : null;

    var $view = $("#columnProperties_displayView");
    column.format = $view.length > 0 ? $view.value() : null;

    var $precisionStyle = $("#columnProperties_precisionStyle");
    column.precisionStyle = $precisionStyle.length > 0 ?
        $precisionStyle.value() : null;

    var $currency = $("#columnProperties_currency");
    column.currency = $currency.length > 0 ? $currency.value() : null;

    column.humane = $("#columnProperties_humane").value();

};

$(function()
{
    $.fn.columnFormatRender = function(column)
    { columnFormatNS.renderers[column.type](column, $(this)); };
});
