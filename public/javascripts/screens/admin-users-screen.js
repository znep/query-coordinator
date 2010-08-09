var adminUsersNS = blist.namespace.fetch('blist.admin.users');

adminUsersNS.onPromoteError = function(request, context)
{
    var errorJSON = JSON.parse(request.responseText);
    if(errorJSON.message)
    {
        errorText = errorJSON.message;
    }
    else
    {
        errorText = "There was an error processing your permission request.";
    }
    context.closest('form').find('.errorMessage').text(errorText);
}

$(function()
{
    $('#adminContent .adminUsersTable .userSaveButton').hide();

    $('#adminContent .adminUsersTable .roleSelect').change(function()
    {
        var id = $(this).closest('form').find('input.hiddenID').val();
        var $select = $(this);
        
        $.ajax({
            url: '/api/users?method=promote&name=' + id + '&role=' + $select.val(),
            contentType: "application/json",
            dataType: "json",
            type: "POST",
            success: function(responseData)
            {
                $select.closest('form').find('.statusMessage')
                    .show()
                    .text('Saved')
                    .fadeOut(3000);
            },
            error: function(request, status, error)
            {
                adminUsersNS.onPromoteError(request, $select);
            }
        });
        
    });

    $('#adminContent.contentBox select').uniform();
});
