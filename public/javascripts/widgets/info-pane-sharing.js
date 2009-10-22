(function($)
{
    $.fn.infoPaneSharing = function(options)
    {
        // Check if object was already created
        var infoPaneSharing = $(this[0]).data("infoPaneSharing");
        if (!infoPaneSharing)
        {
            infoPaneSharing = new infoPaneShare(options, this[0]);
        }
        return infoPaneSharing;
    };

    var infoPaneShare = function(options, dom)
    {
        this.settings = $.extend({}, infoPaneShare.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(infoPaneShare,
    {
        defaults:
        {
            $publishingPane: null,
            $summaryPane: null,
            notifySelector: 'a#notifyAll',
            deleteSelector: '.shareDelete',
            infoLinkSelector: '#shareInfoLink',
            infoMenuSelector: '#shareInfoMenu',
            hoverListSelector: '.gridList',
            notifyThrobberSelector: '.typeNotify .throbber',
            summaryUpdateCallback: null,
            switchPermsSelector: '.switchPermsLink',
            switchPermsThrobberSelector: '.sharingSummary .throbber'
        },

        prototype:
        {
            init: function ()
            {
                this.$dom().data("infoPaneSharing", this);
                setUpPane(this);
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            // External interface methods
            refresh: function(viewId)
            {
                var currentObj = this;
                blist.meta.updateMeta("sharing", viewId, null,
                    function() { setUpPane(currentObj); });
                blist.meta.updateMeta("summary", viewId, null,
                    currentObj.settings.summaryUpdateCallback);
            }
        }
    });

    var setUpPane = function(currentObj)
    {
        var s = currentObj.settings;
        var $domObj = currentObj.$dom();

        // Notify All link
        $domObj.find(s.notifySelector).click(function(event)
        {
            event.preventDefault();
            $domObj.find(s.notifyThrobberSelector).removeClass('hidden');
            var $notifyLink = $(this);
            $.post($notifyLink.closest("form").attr("action"), null,
                function(data, textStatus)
                {
                    $domObj.find(s.notifyThrobberSelector).addClass('hidden');
                    $notifyLink.blistAlert(
                        {message: 'Notification emails have been sent'});
                });
        });

        // Social networks menu
        $domObj.find(s.infoMenuSelector)
            .dropdownMenu({triggerButton: $domObj.find(s.infoLinkSelector),
                    forcePosition: true, closeOnResize: true});

        // Public/Private toggle
        $domObj.find(s.switchPermsSelector).click(function (event)
        {
            event.preventDefault();
            var $throbber = $domObj.find(s.switchPermsThrobberSelector);
            if (!$throbber.is('.hidden')) { return; }
            $throbber.removeClass('hidden');

            var $link = $(this);
            var curState = $link.text().toLowerCase();
            var newState = curState == 'private' ?
                'public' : 'private';
            var viewId = $link.attr('href').split('_')[1];
            $.ajax({url: '/views/' + viewId,
                data: {'method': 'setPermission', 'value': newState},
                complete: function()
                { $throbber.addClass('hidden'); },
                error: function()
                { alert('There was a problem changing the permissions'); },
                success: function()
                {
                    var capState = $.capitalize(newState);

                    if ($link.closest('p.shared').length > 0)
                    {
                        if (curState == 'private') { curState += 'Shared'; }
                        if (newState == 'private') { newState += 'Shared'; }
                    }

                    // Update link & icon
                    $link.closest('p.' + curState)
                        .removeClass(curState).addClass(newState);
                    $link.text(capState);
                    // Update panel header & icon
                    $domObj.find('.panelHeader.' + curState).text(capState)
                        .removeClass(curState).addClass(newState);

                    if (currentObj.settings.$summaryPane !== null)
                    {
                        // Update line in summary pane
                        currentObj.settings.$summaryPane
                            .find('.permissions .itemContent > *').text(capState);
                        // Update summary panel header icon
                        currentObj.settings.$summaryPane.find('.panelHeader')
                            .removeClass(curState).addClass(newState);
                    }

                    if (currentObj.settings.$publishingPane)
                    {
                        // Update publishing panel view
                        currentObj.settings.$publishingPane
                            .find('.infoContent > .hide').removeClass('hide');
                        if (newState == 'private')
                        {
                            currentObj.settings.$publishingPane
                                .find('.publishContent').addClass('hide');
                        }
                        else
                        {
                            currentObj.settings.$publishingPane
                                .find('.publishWarning').addClass('hide');
                        }
                    }
                }
            });
        });

        // List hover
        $domObj.find(s.hoverListSelector).blistListHoverItems();

        // Share deleting
        $domObj.find(s.deleteSelector).click(function(event)
        {
            event.preventDefault();

            var $link = $(this);
            var viewId = $link.closest("table").attr("id").split("_")[1];
            $.getJSON($link.attr("href"),
                function(data) {
                    // Replace the delete X with a throbber.
                    $link.closest(".cellInner").html(
                        $('<img src="/images/throbber.gif" ' +
                            'width="16" height="16" alt="Deleting..." />')
                    );

                    currentObj.refresh(viewId);
                }
            );
        });
    };

})(jQuery);
