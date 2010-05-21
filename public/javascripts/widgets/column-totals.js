var columnTotalsNS = blist.namespace.fetch('blist.columns.properties.totals');

columnTotalsNS.totals = {
    count: '<div><input type="radio" name="aggregate" value="count" id="count" />' +
        '<label for="count">The total number of cells with data ' +
        '(<strong>Count</strong>)</label></div>',
    sum: '<div><input type="radio" name="aggregate" value="sum" id="sum" />' +
        '<label for="sum">The sum of all cells with data ' +
        '(<strong>Sum</strong>)</label></div>',
    avg: '<div><input type="radio" name="aggregate" value="average" ' +
        'id="average" /><label for="average">The average of all cells with data ' +
        '(<strong>Average</strong>)</label></div>',
    max: '<div><input type="radio" name="aggregate" value="maximum" ' +
        'id="maximum" /><label for="maximum">The greatest value of any cell ' +
        '(<strong>Maximum</strong>)</label></div>',
    min: '<div><input type="radio" name="aggregate" value="minimum" ' +
        'id="minimum" /><label for="minimum">The least value of any cell ' +
        '(<strong>Minimum</strong>)</label></div>',
    none: '<div><input type="radio" name="aggregate" value="" id="none" />' +
        '<label for="none">None</label></div>'
};

columnTotalsNS.populate = function(column, $container)
{
    if (column.aggregate)
    {
        $container.find("#" + column.aggregate.type).each(function()
                { this.checked = true; });
    }
    else
    {
        $container.find("#none").each(function() { this.checked = true; });
    }
};

columnTotalsNS.fetchValue = function($parent)
{
    var $total = $parent.find("#columnTotals :radio:checked");
    return $total.length > 0 && $total.val() !== '' ? {type: $total.val()} : null;
};

columnTotalsNS.renderers = {};

columnTotalsNS.renderers['stars'] =
function(column, $container)
{
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count;
    render += columnTotalsNS.totals.avg;
    render += columnTotalsNS.totals.max;
    render += columnTotalsNS.totals.min;
    render += columnTotalsNS.totals.none;
    render += '</div>';
    $container.append(render);
    $container.find("input:checkbox").click(function() {
            $container.find("input:checkbox").each(function() {
                this.checked = false;
                });
            this.checked = true;
            });
    columnTotalsNS.populate(column, $container);
};

columnTotalsNS.renderers['number'] =
columnTotalsNS.renderers['money'] =
columnTotalsNS.renderers['percent'] =
function(column, $container)
{
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count;
    render += columnTotalsNS.totals.sum;
    render += columnTotalsNS.totals.avg;
    render += columnTotalsNS.totals.max;
    render += columnTotalsNS.totals.min;
    render += columnTotalsNS.totals.none;
    render += '</div>';
    $container.append(render);
    columnTotalsNS.populate(column, $container);
};


columnTotalsNS.renderers['phone'] =
columnTotalsNS.renderers['email'] =
columnTotalsNS.renderers['url'] =
columnTotalsNS.renderers['document'] =
columnTotalsNS.renderers['document_obsolete'] =
columnTotalsNS.renderers['photo'] =
columnTotalsNS.renderers['photo_obsolete'] =
columnTotalsNS.renderers['flag'] =
columnTotalsNS.renderers['text'] =
columnTotalsNS.renderers['html'] =
columnTotalsNS.renderers['checkbox'] =
columnTotalsNS.renderers['date'] =
columnTotalsNS.renderers['location'] =
columnTotalsNS.renderers['tag'] =
columnTotalsNS.renderers['picklist'] =
columnTotalsNS.renderers['drop_down_list'] =
function(column, $container)
{
    var render = '<div id="columnTotals" class="displayOptions">';
    render += '<p>Display the following:</p>';
    render += columnTotalsNS.totals.count;
    render += columnTotalsNS.totals.none;
    render += '</div>';
    $container.append(render);
    columnTotalsNS.populate(column, $container);
};

$(function()
{
    $.fn.columnTotalsRender = function(column)
    { return columnTotalsNS.renderers[column.type](column, $(this)); };

    $.fn.columnTotalsValue = function()
    { return columnTotalsNS.fetchValue($(this)); }
});
