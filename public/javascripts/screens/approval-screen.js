var approvalNS = blist.namespace.fetch("blist.approval");

approvalNS.populateTable = function(comments)
{
    var $table = $('#moderationQueue');
    $.each(comments, function() {
        // clone template row
        var $newRow = $('<div class="commentList-row clearfix">' +
            $table.find('.commentList-templateRow').html() + '</div>');

        // wire up menu
        $newRow.find('.commentMenu').dropdownMenu({triggerButton: $newRow.find('.commentMenuButton')});

        // fill data in
        $newRow.data('approval-commentData', this);
        $newRow.find('.commentAuthorImage')
            .attr('src', '/users/' + this.user.id + '/profile_images/small')
            .attr('alt', this.user.displayName);
        $newRow.find('.commentAuthorName').text(this.user.displayName);
        $newRow.find('.commentAuthorCompany').text(this.user.company);

        $newRow.find('.commentTimestamp').text(new Date(this.createdAt * 1000).toString());
        if (this.title === undefined)
        {
            $newRow.find('.commentTitle').hide();
        }
        else
        {
            $newRow.find('.commentTitle').text(this.title);
        }
        $newRow.find('.commentBody').text(this.body);

        $newRow.find('.commentStatus')
            .addClass(this.status)
            .text($.capitalize(this.status));
        $newRow.appendTo($table.find('.commentList-body'));
    });
};

approvalNS.updateCommentStatus = function($row, status)
{
    $row.find('.commentStatus')
        .empty()
        .append('<img src="/images/throbber.gif" alt="Updating..."/>');

    var comment = $row.data('approval-commentData');
    $.ajax({
        url: '/views/' + comment.viewId +
             '/comments?method=moderate' +
             '&id=' + comment.id +
             '&status=' + status.toUpperCase(),
        dataType: "json",
        contentType: "application/json",
        success: function(response, responseStatus) {
            $row.find('.commentStatus').text($.capitalize(response.status));
        }
    });
};

$(function() {
    // load the data in
    $.ajax({
        url: approvalNS.servicePath,
        dataType: "json",
        contentType: "application/json",
        success: function(response, status) {
            approvalNS.populateTable(response);
        }
    });

    $('.commentList-headerRow .checkbox').click(function(event) {
        event.preventDefault();
        $('.checkbox').toggleClass('checked', !$(this).is('.checked'));
    });

    $('.commentList-body .checkbox').live('click', function(event) {
        event.preventDefault();
        $(this).toggleClass('checked');
    });

    $('.commentList-row .commentMenu .approveComment a').live('click', function(event) {
        event.preventDefault();
        approvalNS.updateCommentStatus($(this).closest('.commentList-row'), 'approved');
    });

    $('.commentList-row .commentMenu .rejectComment a').live('click', function(event) {
        event.preventDefault();
        approvalNS.updateCommentStatus($(this).closest('.commentList-row'), 'rejected');
    });
    
    $('.headerActions .approveButton').click(function(event) {
        event.preventDefault();
        $('.commentList-body .commentList-row:visible:has(.checkbox.checked)').each(function() {
            approvalNS.updateCommentStatus($(this), 'approved');
        });

        $('.commentList .checkbox').removeClass('checked');
    });

    $('.headerActions .rejectButton').click(function(event) {
        event.preventDefault();
        $('.commentList-body .commentList-row:visible:has(.checkbox.checked)').each(function() {
            approvalNS.updateCommentStatus($(this), 'rejected');
        });

        $('.commentList .checkbox').removeClass('checked');
    });
});