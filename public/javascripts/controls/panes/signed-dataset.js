(function($)
{
    $.Control.extend('pane_signedDataset', {
        getTitle: function()
        { return 'Digital Signing'; },

        getSubtitle: function()
        { return 'Export a version of this data whose integrity may later be verified.'; },

        isAvailable: function()
        { return this.settings.view.valid; },

        getDisabledSubtitle: function()
        {
            return !this.settings.view.valid ? 'This view must be valid' :
                'Only tabular data may be downloaded';
        },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'signedDataset',
                        callback: function($sect)
                        {
                            var cpObj = this;
                            var $link = $sect.find('.signedDatasetLink');

                            if (cpObj.settings.view.owner.id == blist.currentUserId)
                            {
                                // swap out the copy
                                _.defer(function()
                                {
                                    $sect.find('.consumerText').hide();
                                    $sect.find('.publisherText').show();
                                });
                            }

                            $link.click(function(event)
                            {
                                event.preventDefault();

                                var $line = $link.closest('li');
                                $line.addClass('loading');

                                cpObj.settings.view.getSignature(function(response)
                                    {
                                        // Update UI
                                        $sect.find('.datasetSignature').text(response.digest)
                                             .closest('li').slideDown();
                                        $line.removeClass('onlyChild loading');

                                        // Kick off download
                                        window.location = '/views/' + cpObj.settings.view.id +
                                            '/files/' + response.fileId;
                                    });
                            });

                            $sect.find('.datasetSignature').click(function() { $(this).select(); });
                        }
                    }
                }
            ];
        }
    }, {name: 'signedDataset'}, 'controlPane');

    // Checking blist.dataset is kind of a hack here; but not sure how to avoid it
    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.signedDataset
        || blist.dataset.signed !== false)
    { $.gridSidebar.registerConfig('export.signedDataset', 'pane_signedDataset', 3); }

})(jQuery);
