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
