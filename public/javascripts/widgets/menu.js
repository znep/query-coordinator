;(function($)
{
    $.fn.menu = function(options)
    {
        var opts = $.extend({}, $.fn.menu.defaults, options);

        // Wrap in an extra array if necessary (one column)
        if (!_.isArray(opts.contents[0]))
        { opts.contents = [opts.contents]; }

        return this.each(function()
        {
            var $menuContainer = $(this);
            $menuContainer
                .empty()
                .append(
                    $.renderTemplate(
                        'menu',
                        { menuButtonClass: opts.menuButtonClass,
                          menuButtonContents: opts.menuButtonContents,
                          columns: opts.contents },
                        opts.renderDirective));

            var $menuButton = $menuContainer.children('a');
            var $menuDropdown = $menuContainer.children('div');

            $menuButton.bind('click', function(event)
            {
                event.preventDefault();

                openMenu($menuContainer, $menuButton, $menuDropdown);
            });
        });
    };

    var openMenu = function($menuContainer, $menuButton, $menuDropdown)
    {
        // reset then realign the menu if necessary; set styles as appropriate
        $menuDropdown.removeClass('menuPosition-bottom menuPosition-right');
        $menuDropdown.addClass('menuPosition-top menuPosition-left');
        $menuDropdown
            .css('right', null)
            .css('bottom', null)
            .show();

        if ($menuDropdown.offset().left + $menuDropdown.outerWidth(true) > $(window).width())
        {
            // if the menu can be flipped left, do so; otherwise, crop it
            if ($menuContainer.offset().left + $menuContainer.outerWidth(true) -
                    $menuDropdown.outerWidth(true) < 0)
            {
                $menuDropdown.css('width', $(window).width() - $menuDropdown.offset().left - 10);
            }
            else
            {
                $menuDropdown.removeClass('menuPosition-left');
                $menuDropdown.addClass('menuPosition-right');
                $menuDropdown.css('right', 10);
            }
        }

        if ($menuDropdown.offset().top + $menuDropdown.outerHeight(true) > $(document).height())
        {
            // if the menu can be flipped up, do so; otherwise, leave it alone
            if ($menuContainer.offset().top - $menuDropdown.outerHeight(true) > 0)
            {
                $menuDropdown.removeClass('menuPosition-top');
                $menuDropdown.addClass('menuPosition-bottom');
                $menuDropdown.css('bottom', $menuContainer.innerHeight() * -1);
            }
        }
        $menuDropdown.hide();

        $menuDropdown.slideDown('fast');
    };

    $.fn.menu.defaults = {
        attached: true,
        contents: [],
        menuButtonContents: 'Menu',
        renderDirective: {
            '+a.menuButton': 'menuButtonContents',
            '.menuDropdown>ul>li': {
                'column<-columns': { // outer array for columns
                    'ul>li': {
                        'row<-column': {  // inner array for rows
                            '.@class+': 'row.class',
                            '+a': 'row.text',
                            'a@href': 'row.href',
                            'a@rel': 'row.rel',
                            'a@title': 'row.title',
                            'a .subtext': 'row.subtext'
                        }
                    }
                }
            }
        }
    };
})(jQuery);