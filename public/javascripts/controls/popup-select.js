;(function($)
{
    // unfortunately, beautytips is fucking stupid and reaps/recreates
    // the tip from source each time it's created, so we have to keep
    // track of everything separately.
    var eventsBound = false;
    var popups = {};
    var items = {};

    $.fn.popupSelect = function(options)
    {
        var opts = $.extend({}, $.fn.popupSelect.defaults, options);

        return $.each(this, function()
        {
            var $this = $(this);

            var popupId = _.uniqueId();
            var $popup = $.tag({
                tagName: 'div',
                'class': 'popupSelectContainer',
                'data-popupid': popupId,
                contents: [{
                    tagName: 'p',
                    'class': 'popupSelectPrompt',
                    contents: opts.prompt
                }, {
                    tagName: 'ul',
                    'class': [ 'popupSelectList' ].concat($.arrayify(opts.listContainerClass))
                }]
            });
            $this.data('popupSelect-$popup', $popup);

            $list = $popup.find('.popupSelectList');
            _.each(opts.choices, function(choice)
            {
                var itemId = _.uniqueId();
                items[itemId] = choice;

                var $item = $.tag({
                    tagName: 'li',
                    'class': [ 'none', // so icons default to blank
                               { value: 'checked', onlyIf: _.include($.arrayify(opts.selectedItems), choice) } ],
                    'data-itemid': itemId,
                    contents: [{
                        tagName: 'span',
                        'class': 'icon selectedIcon'
                    }, {
                        tagName: 'div',
                        'class': 'contentWrapper',
                        contents: opts.renderer(choice)
                    }]
                });
                $list.append($item);
            });

            var tip = $this.socrataTip({
                content: $popup,
                fill: '#444444',
                stroke: '#444444',
                trigger: 'click'
            });

            popups[popupId] = {
                opts: opts,
                tip: tip
            };

            if (!eventsBound)
            {
                $.live('.popupSelectList li', 'click', function(event)
                {
                    var $item = $(this);
                    var $popup = $item.closest('.popupSelectContainer');

                    var data = popups[$popup.attr('data-popupid')];
                    var opts = data.opts;
                    var tip = data.tip;

                    if (opts.selectCallback(items[$item.attr('data-itemid')],
                                                 !$item.hasClass('checked')))
                    {
                        if (opts.multiselect)
                        {
                            $item.toggleClass('checked');
                        }
                        else
                        {
                            $item.siblings().removeClass('checked');
                            $item.addClass('checked');
                        }
                    }

                    if (opts.dismissOnClick)
                    {
                        tip.hide();
                    }
                });
                eventsBound = true;
            }
        });
    };

    $.fn.popupSelect_update = function(choices)
    {
        return this.each(function()
        {
            var $this = $(this);
            var $popup = $this.data('popupSelect-$popup');
            var $list = $popup.find('.popupSelectList');

            var opts = popups[$popup.attr('data-popupid')].opts;

            var selectedItems = _.compact($.makeArray($list.children().map(function()
            {
                var $item = $(this);
                return $item.hasClass('checked') ? items[$item.attr('data-itemid')] : null;
            })));

            // now completely destroy and recreate the tip because BT is dumb
            popups[$popup.data('data-popupid')].tip.destroy();
            $this.popupSelect($.extend({}, opts, {
                choices: choices,
                selectedItems: selectedItems
            }));
        });
    };

    $.fn.popupSelect.defaults = {
        choices: [],
        dismissOnClick: true,
        listContainerClass: [],
        multiselect: false,
        prompt: 'Choose one:',
        renderer: function(choice)
        {
            return choice;
        },
        selectCallback: function(choice, newState) { return true; },
        selectedItems: null
    };
})(jQuery);