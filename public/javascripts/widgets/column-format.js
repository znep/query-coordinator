var columnsNS = blist.namespace.fetch('blist.columns');
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
    $('#columnProperties_precisionEnabled').change(function()
    {
        if ($('#columnProperties_precisionEnabled:checked').length > 0)
        { $('#columnProperties_precision').spinner('enable'); }
        else
        { $('#columnProperties_precision').spinner('disable'); }
    }).change();
};

columnFormatNS.renderers = {};

columnFormatNS.renderers['number'] =
function($container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="number displayOptions"><table colspacing="0"><tbody>' +
        columnFormatNS.renderPrecision(columnsNS.column.decimalPlaces) +

        '<tr><td class="labelColumn">' +
        '<label for="columnProperties_precisionStyle">Number Style:</label>' +
        '</td><td><select id="columnProperties_precisionStyle">' +
        '<option value="standard" ' +
            (columnsNS.column.precisionStyle == 'standard' ?
                'selected="selected"' : '') + '>1,020.4 (Standard)</option>' +
        '<option value="scientific" ' +
            (columnsNS.column.precisionStyle == 'scientific' ?
                'selected="selected"' : '') + '>1.0204E+03 (Scientific)</option>' +
        '</select></td></tr>' +

        '</tbody></table></div>';


    $container.append(render);
    columnFormatNS.activatePrecision();
};

columnFormatNS.renderers['money'] =
function($container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="money displayOptions"><table colspacing="0"><tbody>' +
        columnFormatNS.renderPrecision(columnsNS.column.decimalPlaces) +
        '</tbody></table></div>';

    /* TODO: Add me back in when we get rid of flash (god let that be soon...)
    var currencies = [
        ["$", "dollar"],
        ["£", "pound"],
        ["€", "euro"],
        ["¥", "yen, yuan"],
        ["Ft", "forint"],
        ["HK$", "Hong Kong dollar"],
        ["Kn", "kuna"],
        ["Kč", "koruna"],
        ["Ls", "lats"],
        ["Lt", "litas"],
        ["NT$", "new Taiwan dollar"],
        ["PhP", "peso"],
        ["R$", "real"],
        ["Rp", "rupiah"],
        ["Rs.", "rupee"],
        ["Sk", "koruna"],
        ["TL", "lira"],
        ["YTL", "new lira"],
        ["kr", "krone"],
        ["lei", "lei noi"],
        ["zł", "zloty"],
        ["฿", "baht"],
        ["₫", "dong"],
        ["₩", "won"],
        ["р.", "ruble"],
        ["лв.", "lev"],
        ["Дин.", "dinar"],
        ["грн.", "hryvnia"]
    ];

       render += '<h3 class="separator">Currencies</h3>';
       render += '<div class="currencies">';
       render += '<label for="currency">Currency:</label>';
       render += '<select id="currency">';
       $.each(currencies, function()
       {
       render += '<option value="' + this[0] + '">' + this[0] + ", " +
       this[1] + '</option>';
       });
       render += '</select>';

       render += '</div>';*/

    $container.append(render);
    columnFormatNS.activatePrecision();
};

columnFormatNS.renderers['percent'] =
function($container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="percent displayOptions"><table colspacing="0"><tbody>' +
        columnFormatNS.renderPrecision(columnsNS.column.decimalPlaces) +
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
        value: columnsNS.column.format || 'percent_bar',
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

columnFormatNS.renderers['date'] =
function($container)
{
    var render = '<h3 class="separator">Display Options</h3>' +
        '<div class="percent displayOptions"><table colspacing="0"><tbody>' +
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
    var dateFormatValues = $.map(dateViews, function(v)
        { return $.extend(v,
            {label: today.format(blist.data.types.date.formats[v.id])}); });

    $("#columnProperties_displayView").combo({
      ddClass: 'lr_justified format_date_view',
      name: "date-view",
      values: dateFormatValues,
      value: columnsNS.column.format || 'date_time',
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

    var $view = $("#columnPropertiesDialog #columnProperties_displayView");
    column.format = $view.length > 0 ? $view.value() : null;

    column.precisionStyle =
        $('#columnProperties #columnProperties_precisionStyle').val();
};

$(function()
{
    $.fn.columnFormatRender = function(column)
    { columnFormatNS.renderers[column.type]($(this)); };
});
