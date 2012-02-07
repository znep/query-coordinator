;(function($)
{
    $.templates = $.templates || {};

    // TEMPLATE:
    //   Downloads Table; renders a table with downloadable types for a view
    // DEPENDENCIES:
    //   combination-list.js
    $.templates.downloadsTable = {
        downloadTypes: [ 'CSV', 'JSON', 'PDF', 'RDF', 'RSS', 'XLS', 'XLSX', 'XML'  ],
        geoDownloadTypes: [ 'KML', 'KMZ', 'Shapefile', 'Original' ],
        directive: {
            'tbody .item': {
                'downloadType<-downloadTypes': {
                    '.type a': '#{downloadType}',
                    '.type a@href': function(args)
                    {
                        return args.context.view.downloadUrl(args.item);
                    }
                    // TODO: add download count when supported
                }
            }
        },
        postRender: function($elem)
        {
            $elem.find('table.gridList').combinationList({
                headerContainerSelector: $elem.find('.gridListWrapper'),
                initialSort: [[0, 0]],
                scrollableBody: false,
                selectable: false,
                sortGrouping: false,
                sortHeaders: {0: {sorter: 'text'}}
            });
        }
    };

})(jQuery);
