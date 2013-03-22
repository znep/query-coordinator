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
});
