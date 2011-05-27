(function($)
{
    if (blist.sidebarHidden.about) { return; }

    var config =
    {
        name: 'about',
        priority: 6,
        title: 'About This Dataset',
        sections: [
            {
                customContent: {
                    template: 'aboutDataset',
                    directive: {},
                    data: {},
                    callback: function($sect)
                    {
                        // IE7/8 can't handle the slideToggle.  It also gets
                        // confused about the current state.
                        var toggleAction = ($.browser.msie &&
                            ($.browser.majorVersion <= 8)) ?
                            'toggle' : 'slideToggle';

                        $sect.find('.datasetAverageRating').each(function()
                        {
                            blist.datasetControls.datasetRating($(this),
                                $sect, true);
                        });

                        $.live('#gridSidebar_about .expander', 'click', function(event)
                        {
                            event.preventDefault();
                            var $this = $(this);

                            $this
                                .toggleClass('expanded')
                                .toggleClass('collapsed')
                                .siblings('.sectionContent')[toggleAction]
                                    ($this.hasClass('expanded'));
                        });

                        $sect.find('.routingApproval .reasonBox').each(function()
                        { blist.datasetControls.raReasonBox($(this)); });

                        blist.datasetControls.datasetContact($sect);
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
