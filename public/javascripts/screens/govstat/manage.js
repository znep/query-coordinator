$(function()
{
    // ----- DATA ------
    $('#manageDataPage .singleItem .delete').on('click', function(e)
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
                    //$.component($a.closest('.singleItem').parent().attr('id')).remove();
                    $a.closest('.singleItemWrapper').remove();
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
            var callback = _.after(2, function()
            {
                $.globalIndicator.statusFinished();
                $a.closest('.singleItem').remove();
            });

            // Have to delete from both new and old service :/
            if (!$.isBlank($a.data('id')))
            {
                $.socrataServer.makeRequest({
                    type: 'DELETE', url: '/api/pages/' + $a.data('id') + '.json',
                    error: $.globalIndicator.statusError,
                    success: callback
                });
            }
            else
            { callback(); }
            if (!$.isBlank($a.data('oldid')))
            {
                $.socrataServer.makeRequest({
                    type: 'POST', url: '/api/id/pages',
                    data: JSON.stringify([{ path: $a.data('oldid'), ':deleted': true }]),
                    error: $.globalIndicator.statusError,
                    success: callback
                });
            }
            else
            { callback(); }
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
