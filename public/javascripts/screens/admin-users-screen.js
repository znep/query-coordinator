$(function()
{
    var t = function(str, props) { return $.t('screens.admin.users.' + str, props); };
    var fadeMessage = function(textValue)
    {
        $('.userNotice')
            .text(textValue)
            .addClass('notice')
            .removeClass('error')
            .slideDown(300, function()
                { setTimeout(function()
                    { $('.userNotice').slideUp(); }, 5000) });
    };

    $('#adminContent .adminUsersTable .roleSelect').change(function()
    {
        var id = $(this).closest('form').find('input.hiddenID').val();
        var $select = $(this);

        $.socrataServer.makeRequest({
            url: '/api/users?method=promote&name=' + id + '&role=' + $select.val(),
            type: "PUT",
            success: function(responseData)
            {
                $select.closest('tr').attr('data-userrole', $select.val().toLowerCase());
                fadeMessage(t('user_saved'));
            },
            error: function(request)
            {
                errorJson = JSON.parse(request.responseText);
                $select.val($select.closest('.item').data('userrole'));
                $.uniform.update($select);
                $('.userNotice')
                    .removeClass('notice')
                    .addClass('error')
                    .text(errorJson.message || t('error_permission_request'))
                    .fadeIn(300);
            }
        });
    });

    var $userTable    = $('#adminContent .adminUsersTable'),
        $futuresTable = $('#adminContent .futureUsersTable'),
        $bothTables   = $('#adminContent .gridList'),
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
          sortHeaders: { 3: { sorter: false } },
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

    $userTable.find('.actions .enableAccountButton').adminButton({
        callback: function(response, $row)
        {
            $row.removeClass('disabled');
            fadeMessage(response.message);
        },
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
            $bothTables.find('tbody tr').show();
            $('.noResultsMessage').hide();
            return;
        }
        else
        {
            $bothTables.find('tbody tr').hide()
                .filter('[data-userrole=' + filterVal + ']').show();

            $bothTables.each(function(index, table){
                handleResultLength($(table).closest('.tableContainer'));
            });
        }
    });

    var $bulkCreateForm = $('.bulkUserCreateSection'),
        $bulkCreateButton = $('.showBulkCreateForm');

    $bulkCreateButton.click(function(event)
    {
        event.preventDefault();
        $bulkCreateForm
            .hide()
            .removeClass('hide').slideDown();
        $bulkCreateButton.addClass('disabled');
    });

    $('.cancelBulkCreate').click(function(event)
    {
        event.preventDefault();
        $bulkCreateForm
            .slideUp();
        $bulkCreateButton.removeClass('disabled');
    });

    // Hackity hack hack
    if (!$('html').hasClass('ie7'))
    {
        $('#adminContent select, .adminUserTable :checkbox').uniform();
    }
});
