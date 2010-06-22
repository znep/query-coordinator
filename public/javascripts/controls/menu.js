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
            var dividerNext = false;
            return _.compact(
                _.map(column, function(item)
                {
                    if (item.divider === true)
                    {
                        dividerNext = true;
                        return null;
                    }

                    if (item.onlyIf === false)
                    {
                        return null;
                    }
                    else if (dividerNext)
                    {
                        item.className = (item.className || '') + ' divider';
                        dividerNext = false;
                    }
                    return item;
                }));
        });

        var itemDirective = {  // inner array for rows
            '.@class+': 'row.className',
            'a .contents': 'row.text',
            'a@href': 'row.href',
            'a@rel': 'row.rel',
            'a@title': 'row.title',
            'a .subtext': 'row.subtext'
        };

        _.each(opts.additionalDataKeys, function(key)
        {
            itemDirective['a@data-' + key] = 'row.' + key;
        });

        var renderDirective = {
            '+a.menuButton': 'menuButtonContents',
            'a.menuButton@title': 'menuButtonTitle',
            'a.menuButton@class': 'menuButtonClass',
            '.menuDropdown>ul>li': {
                'column<-columns': { // outer array for columns
                    'ul>li': {
                        'row<-column': itemDirective
                    }
                }
            }
        };

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
                        renderDirective));

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
        // close any menu that might already be open
        $(document).trigger('click.menu');

        // cache the original height before we bump things out to measure
        var origDocumentHeight = $(document).height();

        $menuContainer.addClass('open');

        // reset then realign the menu if necessary; set styles as appropriate
        // show it so we can measure it
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
                $menuDropdown.css('right', 0);
            }
        }

        if ($menuDropdown.offset().top + $menuDropdown.outerHeight(true) > origDocumentHeight)
        {
            // if the menu can be flipped up, do so; otherwise, leave it alone
            if ($menuContainer.offset().top - $menuDropdown.outerHeight(true) > 0)
            {
                $menuDropdown.css('bottom', $menuContainer.innerHeight());
            }
        }
        else
        {
            // if the menu should be on the bottom, make it so for the sake of IE7
            $menuDropdown.css('top', $menuButton.outerHeight());
        }

        // Rehide and animate
        $menuDropdown
            .hide()
            .fadeIn(200);

        // Hook to hide menu
        $(document).unbind('click.menu'); // just to be sure
        $(document).bind('click.menu', function(event)
        {
            // close if user clicked out || if user clicked in link || if user clicked on linke
            if (($menuContainer.has(event.target).length === 0) ||
                ($menuDropdown.find('a').has(event.target).length > 0) ||
                $(event.target).is('.menuDropdown a'))
            {
                closeMenu(opts, $menuContainer, $menuButton, $menuDropdown);
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
        additionalDataKeys: [],
        contents: [],
        menuButtonClass: 'menuButton',
        menuButtonContents: 'Menu',
        menuButtonTitle: 'Menu'
    };
})(jQuery);
