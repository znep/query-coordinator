(function($)
{
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
                        var $stars = $sect.find('.datasetAverageRating');
                        $stars.stars({
                            value: $stars.attr('data-rating'),
                            enabled: false
                        });

                        $.live('#gridSidebar_about .expander', 'click', function(event)
                        {
                            event.preventDefault();

                            $(this)
                                .toggleClass('expanded')
                                .toggleClass('collapsed')
                                .siblings('.sectionContent')
                                    .slideToggle();
                        });

                        $sect.find('.showStatisticsLink').click(function(event)
                        {
                            event.preventDefault();
                            $('.statsPopupModal').jqmShow();
                        });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
