(function($)
{
    var $container = $('.goalDescription');
    if ($container.height() > 600)
    { $container.columnize({ width: 400, lastNeverTallest: true }); }
})(jQuery);
