;$(function()
{
    var resizeFeaturedViews = function()
    {
        var $boxes = $('.featuredViews .featuredView');
        $boxes
            .css('height', 'auto')
            .height(_.max($boxes.map(function() { return $(this).height(); })));
    };
    resizeFeaturedViews();
    $(window).resize(resizeFeaturedViews); 
});
