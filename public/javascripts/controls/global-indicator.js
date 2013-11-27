(function(){


    $.Control.extend('_globalIndicatorClass',
    {
        _init: function ()
        {
            var cObj = this;
            cObj._super.apply(this, arguments);

            // Make sure it is created
            var $domObj = cObj.$dom();
            cObj._curState = '';
        },

        $dom: function()
        {
            if ($.isBlank(this._$indicator))
            {
                this._$indicator = $.tag2({ _: 'div', className: 'globalStatusIndicator',
                    contents: [
                        { _: 'span', className: ['icon', 'waiting', 'ss-loading'] },
                        { _: 'span', className: ['icon', 'good', 'ss-check'] },
                        { _: 'span', className: ['icon', 'bad', 'ss-delete'] },
                        { _: 'span', className: 'message' }
                    ]
                });
                $('body').append(this._$indicator);
            }
            return this._$indicator;
        },

        showStatus: function(state, message, timeout)
        {
            this._$indicator.removeClass('state-' + this._curState)
                .addClass('state-' + state).addClass('shown')
                .find('.message').text(message);
            this._curState = state;
            var cObj = this;
            if (_.isNumber(timeout))
            { setTimeout(function() { cObj.hideStatus(); }, timeout); }
        },

        hideStatus: function()
        {
            this._$indicator.removeClass('shown');
        }
    });


    $.globalIndicator = new $('body')._globalIndicatorClass();
    $.extend($.globalIndicator, {
        // Convenience functions for common cases
        statusWorking: function()
        { $.globalIndicator.showStatus('waiting', $.t('controls.global_indicator.working'))},
        statusSaving: function()
        { $.globalIndicator.showStatus('waiting', $.t('controls.global_indicator.saving')) },
        statusFinished: function()
        { $.globalIndicator.showStatus('good', $.t('controls.global_indicator.saved'), 4000); },
        statusError: function()
        { $.globalIndicator.showStatus('bad', $.t('controls.global_indicator.error')); }
    });
})();
