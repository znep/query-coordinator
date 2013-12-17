(function($)
{
    $.Control.extend('pane_about', {
        getTitle: function()
        { return $.t('controls.common.sidebar.tabs.about'); },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    customContent: {
                        template: 'aboutDataset',
                        directive: {},
                        data: {},
                        callback: function($sect)
                        {
                            // IE7/8 can't handle the slideToggle.  It also gets
                            // confused about the current state.
                            var toggleAction = ($.browser.msie && ($.browser.majorVersion <= 8)) ?
                                'toggle' : 'slideToggle';

                            if (cpObj._view.isTabular())
                            {
                                cpObj._view.getTotalRows(function()
                                { $sect.find('.row_count').text(cpObj._view.totalRows()); });
                            }

                            $sect.find('.datasetAverageRating').each(function()
                            {
                                blist.datasetControls.datasetRating($(this), $sect, true);
                                // HACK: basePane validates the parent form; but the validator
                                // crashes because it can't find a validate object on the star form
                                // Bad nested forms!
                                $(this).validate();
                            });

                            $sect.find('.expander').click(function(event)
                            {
                                event.preventDefault();
                                var $this = $(this);

                                $this.toggleClass('expanded')
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
            ];
        }
    }, {name: 'about'}, 'controlPane');

    if (!blist.sidebarHidden.about)
    { $.gridSidebar.registerConfig('about', 'pane_about'); }

})(jQuery);
