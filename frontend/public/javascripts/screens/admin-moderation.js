var moment = require('moment');

$(function() {
  // rendering
  var directive = {
    'tr.item': {
      'comment<-': {
        '.@data-commentid': 'comment.id',
        '.@data-commentstatus': 'comment.status',
        '.author a@href': function(c) {
          return c.item.user.getProfileUrl();
        },
        '.author img@src': function(c) {
          return c.item.user.getProfileImageUrl('small');
        },
        '.author img@alt': 'comment.user.displayName!',
        '.author .cellInner': 'comment.user.displayName!',
        '.comment .cellInner': function(c) {
          return moment(c.item.createdAt * 1000).locale(blist.locale).format('LLL');
        },
        '.comment .commentBody': 'comment.body!',
        '.dataset .cellInner@href': 'comment.view.url',
        '.dataset .cellInner': 'comment.view.name!',
        '.status .cellInner': function(c) {
          return $.t('screens.admin.comment_moderation.statuses.' + c.item.status.toLowerCase());
        },
        '.status .approveComment@class+': function(c) {
          return (c.item.status == 'approved') ? 'disabled' : '';
        },
        '.status .rejectComment@class+': function(c) {
          return (c.item.status == 'rejected') ? 'disabled' : '';
        }
      }
    }
  };

  // get the data
  var comments = {};
  $.ajax({
    url: '/api/comments.json?method=getForModeration',
    dataType: 'json',
    success: function(response) {
      var $target = $('div.tableContainer tbody');

      // set up the model code
      var eachItem = function(comment) {
        var commie = $.extend({}, comment, {
          user: new User(comment.user),
          view: createDatasetFromView(comment.view)
        });
        comments[comment.id] = commie;
        return commie;
      };

      // render some of the rows into the table
      var eachBatch = function(batch) {
        $target.append($.renderTemplate('moderationItem', batch, directive).children('tr'));
      };

      // set up the table sort
      var complete = function() {
        $('.commentModerationList.gridList').combinationList({
          headerContainerSelector: '.gridListWrapper',
          initialSort: [
            [1, 1]
          ],
          scrollableBody: false,
          selectable: false,
          sortGrouping: false,
          sortHeaders: {
            0: {
              sorter: 'text'
            },
            1: {
              sorter: 'autoDateTime'
            },
            2: {
              sorter: 'text'
            },
            3: {
              sorter: false
            }
          },
          sortTextExtraction: function(node) {
            return $(node).find('.cellInner').text();
          }
        });
      };

      // gogogo
      $.batchProcess(response, 10, eachItem, eachBatch, complete);
    }
  });

  // events
  var updateCommentStatus = function(commentId, status) {
    var comment = comments[commentId];
    var $rows = $('[data-commentid=' + commentId + '] .status');

    $rows.find('.cellInner').html('<span class="loading"></span>');
    $.ajax({
      url: '/views/' + comment.view.id + '/comments?method=moderate' +
        '&id=' + comment.id + '&status=' + status.toUpperCase(),
      type: 'POST',
      dataType: 'json',
      success: function() {
        var buttonMap = {
          'approved': 'approveComment',
          'rejected': 'rejectComment'
        };
        $rows.closest('tr').attr('data-commentstatus', status).end().
          find('.cellInner').text(status).end().
          find('.button').removeClass('disabled').filter('.' + buttonMap[status]).addClass('disabled');
      }
    });
  };

  $.live('.approveComment, .rejectComment', 'click', function(event) {
    event.preventDefault();

    var $this = $(this);
    if ($this.is('.disabled')) {
      return;
    }

    updateCommentStatus($this.closest('.item').attr('data-commentid'), $this.attr('data-action'));
  });

  $('#commentStatusDropdown').change(function() {
    var value = $(this).val();
    if (value == 'all') {
      $('.commentModerationList tbody tr').show();
      $('.noResultsMessage').hide();
      return;
    } else {
      $('.commentModerationList tbody tr').hide().filter('[data-commentstatus=' + value + ']').show();
      if ($('.commentModerationList tbody tr:visible').length === 0) {
        $('.noResultsMessage').fadeIn();
      } else {
        $('.noResultsMessage').hide();
      }
    }
  }).uniform();
});
