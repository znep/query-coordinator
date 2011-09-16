(function($)
{
    $.fn.loadingSpinner = function(options)
    {
        // Check if object was already created
        var loadingSpinner = $(this[0]).data("loadingSpinner");
        if (!loadingSpinner)
        { loadingSpinner = new loadingSpinnerObj(options, this[0]); }
        return loadingSpinner;
    };

    var loadingSpinnerObj = function(options, dom)
    {
        this.settings = $.extend({}, loadingSpinnerObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(loadingSpinnerObj,
    {
        defaults:
        {
            model: null,
            overlay: false,
            showInitially: false
        },

        prototype:
        {
            init: function ()
            {
                var spObj = this;
                spObj.$dom().data("loadingSpinner", spObj);
                spObj.showHide(spObj.settings.showInitially);

                if (!$.isBlank(spObj.settings.model))
                {
                    spObj.settings.model.bind('request_start', function() { spObj.showHide(true); });
                    spObj.settings.model.bind('request_status', function()
                        { spObj.setMessage.apply(spObj, arguments); });
                    spObj.settings.model.bind('request_finish', function() { spObj.showHide(false); });
                }
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $content: function()
            {
                if ($.isBlank(this._$content))
                {
                    this._$content = $.tag({tagName: 'div', 'class': 'loadingSpinnerContainer'});
                    this._$content.append($.tag({tagName: 'div', 'class': 'loadingSpinner'}));
                    this._$content.append($.tag({tagName: 'div', 'class': 'loadingMessage'}));
                    this._$content.append($.tag({tagName: 'div', 'class': ['loadingCountdown', 'hide'],
                        contents: ['Checking', {tagName: 'span', 'class': 'secondsSection', contents:
                            [' in ', {tagName: 'span', 'class': 'seconds'}, ' seconds']},
                        '...']}));
                    this.$dom().append(this._$content);

                    if (this.settings.overlay)
                    {
                        var $o = $.tag({tagName: 'div', 'class': 'loadingOverlay'});
                        this.$dom().append($o);
                        this._$content = this._$content.add($o);
                    }
                }
                return this._$content;
            },

            showHide: function(doShow)
            {
                this.$content().toggleClass('hide', !doShow);
                if (!doShow)
                {
                    this.$content().find('.loadingMessage, .loadingCountdown').addClass('hide');
                    clearCountdown(this);
                }
            },

            setMessage: function(message, countdown)
            {
                var spObj = this;
                if (!$.isBlank(message))
                { spObj.$content().find('.loadingMessage').removeClass('hide').text(message); }
                if (!$.isBlank(countdown))
                {
                    var $sec = spObj.$content().find('.loadingCountdown').removeClass('hide')
                        .find('.secondsSection').removeClass('hide')
                        .find('.seconds').text(countdown);
                    clearCountdown(spObj);

                    spObj._countdownTimer = setInterval(function()
                    {
                        countdown--;
                        $sec.text(countdown);
                        if (countdown < 1)
                        {
                            clearCountdown(spObj);
                            spObj.$content().find('.secondsSection').addClass('hide');
                        }
                    }, 1000);
                }
            }
        }
    });

    var clearCountdown = function(spObj)
    {
        if (!$.isBlank(spObj._countdownTimer))
        {
            clearInterval(spObj._countdownTimer);
            delete spObj._countdownTimer;
        }
    };

})(jQuery);
