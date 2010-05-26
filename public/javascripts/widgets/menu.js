;(function($)
{
    $.fn.menu = function(options)
    {
        var opts = $.extend({}, $.fn.menu.defaults, options);

        // Wrap in an extra array if necessary (one column)
        if (!_.isArray(opts.contents[0]))
        { opts.contents = [opts.contents]; }

        var contents = _.map(opts.contents, function(column)
        {
            return _.reject(column, function(item)
            {
                return item.onlyIf === false;
            });
        });

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
                          menuButtonTitle: opts.menuButtonTitle,
                          columns: contents
                        },
                        opts.renderDirective));

            var $menuButton = $menuContainer.children('a');
            var $menuDropdown = $menuContainer.children('div');

            $menuButton.bind('click', function(event)
            {
                event.preventDefault();

                if ($menuDropdown.is(':visible'))
                {
                    closeMenu(opts, $menuContainer, $menuButton, $menuDropdown);
                }
                else
                {
                    openMenu(opts, $menuContainer, $menuButton, $menuDropdown);
                }
            });
        });
    };

    var openMenu = function(opts, $menuContainer, $menuButton, $menuDropdown)
    {
        // cache the original height before we bump things out to measure
        var origDocumentHeight = $(document).height();

        $menuContainer.addClass('open');

        // reset then realign the menu if necessary; set styles as appropriate
        // show it so we can measure it
        $menuDropdown.removeClass('menuPosition-bottom menuPosition-right');
        if (opts.attached)
        { $menuDropdown.addClass('menuPosition-top menuPosition-left'); }
        $menuDropdown
            .css('width', null)
            .css('right', null)
            .css('bottom', null)
            .css('top', null)
            .show();

        // HACK/TODO: IE7 breaks because it can't see the width of the floated children.
        // So, forcibly set the width manually on the first ul, then the container.
        if (($.browser.msie) && ($.browser.majorVersion < 8))
        {
            var $topLevelList = $menuDropdown.children('ul');
            var topLevelWidth = 0;
            $topLevelList.children().each(function()
            {
                topLevelWidth += $(this).outerWidth(true);
            });
            $topLevelList.width(topLevelWidth);
            $menuDropdown.width($topLevelList.outerWidth(true));
        }

        if ($menuDropdown.offset().left + $menuDropdown.outerWidth(true) > $(window).width())
        {
            // if the menu can be flipped left, do so; otherwise, crop it
            if ($menuContainer.offset().left + $menuButton.outerWidth(true) -
                    $menuDropdown.outerWidth(true) < 0)
            {
                $menuDropdown.css('width', $(window).width() - $menuDropdown.offset().left - 10);
            }
            else
            {
                if (opts.attached)
                {
                    $menuDropdown.removeClass('menuPosition-left');
                    $menuDropdown.addClass('menuPosition-right');
                }
                $menuDropdown.css('right', 0);
            }
        }

        if ($menuDropdown.offset().top + $menuDropdown.outerHeight(true) > origDocumentHeight)
        {
            // if the menu can be flipped up, do so; otherwise, leave it alone
            if ($menuContainer.offset().top - $menuDropdown.outerHeight(true) > 0)
            {
                if (opts.attached)
                {
                    $menuDropdown.removeClass('menuPosition-top');
                    $menuDropdown.addClass('menuPosition-bottom');
                }
                $menuDropdown.css('bottom', $menuContainer.innerHeight());
            }
        }
        else
        {
            // if the menu should be on the bottom, make it so for the sake of IE7
            // subtract 4 to account for the negative margin-top on the menu button
            $menuDropdown.css('top', $menuButton.outerHeight() - 4);
        }

        // Rehide and animate
        $menuDropdown
            .hide()
            .fadeIn(200);

        // Hook to hide menu
        $(document).bind('click.menu', function(event)
        {
            // close if user clicked out || if user clicked in link || if user clicked on linke
            if (($menuContainer.has(event.target).length === 0) ||
                ($menuDropdown.find('a').has(event.target).length > 0) ||
                $(event.target).is('.menuDropdown a'))
            {
                // jQuery animation can trample all over itself if anything else is
                // attached to the menu button
                _.defer(function()
                {
                    closeMenu(opts, $menuContainer, $menuButton, $menuDropdown);
                });
            }
        });
    };

    var closeMenu = function(opts, $menuContainer, $menuButton, $menuDropdown)
    {
        $(document).unbind('click.menu');
        $menuContainer.removeClass('open');
        $menuDropdown.fadeOut(200);
    };

    $.fn.menu.defaults = {
        attached: true,
        contents: [],
        menuButtonClass: 'menuButton',
        menuButtonContents: 'Menu',
        menuButtonTitle: 'Menu',
        renderDirective: {
            '+a.menuButton': 'menuButtonContents',
            'a.menuButton@title': 'menuButtonTitle',
            'a.menuButton@class': 'menuButtonClass',
            '.menuDropdown>ul>li': {
                'column<-columns': { // outer array for columns
                    'ul>li': {
                        'row<-column': {  // inner array for rows
                            '.@class+': 'row.className',
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