var columnFormatNS = blist.namespace.fetch('blist.columns.properties.format');

columnFormatNS.precision = function(value)
{
  return '<tr><td class="labelColumn"><label for="precision">Number of Decimal Places:</label></td><td><input class="incrementer" type="text" id="precision" value="' + value + '" /></td></tr>';
}

columnFormatNS.listStyleType = 
  '<tr><td class="labelColumn"><label for="list">List Style:</label></td><td>' +
      '<select id="list-style">' + 
      '<option value="none">No list</option>' +
      '<option value="undecorated">Undecorated list in each cell</option>' +
      '<option value="bulleted">Bulleted list in each cell</option>' +
  '</select>' +
  '<span class="helpie" title="If you want more than one line per cell you may create a list"></span></td></tr>';

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

/* TODO: Uncomment when we move out of flex completely.
 *
columnFormatNS.dateFormats = [
    ["MM/dd/yyyy hh:mm a", "11/22/2009 5:45 pm (Date &amp; Time)"],
    ["MM/dd/yyyy HH:mm:ss", "11/22/2009 17:45:01 (Date &amp; Time)"],
    ["dd/MM/yyyy hh:mm a", "11/22/2009 5:45 pm (Date &amp; Time)"],
    ["dd/MM/yyyy HH:mm:ss", "11/22/2009 17:45:01 (Date &amp; Time)"],
    ["MM/dd/yyyy", "11/22/2009 (Date)"],
    ["dd/MM/yyyy", "22/11/2009 (Date)"],
    ["yyyy-MM-dd", "2009-11-22 (Date)"],
    ["MM/dd", "11/22 (Date)"],
    ["MMMM d, yyyy", "November 22, 2009 (Date)"],
    ["MMMM d", "November 22 (Date)"],
    ["dd-MMM-yyyy", "22-Nov-2009 (Date)"],
    ["dd-MMM", "22-Nov (Date)"],
    ["HH:mm:ss", "17:45:01 (Time)"],
    ["HH:mm", "17:45 (Time)"],
    ["hh:mm a", "5:45 pm (Time)"],
];*/

// XXX: Remove me after getting rid of flex.
columnFormatNS.dateFormats = [
    ["date", "11/22/2009 (Date)"],
    ["date_dmy", "22/11/2009 (Date)"],
    ["date_ymd", "2009/11/22 (Date)"],
    ["date_monthdy", "November 22, 2009 (Date)"],
    ["date_dmonthy", "22 November 2009 (Date)"],
    ["date_ymonthd", "2009 November 22 (Date)"],
    ["date_time", "11/22/2009 5:45 PM GMT+0100 (Date &amp; Time)"],
    ["date_dmy_time", "22/11/2009 5:45 PM GMT+0100 (Date &amp; Time)"],
    ["date_ymd_time", "2009/11/22 5:45 PM GMT+0100 (Date &amp; Time)"],
];

columnFormatNS.dateView = '<select id="date-view">';
$.each(columnFormatNS.dateFormats, function() { columnFormatNS.dateView += '<option value="' + this[0] + '">' + this[1] + '</option>'; });
columnFormatNS.dateView += '</select>';

columnFormatNS.checkFormats = [
    ["checkbox", "Checkbox"],
    ["icon_text", "Icon &amp; Text"],
    ["icon", "Icon only"],
    ["text", "Text only"],
];

columnFormatNS.checkView = '<select id="check-view">';
$.each(columnFormatNS.checkFormats, function() { columnFormatNS.checkView += '<option value="' + this[0] + '">' + this[1] + '</option>'; });
columnFormatNS.checkView += '</select>';

columnFormatNS.picklistFormats = [
    ["icon_text", "Icon &amp; Text"],
    ["icon", "Icon only"],
    ["text", "Text only"],
];

columnFormatNS.picklistView = '<select id="picklist-view">';
$.each(columnFormatNS.picklistFormats, function() { columnFormatNS.picklistView += '<option value="' + this[0] + '">' + this[1] + '</option>'; });
columnFormatNS.picklistView += '</select>';

columnFormatNS.render_number = function($container)
{
  var render = '<h3 class="seperator">Display Options</h3>';
  render += '<div class="number displayOptions"><table colspacing="0"><tbody>';
  render += columnFormatNS.precision(column.decimalPlaces); 
  //render += columnFormatNS.listStyleType;
  render += '</tbody></table></div>'
  $container.append(render);
  $("#precision").spinner({min: 0});
}

columnFormatNS.render_money = function($container)
{
  var render = '<h3 class="seperator">Display Options</h3>';
  render += '<div class="money displayOptions"><table colspacing="0"><tbody>';
  render += columnFormatNS.precision(column.decimalPlaces); 
  //render += '<tr><td class="labelColumn"><label for="precision">Number Style:</label></td><td><select id="number-style"><option value="standard">1,000.12 (Standard)</option><option value="scientific">1.01E+03 (Scientific)</option></select></td></tr>';
  //render += columnFormatNS.listStyleType;
  render += '</tbody></table></div>';
  /* TODO: Add me back in when we get rid of flash (god let that be soon...)
  render += '<h3 class="seperator">Currencies</h3>';
  render += '<div class="currencies">';
  render += '<label for="currency">Currency:</label>';
  render += columnFormatNS.currencySelect; 
  render += '</div>';*/
  $container.append(render);
  $("#precision").spinner({min: 0});
}

columnFormatNS.render_percent = function($container)
{
    var render = '<h3 class="seperator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += columnFormatNS.precision(column.decimalPlaces); 
    render += '<tr><td class="labelColumn"><label for="view">Percent View Style:</label></td><td><select id="percentView"><option value="bar_text">Bar &amp; Text</option><option value="bar">Bar Only</option><option value="text">Text Only</option></select></td></tr>';
    //render += columnFormatNS.listStyleType;
    render += '</tbody></table></div>'
    $container.append(render);
    $("#precision").spinner({min: 0});
}

columnFormatNS.render_date = function($container)
{
    var render = '<h3 class="seperator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Date View Style:</label></td><td>' + columnFormatNS.dateView + '</td></tr>';
    //render += columnFormatNS.listStyleType;
    render += '</tbody></table></div>'
    $container.append(render);
}

columnFormatNS.render_checkbox = function($container)
{
    var render = '<h3 class="seperator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Check Style:</label></td><td>' + columnFormatNS.checkView + '</td></tr>';
    //render += columnFormatNS.listStyleType;
    render += '</tbody></table></div>'
    $container.append(render);
}

columnFormatNS.render_picklist = function($container)
{
    var render = '<h3 class="seperator">Display Options</h3>';
    render += '<div class="percent displayOptions"><table colspacing="0"><tbody>';
    render += '<tr><td class="labelColumn"><label for="view">Menu Style:</label></td><td>' + columnFormatNS.picklistView + '</td></tr>';
    render += '</tbody></table></div>'
    $container.append(render);
}

columnFormatNS.render_phone = 
columnFormatNS.render_email = 
columnFormatNS.render_url =
columnFormatNS.render_document =
columnFormatNS.render_photo = 
columnFormatNS.render_stars =
columnFormatNS.render_flag =
columnFormatNS.render_text = 
columnFormatNS.render_richtext =
columnFormatNS.render_bnb = function($container) {};

$(function() {
    $.fn.columnFormat = function(column)
    {
        eval("columnFormatNS.render_" + column.type + "($(this));");
    }
});
