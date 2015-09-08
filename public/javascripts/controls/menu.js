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

        var isSettingsMenu = opts.menuButtonElement && opts.menuButtonElement.hasClass('settings-icon');

        var itemDirective;

        if (isSettingsMenu) {
            itemDirective = {  // inner array for rows
                '.@class+': 'row.className',
                'a .contents': 'row.text',
                'a@title': 'row.title'
            };
        } else {
            itemDirective = {  // inner array for rows
                '.@class+': 'row.className',
                'a .contents': 'row.text',
                'a@href': 'row.href',
                'a@rel': 'row.rel',
                'a@title': 'row.title',
                'a .subtext': 'row.subtext'
            };
        }

        _.each(opts.additionalDataKeys, function(key)
        {
            itemDirective['a@data-' + key] = 'row.' + key;
        });

        _.each(opts.additionalJsonKeys, function(key)
        {
            itemDirective['a@data-' + key] = function(k)
            { return $.htmlEscape(JSON.stringify(k.item[key])); };
        });

        var renderDirective;
        if (isSettingsMenu) {
            renderDirective = {
                '.menuDropdown>ul>li': {
                    'column<-columns': { // outer array for columns
                        'ul>li': {
                            'row<-column': itemDirective
                        }
                    }
                }
            };
        } else {
            renderDirective = {
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
        }

        return this.each(function()
        {
            var $menuContainer = $(this);
            var $menuButton;

            if (isSettingsMenu) {
                $menuContainer
                    .empty()
                    .append(
                        $.renderTemplate(
                            'settings.menu',
                            { columns: contents },
                            renderDirective));

                $menuButton = opts.menuButtonElement;
                $menuButton.attr('href', '#');
            } else {
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

                $menuButton = $menuContainer.children('a');
            }

            var $menuDropdown = $menuContainer.children('div');
            if ($menuButton.hasClass('settings-icon')) {
                $menuDropdown.addClass('settings');
            }

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
            $menuContainer.bind('menu-close', function(event)
            {
                if ($menuDropdown.is(':visible'))
                {
                    closeMenu(opts, $menuContainer, $menuButton, $menuDropdown);
                }
            });
        });
    };

    var openMenu = function(opts, $menuContainer, $menuButton, $menuDropdown)
    {
        if (_.isFunction(opts.onOpen))
            opts.onOpen($menuContainer);

        // close any menu that might already be open
        $(document).trigger('click.menu');

        // cache the original height before we bump things out to measure
        var $par = $.isBlank(opts.parentContainer) ? $menuContainer.scrollParent() : $(opts.parentContainer);
        var parOffset = $par.offset() || {top: 0, left: 0};
        var origContainerBottom = $par.height() + parOffset.top;
        var origContainerRight = $par.width() + parOffset.left;

        $menuContainer.addClass('open');

        // reset then realign the menu if necessary; set styles as appropriate
        // show it so we can measure it
        $menuDropdown
            .css('width', '')
            .css('right', '')
            .css('bottom', '')
            .css('top', '')
            .show();

        // HACK/TODO: IE7 breaks because it can't see the width of the floated
        // children.
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

        if ($menuDropdown.offset().left + $menuDropdown.outerWidth(true) >
            origContainerRight)
        {
            // if the menu can be flipped left, do so; otherwise, crop it
            if ($menuContainer.offset().left + $menuButton.outerWidth(true) -
                    $menuDropdown.outerWidth(true) < 0)
            {
                $menuDropdown.css('width', $(window).width() -
                    $menuDropdown.offset().left - 10);
            }
            else if (!opts.noFlip)
            {
                $menuDropdown.css('right', 0);
            }
        }

        if ($menuDropdown.offset().top + $menuDropdown.outerHeight(true) >
            origContainerBottom)
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
            // close if user clicked out || if user clicked in link || if user
            // clicked on link
            // Short-circuit test for event.target is document, since IE
            // throws errors when checking .has(document)
            var clickedDocument = event.target == document;
            var clickedOutsideMenu = event.target !== $menuButton[0] && $menuContainer.has(event.target).length === 0;
            var clickedDropdownLink = $menuDropdown.find('a').has(event.target).length > 0;
            var clickedDropdownOption = $(event.target).is('.menuDropdown a');

            if (clickedDocument || clickedOutsideMenu || clickedDropdownLink || clickedDropdownOption)
            {
                closeMenu(opts, $menuContainer, $menuButton, $menuDropdown);
            }
        });
    };

    var closeMenu = function(opts, $menuContainer, $menuButton, $menuDropdown)
    {
        if (_.isFunction(opts.onClose))
            opts.onClose($menuContainer);

        $(document).unbind('click.menu');
        $menuContainer.removeClass('open');
        if ($menuContainer.is(':visible'))
        {
            $menuDropdown.fadeOut(200);
        }
        else
        {
            $menuDropdown.hide();
        }
    };

    $.fn.menu.defaults = {
        additionalDataKeys: [],
        additionalJsonKeys: [],
        contents: [],
        menuButtonClass: 'menuButton',
        menuButtonContents: 'Menu',
        menuButtonTitle: 'Menu',
        menuButtonElement: null,
        onOpen: function($menuContainer) {},
        onClose: function($menuContainer) {},
        parentContainer: null
    };
})(jQuery);
