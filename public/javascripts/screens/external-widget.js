$(function ()
{
    var sizeGrid = function ()
    {
        var $grid = $('#data-grid');
        $grid.height($grid.next().offset().top - $grid.offset().top + 1);
    };
    sizeGrid();
    $(window).resize(sizeGrid);
});
