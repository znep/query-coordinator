;(function($)
{
    // Hide/show nav links for wide pages
    var $navBox     = $('.adminNavBox'),
        $hideArea   = $navBox.find('.hideButtonBox'),
        $contentBox = $('.contentBox.withLeftNavigation'),
        navMargin   = $contentBox.css('margin-left');

    var $hideNavLink = $hideArea.find('.hideButton').click(function(event)
    {
        event.preventDefault();

        var finished = function() {
            $hideNavLink.toggleClass('rightArrow close');
            $(window).trigger('resize');
        };

        if ($hideNavLink.hasClass('close'))
        {
            $navBox.toggleClass('collapsed');
            $contentBox.animate({
                'margin-left': '4.5em',
            }, 300, finished);
        }
        else
        {
            $contentBox.animate({
                'margin-left': navMargin
            }, 300, function() {
                finished();
                $navBox.toggleClass('collapsed');
            });
        }
    });
    $hideArea.show();
})(jQuery);
