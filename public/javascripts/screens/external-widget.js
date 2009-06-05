var widgetNS = blist.namespace.fetch('blist.widget');

blist.widget.jsGridFilter = function (e)
{
    var $grid = $('#data-grid');
    if ($grid.length > 0)
    {
        setTimeout(function ()
        {
            var searchText = $(e.currentTarget).val();
            $grid.blistModel().filter(searchText, 250);
            if (!searchText || searchText == '')
            {
                $('#header form .clearSearch').hide();
            }
            else
            {
                $('#header form .clearSearch').show();
            }
        }, 10);
    }
};

blist.widget.jsGridClearFilter = function(e)
{
    e.preventDefault();
    $('#header form :text').val('').blur();
    $('#data-grid').blistModel().filter('');
    $(e.currentTarget).hide();
};

$(function ()
{
    var sizeGrid = function ()
    {
        var $grid = $('#data-grid');
        $grid.height($grid.next().offset().top - $grid.offset().top + 1);
    };
    sizeGrid();
    $(window).resize(sizeGrid);

    $('#header form :text').keydown(widgetNS.jsGridFilter);
    $('#header form .clearSearch').click(widgetNS.jsGridClearFilter).hide();

    $('#data-grid')
        .blistTable({showName: false, showRowNumbers: false,
            showGhostColumn: true, showTitle: false, generateHeights: false})
        .blistModel()
        .options({filterMinChars: 0})
        .ajax({ url: '/views/' + widgetNS.viewId + '/rows.json',
            dataType: 'jsonp', jsonp: 'jsonp', data: {accessType: 'WIDGET'}});
    $.ajax({url: '/views/' + widgetNS.viewId + '.json', data: {method: 'opening',
            accessType: 'WIDGET'}});
});
