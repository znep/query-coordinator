var columnsNS = blist.namespace.fetch('blist.columns');
var columnFormatNS = blist.namespace.fetch('blist.columns.properties.format');

columnFormatNS.precision = function(value)
{
  return '<tr><td class="labelColumn"><label for="precision">Number of Decimal Places:</label></td><td><input class="incrementer" type="text" id="precision" value="' + value + '" /></td></tr>';
};

columnFormatNS.currencies = [
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

columnFormatNS.currencySelect = '<select id="currency">';
$.each(columnFormatNS.currencies, function() { columnFormatNS.currencySelect += '<option value="' + this[0] + '">' + this[0] + ", " + this[1] + '</option>'; });
columnFormatNS.currencySelect += '</select>';

columnFormatNS.percentFormatValues = [
    { id: "percent_bar_and_text", label: "90%", info: "Bar &amp; Text" },
    { id: "percent_bar", label: "&nbsp;", info: "Bar Only" },
    { id: "percent_text", label: "90%", info: "Text Only" }
];

columnFormatNS.checkFormats = [
    ["boolean_checkbox", "Checkbox"],
    ["boolean_icon_text", "Icon &amp; Text"],
    ["boolean_icon", "Icon only"],
    ["boolean_text", "Text only"]
];

columnFormatNS.checkView = '<select id="check-view">';
$.each(columnFormatNS.checkFormats, function() { columnFormatNS.checkView += '<option value="' + this[0] + '">' + this[1] + '</option>'; });
columnFormatNS.checkView += '</select>';

columnFormatNS.picklistFormats = [
    ["icon_text", "Icon &amp; Text"],
    ["icon", "Icon only"],
    ["text", "Text only"]
];

columnFormatNS.picklistView = '<select id="picklist-view">';
$.each(columnFormatNS.picklistFormats, function() { columnFormatNS.picklistView += '<option value="' + this[0] + '">' + this[1] + '</option>'; });
columnFormatNS.picklistView += '</select>';

columnFormatNS.render_number = function($container)
{
  var render = '<h3 class="separator">Display Options</h3>';
  render += '<div class="number displayOptions"><table colspacing="0"><tbody>';
  render += columnFormatNS.precision(columnsNS.column.decimalPlaces);
  render += '</tbody></table></div>';
  $container.append(render);
  $("#precision").spinner({min: 0});
};

columnFormatNS.render_money = function($container)
{
  var render = '<h3 class="separator">Display Options</h3>';
  render += '<div class="money displayOptions"><table colspacing="0"><tbody>';
  render += columnFormatNS.precision(columnsNS.column.decimalPlaces);
  //render += '<tr><td class="labelColumn"><label for="precision">Number Style:</label></td><td><select id="number-style"><option value="standard">1,000.12 (Standard)</option><option value="scientific">1.01E+03 (Scientific)</option></select></td></tr>';
  render += '</tbody></table></div>';
  /* TODO: Add me back in when we get rid of flash (god let that be soon...)
  render += '<h3 class="separator">Currencies</h3>';
  render += '<div class="currencies">';
  render += '<label for="currency">Currency:</label>';
  render += columnFormatNS.currencySelect; 
  render += '</div>';*/
  $container.append(render);
  $("#precision").spinner({min: 0});
};

columnFormatNS.render_percent = function($container)
{
    var render = '<h3 class="separator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += columnFormatNS.precision(columnsNS.column.decimalPlaces);
    render += '<tr><td class="labelColumn"><label for="view">Percent View Style:</label></td><td>';
    render += '<div class="blist-combo-wrapper lr_justified format_percent_view">';
    render += '<div id="percent-view"></div></div>';
    render += '</td></tr></tbody></table></div>';

    $container.append(render);
    $("#precision").spinner({min: 0});

    $("#percent-view").combo({
        ddClass: 'lr_justified format_percent_view',
        name: "percent-view",
        values: columnFormatNS.percentFormatValues,
        value: columnsNS.column.format || 'percent_bar',
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });

    $("#percent-view").change(function() { columnsNS.column.format = $("#percent-view").value(); });
};

columnFormatNS.render_date = function($container)
{
    var render = '<h3 class="separator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Date View Style:</label></td><td>';
    render += '<div class="blist-combo-wrapper lr_justified format_date_view">';
    render += '<div id="date-view"></div></div>';
    render += '</td></tr>';
    render += '</tbody></table></div>';
    $container.append(render);

    $("#date-view").combo({
      ddClass: 'lr_justified format_date_view',
      name: "date-view",
      values: columnFormatNS.dateFormatValues,
      value: columnsNS.column.format || 'date_time',
      renderFn: columnFormatNS.renderValueInfoFormatRow
    });

    $("#date-view").change(function() { columnsNS.column.format = $("#date-view").value(); });
};

columnFormatNS.renderValueInfoFormatRow = function(value)
{
    var $row = $(this);
    var $span_value = $('<span class="value"></span>').html(value.label);
    var $span_info = $('<span class="value_info"></span>').html(value.info);
    $row.addClass(value.id).empty().append($span_value).append($span_info);
};

columnFormatNS.render_checkbox = function($container)
{
    var render = '<h3 class="separator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Check Style:</label></td><td>' + columnFormatNS.checkView + '</td></tr>';
    render += '</tbody></table></div>';
    $container.append(render);
    columnFormatNS.updateView($container, "#check-view");
};

columnFormatNS.render_picklist = function($container)
{
    var render = '<h3 class="separator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Menu Style:</label></td><td>' + columnFormatNS.picklistView + '</td></tr>';
    render += '</tbody></table></div>';
    $container.append(render);
    columnFormatNS.updateView($container, "#picklist-view");
};

columnFormatNS.updateView = function(container, id)
{
    container.find(id).val(columnsNS.column.format);
    container.find(id).change(function (event) {
        columnsNS.column.format = $(this).val();
    });
};

columnFormatNS.render_phone =
columnFormatNS.render_email =
columnFormatNS.render_url =
columnFormatNS.render_document =
columnFormatNS.render_new_document =
columnFormatNS.render_photo =
columnFormatNS.render_new_photo =
columnFormatNS.render_stars =
columnFormatNS.render_flag =
columnFormatNS.render_text =
columnFormatNS.render_richtext =
columnFormatNS.render_bnb = function($container) {};

$(function() {
    $.fn.columnFormat = function(column)
    {
        eval("columnFormatNS.render_" + column.type + "($(this));");
    };

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
    columnFormatNS.dateFormatValues = $.map(dateViews, function(v)
        { return $.extend(v,
            {label: today.format(blist.data.types.date.formats[v.id])}); });

});
