$(function ()
{
    var getModal = function(selector)
    {
        var $modal = $('#modals ' + selector);
        if ($modal.length === 0)
        {
            // didn't find a modal; grab it out of templates and initialize it.
            $modal = $($('#templates').contents().text()).filter(selector);
            $modal.appendTo('#modals');
            $modal.jqm({ trigger: false });
        }
        return $modal;
    };

    window.alert = function(msg)
    {
        getModal('#jqmAlert').jqmShow().find('.alertMessage').text(msg);
    };

    window.prettyConfirm = function(msg, yes, no)
    {
        getModal('#jqmConfirm').jqmShow()
            .find('.confirmMessage').text(msg).end()
            .find('.button.yes').click(yes).end()
            .find('.button.no').click(no).end();
    };
});

