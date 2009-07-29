var columnTotalsNS = blist.namespace.fetch('blist.columns.properties.totals');

columnTotalsNS.totals = {
    count:'<div><input type="radio" name="aggregate" value="count" id="count" /><label for="count">The total number of cells with data (<strong>Count</strong>)</label></div>',
    sum:  '<div><input type="radio" name="aggregate" value="sum" id="sum" /><label for="sum">The sum of all cells with data (<strong>Sum</strong>)</label></div>',
    avg:  '<div><input type="radio" name="aggregate" value="average" id="average" /><label for="average">The average of all cells with data (<strong>Average</strong>)</label></div>',
    max:  '<div><input type="radio" name="aggregate" value="maximum" id="max" /><label for="max">The greatest value of any cell (<strong>Maximum</strong>)</label></div>',
    min:  '<div><input type="radio" name="aggregate" value="minimum" id="min" /><label for="min">The least value of any cell (<strong>Minimum</strong>)</label></div>'
};

columnTotalsNS.populate = function($container)
{
    if (column.aggregate)
    {
      $container.find("#" + column.aggregate.type).each(function() {
          this.checked = true;
      });
    }

    $("#columnTotals :input[type=radio]").change(function() { 
        column.aggregate = {type: $(this).val()} 
    });
}

columnTotalsNS.render_stars =
function($container) {
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count; 
    render += columnTotalsNS.totals.avg; 
    render += columnTotalsNS.totals.max; 
    render += columnTotalsNS.totals.min; 
    render += '</div>';
    $container.append(render);
    $container.find("input:checkbox").click(function() {
        $container.find("input:checkbox").each(function() {
            this.checked = false;
        });
        this.checked = true;
    });
    columnTotalsNS.populate($container);
}

columnTotalsNS.render_number =
columnTotalsNS.render_money =
columnTotalsNS.render_percent =
function($container) {
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count; 
    render += columnTotalsNS.totals.sum; 
    render += columnTotalsNS.totals.avg; 
    render += columnTotalsNS.totals.max; 
    render += columnTotalsNS.totals.min; 
    render += '</div>';
    $container.append(render);
    columnTotalsNS.populate($container);
}


columnTotalsNS.render_phone = 
columnTotalsNS.render_email = 
columnTotalsNS.render_url =
columnTotalsNS.render_document =
columnTotalsNS.render_photo = 
columnTotalsNS.render_flag =
columnTotalsNS.render_text = 
columnTotalsNS.render_richtext =
columnTotalsNS.render_checkbox = 
columnTotalsNS.render_picklist =
function($container) {
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count; 
    render += '</div>';
    $container.append(render);
    columnTotalsNS.populate($container);
};

$(function() {
    $.fn.columnTotals = function(column)
    {
        eval("columnTotalsNS.render_" + column.type + "($(this));");
    }
});
