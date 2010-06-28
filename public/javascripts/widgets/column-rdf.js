var columnRdfNS = blist.namespace.fetch('blist.columns.properties.rdf');

columnRdfNS.renderer =
function(column, $container)
{
    var render = ////'<h3 class="separator">Display Options</h3>' +
        '<div class="xxxnumber xxxdisplayOptions"><table colspacing="0"><tbody>' +

        '<tr><td class="labelColumn">' +
        '<label for="columnProperties_rdf">Predicate:</label>' +
        '</td><td>' +
        '<div class="blist-combo-wrapper xxxprecisionStyle lr_justified" style="width:20em">' +
        '<div id="columnProperties_rdf"></div></div>' +
        '</td></tr>' +

        '</tbody></table></div>';

        $container.append(render);

    var rdfValues = [
        { id: "_", label: "Unspecified", info: "Column Title" },
        { id: "foaf_1", label: "foaf:one", info: "foaf:one more info)" },
        { id: "foaf_2", label: "foaf:two", info: "foaf:two more info)" },
        { id: "foaf_3", label: "foaf:three", info: "foaf:three more info)" }
    ];

    $("#columnProperties_rdf").combo({
        ddClass: 'lr_justified',
        name: 'rdf',
        values: rdfValues,
        value: column.rdf || "_",
        renderFn: columnFormatNS.renderValueInfoFormatRow
    });
};

$(function()
{
    $.fn.columnRdfRender = function(column)
    {
        columnRdfNS.renderer(column, $(this));
    };
});
