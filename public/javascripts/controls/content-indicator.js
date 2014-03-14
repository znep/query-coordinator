(function($)
{
    $.fn.contentIndicator = function(options)
    {
        // Check if object was already created
        var contentIndicator = $(this[0]).data("contentIndicator");
        if (!contentIndicator)
        {
            contentIndicator = new contentIndicatorObj(options, this[0]);
        }
        return contentIndicator;
    };

    var contentIndicatorObj = function(options, dom)
    {
        this.settings = $.extend({}, contentIndicatorObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(contentIndicatorObj,
    {
        defaults:
        {
            left: '-5px',
            text: '',
            top: '-5px'
        },

        prototype:
        {
            init: function ()
            {
                var indObj = this;
                var $domObj = indObj.$dom();
                $domObj.data("contentIndicator", indObj);

                if ($.isBlank(indObj.settings.text)) { return; }

                createInd(indObj);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            setText: function(newText)
            {
                var indObj = this;
                indObj.settings.text = newText || '';
                updateInd(indObj);
            }
        }
    });

    var createInd = function(indObj)
    {
        indObj.$dom().addClass('contentIndicatorContainer');
        indObj.$dom().append($.tag({tagName: 'span',
            'class': 'contentIndicator',
            style: {left: indObj.settings.left, top: indObj.settings.top,
                    display: $.isBlank(indObj.settings.text) ? 'none' : 'block' },
            contents: indObj.settings.text}));
    };

    var updateInd = function(indObj)
    {
        if (!indObj.$dom().hasClass('contentIndicatorContainer'))
        {
            createInd(indObj);
            return;
        }
        indObj.$dom().find('.contentIndicator').text(indObj.settings.text)
            .toggle(!$.isBlank(indObj.settings.text));
    };

})(jQuery);
