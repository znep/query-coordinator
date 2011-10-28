$(function ()
{
    $('#jqmAlert, #jqmConfirm').jqm({trigger: false});

    window.alert = function(msg)
    {
        $('#jqmAlert').jqmShow().find('.alertMessage').text(msg);
    };

    window.prettyConfirm = function(msg, yes, no)
    {
        $('#jqmConfirm').jqmShow()
            .find('.confirmMessage').text(msg).end()
            .find('.button.yes').click(yes).end()
            .find('.button.no').click(no).end();
    };
});
