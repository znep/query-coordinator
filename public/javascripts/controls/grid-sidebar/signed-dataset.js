(function($)
{
    var config =
    {
        name: 'export.signedDataset',
        priority: 3,
        title: 'Digital Signing',
        subtitle: 'Export a version of this data whose integrity may later be verified.',
        onlyIf: function()
        { return blist.display.isGrid && !blist.display.isInvalid; },
        // TODO/MERGE: { return blist.dataset.isGrid() && blist.dataset.valid; },
        disabledSubtitle: function()
        {
            return blist.display.isInvalid ? 'This view must be valid' :
            // TODO/MERGE: return !blist.dataset.valid ? 'This view must be valid' :
                'Only tabular data may be downloaded';
        },
        sections: [
            {
                customContent: {
                    template: 'signedDataset',
                    callback: function($sect)
                    {
                        $sect.find('.signedDatasetLink').click(function(event)
                        {
                            event.preventDefault();

                            var $line = $(this).closest('li');
                            $line.addClass('loading');

                            // TODO/MERGE: move into dataset?
                            $.ajax({
                                url: '/views/' + blist.display.view.id + '/signatures.json',
                                type: (blist.display.view.signed === true) ? 'get' : 'post',
                                dataType: 'json',
                                success: function(response)
                                {
                                    // Update UI
                                    $sect.find('.datasetSignature')
                                         .text(response.digest)
                                         .closest('li')
                                            .slideDown();
                                    $line.removeClass('onlyChild loading');

                                    // Kick off download
                                    window.location = '/views/' + blist.display.view.id +
                                        '/files/' + response.fileId;
                                }
                            });
                        });

                        $sect.find('.datasetSignature').click(function(event)
                        {
                            event.preventDefault();

                            $(this).select();
                        });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
