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

    var fadeMessage = function(textValue)
    {
        $('.userNotice')
            .text(textValue)
            .slideDown(300, function()
                { setTimeout(function()
                    { $('.userNotice').slideUp(); }, 5000) });
    };

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
                $select.closest('tr').attr('data-userrole', $select.val().toLowerCase());
                fadeMessage('User saved');
            },
            error: function(request, status, error)
            {
                adminUsersNS.onPromoteError(request, $select);
            }
        });
    });

    var $userTable    = $('#adminContent .adminUsersTable'),
        $futuresTable = $('#adminContent .futureUsersTable'),
        deleteActions = {
            callback: function(response, $row) {
                var $container = $row.closest('.tableContainer');
                $row.slideUp().remove();
                handleResultLength($container);
            },
            workingSelector: '.actions'
        },
        comboDefaults = {
          headerContainerSelector: '.gridListWrapper',
          initialSort: [[0, 0]],
          scrollableBody: false,
          selectable: false,
          sortGrouping: false,
          sortTextExtraction: function(node) {
              return $(node).find('.cellInner').text();
          }
    }

    $userTable.find('.actions .deleteButton').adminButton(deleteActions);

    $userTable.find('.actions .resetPasswordButton').adminButton({
        callback: function(response, $row)
        { fadeMessage(response.message); },
        workingSelector: '.actions'
    });

    $userTable.combinationList(comboDefaults);

    $futuresTable
        .find('.actions .removeButton').adminButton(deleteActions)
            .end()
        .combinationList(comboDefaults);

    var handleResultLength = function($table)
    {
        $table
            .toggleClass('noResults', $table.find('tbody tr:visible').length === 0);
    };

    $('#userRoleFilterDropdown').change(function()
    {
        var filterVal = $(this).val();

        if (filterVal == 'all')
        {
            $userTable.find('tbody tr').show();
            $('.noResultsMessage').hide();
            return;
        }
        else
        {
            $userTable.find('tbody tr').hide()
                .filter('[data-userrole=' + filterVal + ']').show();

            handleResultLength($userTable.closest('.tableContainer'));
        }
    });

    $('.showBulkCreateForm').click(function(event)
    {
        event.preventDefault();
        $('.bulkUserCreateSection').hide().removeClass('hide').slideDown();
        $(event.target).addClass('disabled');
    });

    // Hackity hack hack
    if (!$('html').hasClass('ie7'))
    {
        $('#adminContent select, .adminUserTable :checkbox').uniform();
    }
});
