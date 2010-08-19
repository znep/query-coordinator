var columnRdfNS = blist.namespace.fetch('blist.columns.properties.rdf');

columnRdfNS.renderer = function(column, $container)
{
    var render = 
        '<div><table colspacing="0"><tbody>' +

        '<tr><td class="labelColumn">' +
        '<label for="columnProperties_rdf">Property:</label>' +
        '</td><td class="fieldColumn">' +
        '<div class="blist-combo-wrapper rdfTerms">' +
        '<div id="columnProperties_rdf"></div></div>' +
        '</td></tr>' +

        '</tbody></table></div>';

    $container.append(render);

    var rdfValues;
/** examples
    rdfValues = [
        {"flags":[],"name":"Agent","class":true,"namespace":"Friend of a Friend","id":1},
        {"flags":[],"name":"Document","class":true,"namespace":"Friend of a Friend","id":2},
    ];
**/

    rdfValues = column.rdfProperties;
    // handle difference between string and int.  combo is pretty strict in type.
    if (!$.isBlank(column.rdf) && !isNaN(column.rdf))
    {
        column.rdf = parseInt(column.rdf);
    }

    $("#columnProperties_rdf").combo({
        name: 'rdf',
        values: rdfValues,
        value: column.rdf || '',
        keyName: 'CName',
        renderFn: columnRdfNS.renderComboRow,
        keyAccProp: 'namespace',
        allowFreeEdit: true,
        freeEditButton: true
    });
};

columnRdfNS.renderComboRow = function(value)
{
    if (typeof value == "string")
    {
        // value not in the combo list, just show raw value.
        this.html(value);
    }
    else
    {
        this.html(value.namespace + ': ' + value.displayName || value.name);
    }
};


$(function()
{
    $.fn.columnRdfRender = function(column)
    {
        columnRdfNS.renderer(column, $(this));
    };
});
