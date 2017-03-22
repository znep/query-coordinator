blist.namespace.fetch('blist.nominations');

$(function() {
  var ratedNom = {};
  blist.nominations.map = {};
  _.each(blist.nominations.items, function(n) {
    blist.nominations.map[n.id] = new Nomination(n);
  });

  $.live('.nominationsList .gridList .rating .rateLink', 'click', function(e) {
    e.preventDefault();
    var $t = $(this);
    var $td = $t.closest('td');
    var id = $t.closest('tr.item').attr('data-nominationId');
    var isUp = $t.hasClass('rateUp');
    if (ratedNom[id] === isUp) {
      return;
    }

    blist.nominations.rate(id, $t, $td,
      function success() {
        ratedNom[id] = isUp;
      }
    );
  });

  $.live('.nominationsList .gridList a.delete', 'click', function(e) {
    e.preventDefault();
    var $t = $(this);
    var $item = $t.closest('tr.item');
    var id = $item.attr('data-nominationId');
    blist.nominations.remove(id, function() {
      $item.remove();
    });
  });

  $.live('.nominationsList .gridList .status .moderateLink', 'click', function(e) {
    e.preventDefault();
    var $t = $(this);
    var status = $t.attr('data-status');
    var id = $t.closest('tr.item').attr('data-nominationId');

    blist.nominations.moderate(id, status, $t.closest('td'));
  });

  blist.nominations.updateNomination = function(editId, nomination) {
    var $item =
      $('.nominationsList .gridList .item[data-nominationid=' +
        editId + ']');
    $item.find('.details .title').text(nomination.title);
    $item.find('.details .description').
    text(nomination.description).
    toggleClass('hide', $.isBlank(nomination.description));
  };

  var $tbody = $('.nominationsList .gridList tbody');
  blist.nominations.addNomination = function(n, beginning) {
    if (!(n.user instanceof User)) {
      n.user = new User(n.user);
    }
    blist.nominations.map[n.id] = new Nomination(n);
    var $newItem = $.renderTemplate('nominationItem', n, {
      '.item@data-nominationId': 'id',
      '.user a.userLink@href': function(nomination) {
        return nomination.context.user.getProfileUrl();
      },
      '.user a.userLink@title': 'user.displayName!',
      '.user img@src': function(nomination) {
        return nomination.context.user.getProfileImageUrl('small');
      },
      '.user img@alt': 'user.displayName!',
      '.user .userName': 'user.displayName!',
      '.details .titleLink@href': function(nomination) {
        return $.path('/nominate/' + nomination.context.id);
      },
      '.details .title': 'title!',
      '.details .submitTime .fullTime': function(nomination) {
        return new Date(nomination.context.createdAt * 1000).format('F d, Y');
      },
      '.details .submitTime .relativeTime': function(nomination) {
        return blist.util.humaneDate.getFromDate(nomination.context.createdAt * 1000);
      },
      '.details .description': 'description!',
      '.details .description@class+': function(nomination) {
        return $.isBlank(nomination.context.description) ? 'hide' : '';
      },
      '.rating .value': 'netVotes',
      '.rating@class+': function(nomination) {
        return nomination.context.netVotes > 0 ?
          'positive' :
          nomination.context.netVotes < 0 ? 'negative' : '';
      },
      '.status .currentStatus': function(nomination) {
        return blist.nominations.friendlyStatus(nomination.context).capitalize();
      },
      '.status@class+': function(nomination) {
        return blist.nominations.friendlyStatus(nomination.context).toLowerCase();
      },
      '.item@class+': 'status'
    }).find('tr.item');

    if (beginning) {
      $tbody.prepend($newItem);
    } else {
      $tbody.append($newItem);
    }

    blist.nominations.map[n.id].getComments(function(comments) {
      var $commentsSection = $newItem.find('.details .comments');
      $commentsSection.empty();
      if (comments.length > 0) {
        var flattenedComments = $.flattenChildren(comments);

        var phrase = [];

        var officialComments = _.select(flattenedComments, function(c) {
          return _.include(_.get(c, 'user.rights'), blist.rights.user.APPROVE_NOMINATIONS);
        });

        if (officialComments.length > 0) {
          phrase.push($.tag({
            tagName: 'strong',
            contents: [
              $.pluralize(officialComments.length, 'official response')
            ]
          }, true));
        }

        var nonOfficialCommentsLength = flattenedComments.length - officialComments.length;
        if (nonOfficialCommentsLength > 0) {
          phrase.push($.pluralize(nonOfficialCommentsLength, 'comment'));
        }

        $commentsSection.append($.tag({
          tagName: 'a',
          'class': 'commentsLink comment',
          href: $.path('/nominate/' + n.id),
          contents: [{
              tagName: 'span',
              'class': 'icon'
            },
            $.arrayToSentence(_.compact(phrase), 'and', ','),
            ' on this suggestion'
          ]
        }));
      }
    });
  };

  _.each(blist.nominations.items, function(item) {
    blist.nominations.addNomination(item);
  });

  $('.nominateLink.hasUser').click(function(e) {
    e.preventDefault();
    blist.nominations.showNomDialog();
  });

  $.live('.nominationsList .gridList .details .edit', 'click', function(e) {
    e.preventDefault();
    var $item = $(this).closest('tr.item');
    blist.nominations.showNomDialog($item.attr('data-nominationId'),
      $item.find('.details .title').text(),
      $item.find('.details .description').text());
  });
});
