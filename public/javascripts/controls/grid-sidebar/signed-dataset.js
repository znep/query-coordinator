(function($)
{
    if ((blist.dataset.signed === false) &&
         blist.sidebarHidden.exportSection.signedDataset) { return; }

    var config =
    {
        name: 'export.signedDataset',
        priority: 3,
        title: 'Digital Signing',
        subtitle: 'Export a version of this data whose integrity may later be verified.',
        onlyIf: function()
        { return blist.dataset.valid; },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid ? 'This view must be valid' :
                'Only tabular data may be downloaded';
        },
        sections: [
            {
                customContent: {
                    template: 'signedDataset',
                    callback: function($sect)
                    {
                        var $link = $sect.find('.signedDatasetLink');

                        if (blist.dataset.owner.id == blist.currentUserId)
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

                            blist.dataset.getSignature(function(response)
                                {
                                    // Update UI
                                    $sect.find('.datasetSignature')
                                         .text(response.digest)
                                         .closest('li')
                                            .slideDown();
                                    $line.removeClass('onlyChild loading');

                                    // Kick off download
                                    window.location = '/views/' + blist.dataset.id +
                                        '/files/' + response.fileId;
                                });
                        });

                        $sect.find('.datasetSignature').click(function()
                        {
                            $(this).select();
                        });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
