;(function($)
{
    $.fn.popupSelect = function(options)
    {
        var opts = $.extend({}, $.fn.popupSelect.defaults, options);

        return $.each(this, function()
        {
            var $this = $(this);

            var $popup = $.tag({
                tagName: 'div',
                'class': 'popupSelectContainer',
                contents: [{
                    tagName: 'p',
                    'class': 'popupSelectPrompt',
                    contents: opts.prompt
                }, {
                    tagName: 'ul',
                    'class': [ 'popupSelectList' ].concat($.arrayify(opts.listContainerClass))
                }]
            });

            $list = $popup.find('.popupSelectList');
            _.each(opts.choices, function(choice)
            {
                var $item = $.tag({
                    tagName: 'li',
                    contents: [{
                        tagName: 'div',
                        'class': [ 'selectedIcon',
                                   'none',
                                   { value: 'checked', onlyIf: choice === opts.selectedItem } ],
                        contents: {
                            tagName: 'span',
                            'class': 'icon'
                        }
                    }, {
                        tagName: 'div',
                        'class': 'contentWrapper',
                        contents: opts.renderer(choice)
                    }]
                });
                $item.data('popupSelect-choice', choice);
                $list.append($item);
            });

            var tip = $this.socrataTip({
                content: $popup,
                fill: '#444444',
                stroke: '#444444',
                trigger: 'click'
            });

            $list.children().click(function(event)
            {
                var $item = $(this);
                var $selectedIcon = $item.find('.selectedIcon');

                if (opts.selectCallback($item.data('popupSelect-choice'),
                                       !$selectedIcon.hasClass('checked')))
                {
                    if (opts.multiselect)
                    {
                        $selectedIcon.toggleClass('checked');
                    }
                    else
                    {
                        $list.find('.selectedIcon').removeClass('checked');
                        $selectedIcon.addClass('checked');
                    }
                }

                if (opts.dismissOnClick)
                {
                    tip.hide();
                }
            });
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
        selectedItem: null
    };
})(jQuery);