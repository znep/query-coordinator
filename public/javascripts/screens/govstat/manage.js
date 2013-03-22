$(function()
{
    // ----- DATA ------
    $('#manageDataPage .singleItem .secondaryAction .delete').on('click', function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if (confirm('Are you sure you want to remove this dataset?'))
        {
            $.globalIndicator.statusWorking();
            Dataset.lookupFromViewId($a.data('dsid'), function(ds)
            {
                ds.remove(function()
                {
                    $.globalIndicator.statusFinished();
                    $.component($a.closest('.singleItem').parent().attr('id')).remove();
                },
                $.globalIndicator.statusError);
            },
            $.globalIndicator.statusError);
        }
    });

    // ----- REPORTS ------
    $('#manageReportsPage .singleItem .secondaryAction .delete').on('click', function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if (confirm('Are you sure you want to remove this report?'))
        {
            $.globalIndicator.statusWorking();
            $.socrataServer.makeRequest({
                type: 'POST', url: '/api/id/pages',
                data: JSON.stringify([{ path: $a.data('id'), ':deleted': true }]),
                // If Apache were properly set up, we could use a real delete
                // At the moment, that doesn't work
                //type: 'DELETE',
                //url: '/api/id/pages/' + encodeURIComponent($a.data('id')) + '.json',
                error: $.globalIndicator.statusError,
                success: function()
                {
                    $.globalIndicator.statusFinished();
                    $a.closest('.singleItem').remove();
                }
            });
        }
    });

    // ----- TEMPLATE ------
    $('#manageTemplatePage input[type=submit]').hide();

    $('#manageTemplatePage input[type=radio]').on('change', function(e)
    {
        var $input = $(e.currentTarget);
        var d = {}
        d[$input.attr('name')] = $input.val();
        $.globalIndicator.statusWorking();
        $.ajax({ url: $input.closest('form').attr('action'), type: 'POST', data: d,
        error: $.globalIndicator.statusError,
        success: function()
        {
            $.globalIndicator.statusFinished();
        } });
    });
});
