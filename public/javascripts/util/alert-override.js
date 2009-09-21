function alert(msg)
{
    $('#jqmAlert').jqmShow().find('.alertMessage').text(msg);
};

$(function ()
{
    $('#jqmAlert').jqm({trigger: false});
});
