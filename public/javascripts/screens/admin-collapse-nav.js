(function($)
{
    // Hide/show nav links for wide pages
    var $navBox     = $('.adminNavBox'),
        $hideArea   = $navBox.find('.hideButtonBox'),
        $contentBox = $('.contentBox.withLeftNavigation'),
        navMargin   = $contentBox.css('margin-left');

    var $hideNavLink = $hideArea.find('.hideButton').click(function(event)
    {
        event.preventDefault();

        var numBoxes = $contentBox.length;
        var finished = function() {
            if (--numBoxes > 0) { return false; }
            $hideNavLink.toggleClass('rightArrow close');
            $(window).trigger('resize');
            return true;
        };

        if ($hideNavLink.hasClass('close'))
        {
            $navBox.toggleClass('collapsed');
            $contentBox.animate({
                'margin-left': '4.5em'
            }, 300, finished);
        }
        else
        {
            $contentBox.animate({
                'margin-left': navMargin
            }, 300, function() {
                if (finished())
                {
                    $navBox.toggleClass('collapsed');
                }
            });
        }
    });
    $hideArea.show();
})(jQuery);
