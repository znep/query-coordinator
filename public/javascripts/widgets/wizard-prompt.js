(function($)
{
    $.fn.wizardPrompt = function(options)
    {
        // Check if object was already created
        var wizardPrompt = $(this[0]).data("wizardPrompt");
        if (!wizardPrompt)
        {
            wizardPrompt = new wizardPromptObj(options, this[0]);
        }
        return wizardPrompt;
    };

    var wizardPromptObj = function(options, dom)
    {
        this.settings = $.extend({}, wizardPromptObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var wizUID = 0;

    $.extend(wizardPromptObj,
    {
        defaults:
        {
            buttons: null,
            buttonCallback: null,
            closeCallback: null,
            closeEvents: null,
            closeSelector: 'a, :input',
            positions: null,
            prompt: null
        },

        prototype:
        {
            init: function ()
            {
                var wizObj = this;
                var $domObj = wizObj.$dom();
                $domObj.data("wizardPrompt", wizObj);
                wizObj._uid = wizUID++;

                var $msg = $('<div class="wizardPrompt">' +
                    '<span class="prompt">' + wizObj.settings.prompt + '</span>' +
                    '</div>');
                if (!_.isNull(wizObj.settings.buttons))
                {
                    $msg.append('<ul class="actionButtons clearfix"></ul>');
                    var $list = $msg.find('ul.actionButtons');
                    _.each(wizObj.settings.buttons, function(b)
                    {
                        var $link = $('<a href="#' + $.urlSafe(b.text) + '">' +
                            $.htmlEscape(b.text) + '</a>');
                        $link.data('wizardValue', b.value);
                        $list.append($('<li></li>').append($link));
                    });
                }

                $msg.find('.actionButtons a').click(function(e)
                {
                    e.preventDefault();
                    wizObj.close();
                    if (!_.isNull(wizObj.settings.buttonCallback))
                    { wizObj.settings.buttonCallback($(this).data('wizardValue')); }
                });

                $domObj.socrataTip({message: $msg, closeOnClick: false,
                    positions: wizObj.settings.positions});

                var events = wizObj.settings.closeEvents;
                if (_.isNull(events))
                { events = 'click, change'; }
                var $closeItems = $domObj.find(wizObj.settings.closeSelector);
                if (typeof events == 'string')
                { events = events.replace(/\s+/g, '').split(','); }
                _.each(events, function(ev)
                {
                    $closeItems.bind(ev + '.wizardPrompt' + wizObj._uid,
                        function(e) { wizObj.close(); });
                });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            close: function()
            {
                var wizObj = this;
                wizObj.$dom().socrataTip().destroy();
                wizObj.$dom().removeData('wizardPrompt');

                var $closeItems = wizObj.$dom().find(wizObj.settings.closeSelector);
                $closeItems.unbind('.wizardPrompt' + wizObj._uid);

                if (!_.isNull(wizObj.settings.closeCallback))
                { wizObj.settings.closeCallback(); }
            }
        }
    });

})(jQuery);
