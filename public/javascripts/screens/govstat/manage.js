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
            Page.deleteById($a.data('id'), $a.data('oldid'), function()
                {
                    $.globalIndicator.statusFinished();
                    $a.closest('.singleItem').remove();
                }, $.globalIndicator.statusError);
        }
    });

    $('.socrataModalWrapper').on('click', '#configuratorSettings .actions .save', function(e)
    {
        e.preventDefault();
        var $settingsDialog = $(this).closest('#configuratorSettings');

        var report = $settingsDialog.data('report');
        report.update({ name: $settingsDialog.find('[name=pageTitle]').value() ||
            'Copy of ' + report.name });

        $.globalIndicator.statusSaving();
        Page.uniquePath(report.name, '/reports/', function(path)
        {
            report.saveCopy({ path: path }, function(newReport)
            {
                $.globalIndicator.statusFinished();
                window.location = newReport.path + '?_edit_mode=true';
            }, $.globalIndicator.statusError);
        });
    });

    $('#manageReportsPage .singleItem .secondaryAction .copy').on('click', function(e)
    {
        e.preventDefault();
        var $a = $(this);

        $.globalIndicator.statusWorking();
        Page.createFromId($a.data('id'), $a.data('oldid'), function(report)
        {
            $.globalIndicator.hideStatus();
            var $settingsDialog = $.showModal('configuratorSettings');
            $settingsDialog.find('input[name=pageUrl]').closest('.line').addClass('hide');
            $settingsDialog.find('[name=pageTitle]').value('Copy of ' + report.name);
            $settingsDialog.find('.errorMessage').addClass('hide');
            $settingsDialog.data('report', report);
        },
        $.globalIndicator.statusError);
    });

    // ----- TEMPLATE ------
    $('#manageTemplatePage input[type=submit]').hide();

    $('#manageTemplatePage input[type=radio]').on('change', function(e)
    {
        var $input = $(e.currentTarget);
        var d = {}
        d[$input.attr('name')] = $input.val();
        $.globalIndicator.statusSaving();
        $.ajax({ url: $input.closest('form').attr('action'), type: 'POST', data: d,
        error: $.globalIndicator.statusError,
        success: function()
        {
            $.globalIndicator.statusFinished();
        } });
    });
});
