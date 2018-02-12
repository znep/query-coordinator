(function($) {
  var commentDirective = {
    '.commentActions .commentInappropriateLink': function(a) {
      return a.context.commentFlagged ? $.t('controls.feed.comment_actions.already_marked_inappropriate') : $.t('controls.feed.comment_actions.inappropriate');
    },
    '.commentActions .commentInappropriateLink@class+': function(a) {
      return a.context.commentFlagged ? 'disabled' : '';
    },
    '.commentActions .upRatings': function(a) {
      return (a.context.upRatings > 0) ? ('+' + a.context.upRatings) : '';
    },
    '.commentActions .downRatings': function(a) {
      return (a.context.downRatings > 0) ? ('-' + a.context.downRatings) : '';
    },
    '.commentActions .rateUp@class+': function(a) {
      return (!_.isUndefined(a.context.currentUserRating) &&
        a.context.currentUserRating.thumbUp === true) ? ' ratedUp' : '';
    },
    '.commentActions .rateDown@class+': function(a) {
      return (!_.isUndefined(a.context.currentUserRating) &&
        a.context.currentUserRating.thumbUp === false) ? ' ratedDown' : '';
    },
    '.commentActions@class+': function(a) {
      // if comment parent is a view, use MODERATE_COMMENTS right, else parent is a nominated dataset so use EDIT_NOMINATIONS
      var moderateRight = a.context.viewId ? blist.rights.user.MODERATE_COMMENTS : blist.rights.user.EDIT_NOMINATIONS;
      return _.compact([(_.get(a.context, 'user.id') == blist.currentUserId) ? 'ownItem' : null,
        ((!_.isUndefined(blist.currentUser) &&
          _.include(blist.currentUser.rights, moderateRight)) ? 'isModerator' : null)
      ]).join(' ');
    }
  };
  var customDirectives = {
    comment: commentDirective,
    reply: commentDirective,
    view: {
      '.viewDetails@class+': 'viewType',
      '.viewName': 'viewName!',
      '.viewName@href': 'viewPath',
      '.viewDescription': 'viewDescription!'
    }
  };

  var compiledCustomDirectives = {};
  $(function() {
    _.each(['comment', 'view', 'reply'], function(itemType) {
      compiledCustomDirectives[itemType] = $.compileTemplate('feedItem_' + itemType,
        customDirectives[itemType]);
    });
  });

  var getView = function(viewId, opts) {
    return _.detect(opts.views.concat(opts.mainView), function(v) {
      return v.id == viewId;
    });
  };

  $.fn.feedList = function(options) {
    var opts = $.extend({}, $.fn.feedList.defaults, options);

    // These directives are declared here because they need access to opts.
    var feedDirectiveBase = {
      '.@class+': function(a) {
        return _.compact([(opts.highlightCallback(a.item) ?
            a.item.itemType + ' specialFeedItem' : a.item.itemType),
          (a.item.itemDeleted ? 'itemDeleted' : null)
        ]).join(' ');
      },
      '.@data-itemId': 'feedItem.itemId',
      '.feedCommon@class+': 'feedItem.itemType',
      '.feedActor': 'feedItem.user.displayName!',
      '.feedActor@href': function(a) {
        return new User(a.item.user).getProfileUrl();
      },
      '.feedBody': 'feedItem.body!',
      '.feedTimestamp': function(a) {
        return blist.util.humaneDate.getFromDate(a.item.timestamp * 1000);
      },
      '.feedCustom': function(a) {
        var renderer = compiledCustomDirectives[a.item.itemType];
        return _.isFunction(renderer) ? renderer(a.item) : '';
      }
    };
    var compiledFeedDirectiveNest = $.compileTemplate('feedItem', {
      'li': {
        'feedItem<-': feedDirectiveBase
      }
    });

    var feedDirective = {
      'li': {
        'feedItem<-': $.extend({}, feedDirectiveBase, {
          '.@data-serialId': 'feedItem.serialId',
          '.feedChildren': function(a) {
            return _.isArray(a.item.children) ?
              compiledFeedDirectiveNest(a.item.children) : '';
          },
          '.feedChildren@class+': function(a) {
            return (_.isUndefined(a.item.children) ||
              (a.item.childCount === 0)) ? 'hide' : '';
          },
          '.replyViewAllLink': function(a) {
            return $.t('controls.feed.listing.all_replies_with_count', {
              count: a.item.childCount
            });
          },
          '.replyViewAllLink@class+': function(a) {
            return (_.isUndefined(a.item.children) ||
              (a.item.childCount <= opts.replyPageLimit)) ? 'hide' : '';
          }
        })
      }
    };

    // transform data to be more palatable
    var commentMap = function(comment, itemType) {
      return {
        itemType: itemType || 'comment',
        itemId: comment.id,
        body: _.compact([comment.title, comment.body]).join(' '),
        timestamp: comment.createdAt,
        downRatings: comment.downRatings,
        upRatings: comment.upRatings,
        currentUserRating: comment.currentUserRating,
        commentFlagged: _.include(comment.flags || [], 'flaggedByCurrentUser'),
        user: comment.user,
        viewId: (comment.view ? comment.view.id : null),
        children: _.isUndefined(comment.children) ? [] : _.map(comment.children, function(item) {
          return commentMap(item, 'reply');
        })
      };
    };
    var comments = _.map(_.reject(opts.comments,
        function(item) {
          return $.isBlank(item.title) &&
            $.isBlank(item.body);
        }),
      function(item) {
        return commentMap(item);
      });
    var views = _.map(opts.views, function(view) {
      return {
        itemType: 'view',
        itemId: view.id,
        body: $.t('controls.feed.listing.user_create_action', {
          thing: view.displayName
        }),
        timestamp: view.createdAt,
        viewName: view.name,
        viewType: 'type' + view.styleClass,
        viewPath: view.url,
        viewDescription: view.description,
        user: view.owner
      };
    });

    // combine and sort
    var allFeedData = comments.concat(views);
    allFeedData.sort(function(a, b) {
      return b.timestamp - a.timestamp;
    });

    var feedMap = {};
    var feedData = [];

    // trim and tag
    var feedDataMap = function(item) {
      if (!_.isUndefined(item.children)) {
        item.childCount = item.children.length;
        item.allChildren = item.children;
        item.children = item.allChildren.slice(0, opts.replyPageLimit);
      }

      item.serialId = _.uniqueId();
      feedMap[item.serialId] = item;
      return item;
    };
    allFeedData = _.map(allFeedData, feedDataMap) || [];

    return this.each(function() {
      var $this = $(this);
      var $feed = $this;
      var $scrollContainer = opts.$scrollContainer || $this.closest(opts.scrollContainerSelector);
      var $feedFilter = $this.find('.feedFilter');
      var $feedList = $this.find('.feedList');
      var $moreItemsButton = $this.find('.feedMoreItemsLink');
      var $moderationNotice = $this.find('.moderationNotice');

      // set up the filter dropdown
      if (!_.isArray(opts.filterCategories) || (opts.filterCategories.length === 0)) {
        $this.find('.feedFilterLine').hide();
      } else if ((opts.filterCategories.length === 1)) {
        // If the dropdown menu has only one item, then there is no need to have feedFilter
        // This should only happen if `remove_views_from_discuss_pane` feature flag is turned on
        // and the filterCategories contain only "comments" item.
        // We need to show a message that orients the users to the `more views` pane
        $this.find('.feedFilterLine').hide();
      } else {
        $feedFilter.empty().append($.tag(_.map(opts.filterCategories, function(category) {
          return {
            tagName: 'option',
            value: category,
            contents: $.t('controls.feed.types.' + category)
          };
        }), true)).val(opts.defaultFilter || _.first(opts.filterCategories));

        if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update)) {
          $.uniform.update($feedFilter);
        }
      }

      var filterItems = function(allow) {
        if (allow == 'all items') {
          return allFeedData;
        } else {
          var filterMap = {
            'view': 'views',
            'comment': 'comments',
            'replies': 'comments'
          };
          return _.select(allFeedData, function(item) {
            return filterMap[item.itemType] == allow;
          });
        }
      };

      var showMoreItems = function(fullReset) {
        var thisPageSize = opts.pageSize;
        if (fullReset) {
          // fullReset is synonymous with "load the first page"
          thisPageSize = opts.firstPageSize || opts.pageSize;
        }

        var itemsShown = $feedList.children().length;
        $feedList.append(
          $.renderTemplate('feedItem', feedData.slice(
            itemsShown, itemsShown + thisPageSize), feedDirective));

        var remainingItems = feedData.length - itemsShown - thisPageSize;
        $moreItemsButton.show();
        if (remainingItems <= 0)
          $moreItemsButton.hide();
        else if (remainingItems == 1)
          $moreItemsButton.text($.t('controls.feed.listing.last_item'));
        else
          $moreItemsButton.text($.t('controls.feed.listing.next_item_page', {
            count: Math.min(remainingItems, opts.pageSize)
          }));

        if (!fullReset) {
          $scrollContainer.animate({
            scrollTop: Math.min(
              // either the height of the appended elements,
              $this.outerHeight(true) - $scrollContainer.height(),
              // or the height of the scroll container.
              $scrollContainer.scrollTop() + $scrollContainer.height())
          }, 'slow');
        } else {
          $this.find('.noResults').toggleClass('hide', $feedList.children().length > 0);
        }
      };

      var newCommentAdded = function(comment, parComment) {
        var data = getData($feed);

        if ($.isBlank(data)) {
          return;
        }

        var newCommentData = feedDataMap(commentMap(comment));

        if (!$.subKeyDefined(parComment, 'id')) {
          // root comment; add the new comment to the front

          data.feedData.unshift(newCommentData);

          $feed.children('.feedList').prepend(
            $.renderTemplate('feedItem', [newCommentData], feedDirective));
        } else {
          var $parentComment = $feed.find('.feedItem[data-itemid="' + parComment.id + '"]');
          if ($parentComment.length < 1) {
            // this is a reply, but we don't have the parent, so bail
            return;
          }

          // reply; add the new comment to the reply
          newCommentData.itemType = 'reply';

          var parentCommentData = data.feedMap[getSerialId($parentComment)];
          parentCommentData.allChildren.unshift(newCommentData);
          parentCommentData.children.unshift(newCommentData);
          parentCommentData.children.splice(opts.replyPageLimit, 1);

          $parentComment.find('.feedChildren').
            removeClass('hide').
            prepend(compiledFeedDirectiveNest([newCommentData]));
        }

        $feed.find('.noResults').addClass('hide');
      };

      // local events
      $moreItemsButton.click(function(event) {
        event.preventDefault();
        showMoreItems();
      });

      $feedFilter.change(function() {
        // they're refiltering; remove all current items,
        // refilter, and show the first page.

        feedData = filterItems($(this).val());
        $feedList.empty();
        showMoreItems(true);
      });

      if (!opts.hideFeed) {
        // kick things off
        feedData = filterItems(opts.defaultFilter);
        showMoreItems(true);
      }


      // Store off what we need to hook up events later.
      $this.data('feedList-data', {
        feedData: feedData,
        feedMap: feedMap,
        opts: opts
      });

      // Expand visible comments
      $this.delegate('.replyViewAllLink', 'click', function(event) {
        event.preventDefault();
        $this = $(this);

        var data = getData($this);

        $this.siblings('.feedChildren').empty().append(
          compiledFeedDirectiveNest(data.feedMap[
            getSerialId($this)].allChildren));

        $this.remove();
      });

      if (!opts.hideFeed) {
        _.each(opts.views, function(ds) {
          ds.bind('new_comment', newCommentAdded);
        }, $this);
      } else {
        $feed.find('.feedList, .feedMoreItemsLink, .noResults').addClass('hide');
      }

      if (opts.bindCommentEvents === true) {
        // Any actions on the comment actions line goes here
        $this.delegate('.commentActions a', 'click', function(event) {
          event.preventDefault();
          $this = $(this);
          var data = getData($this);

          // Get the actual comment in question
          // TODO: This code won't work if we someday allow commenting
          // on arbitrary feed items, eg comment on a view or trackback
          var targetCommentData = data.feedMap[getSerialId($this, '.comment')];

          // If this is a reply to a comment, subindex into it
          var $reply = $this.closest('.feedItem.reply');
          if ($reply.length > 0) {
            var targetCommentId = parseInt($reply.attr('data-itemId'));
            targetCommentData = _.detect(targetCommentData.allChildren, function(reply) {
              return reply.itemId == targetCommentId;
            });
          }

          // Take action
          if ($this.is('.commentInappropriateLink:not(.disabled)')) {
            blist.util.doAuthedAction($.t('controls.feed.authed_actions.flag_comment'), function(successCallback) {
              opts.actionDelegate(targetCommentData, opts).flagComment(
                targetCommentData.itemId,
                function() {
                  targetCommentData.commentFlagged = true;
                  $this.fadeOut(function() {
                    $this.addClass('disabled').
                      text($.t('controls.feed.comment_actions.marked_inappropriate')).fadeIn();
                  });
                  if (_.isFunction(successCallback)) {
                    successCallback();
                  }
                }
              );
            });
          } else if ($this.is('.commentDeleteLink')) {
            blist.util.doAuthedAction($.t('controls.feed.authed_actions.delete_comment'), function(successCallback) {
              opts.actionDelegate(targetCommentData, opts).removeComment(
                targetCommentData.itemId,
                function() {
                  targetCommentData.itemDeleted = true;
                  $this.closest('.feedItem').animate({
                    opacity: 0.3
                  }, 2000);
                  if (_.isFunction(successCallback)) {
                    successCallback();
                  }
                }
              );
            });
          } else if ($this.is('.commentRateUpLink:not(.ratedUp)') ||
            $this.is('.commentRateDownLink:not(.ratedDown)')) {
            var thumbsUp = $this.hasClass('commentRateUpLink');
            blist.util.doAuthedAction($.t('controls.feed.authed_actions.rate_comment'), function(successCallback) {
              opts.actionDelegate(targetCommentData, opts).rateComment(
                targetCommentData.itemId, thumbsUp,
                function() {
                  var direction = thumbsUp ? 'up' : 'down';

                  // Update data structures in case we rerender
                  if (!_.isUndefined(targetCommentData.currentUserRating)) {
                    // The user has previously rated in the other direction
                    targetCommentData[(thumbsUp ? 'down' : 'up') + 'Ratings']--;
                    $this.closest('li').siblings().removeClass('ratedUp ratedDown');
                  }
                  targetCommentData.currentUserRating = {
                    thumbUp: thumbsUp
                  };
                  targetCommentData[direction + 'Ratings']++;

                  // Update UI
                  $this.closest('li').addClass('rated' + direction.capitalize());
                  _.each({
                    'up': '+',
                    'down': '-'
                  }, function(symbol, _direction) {
                    var text = symbol + targetCommentData[_direction + 'Ratings'];
                    if (targetCommentData[_direction + 'Ratings'] === 0) {
                      text = '';
                    }

                    $this.closest('li').siblings('.' + _direction + 'Ratings').text(text);
                  });

                  if (_.isFunction(successCallback)) {
                    successCallback();
                  }
                }
              );
            });
          } else if ($this.is('.commentReplyLink') &&
            ($this.closest('.feedItem').children('.newCommentForm').length === 0)) {
            var $newCom = $.renderTemplate('feedItem_newComment');
            $newCom.find('.postNewCommentButton').data('view', opts.actionDelegate(targetCommentData, opts));
            $this.closest('.feedItem').children('.feedChildren').before($newCom);
            $this.closest('.feedItem').find('#newCommentBody').focus();
          }
        });

        $this.delegate('.newCommentForm .cancelNewCommentButton', 'click', function(event) {
          event.preventDefault();
          $this = $(this);

          // either the field is already blank, or we confirm it's okay.
          if ($.isBlank($this.siblings('#newCommentBody').val()) ||
            confirm($.t('controls.feed.comment_actions.delete_confirm'))) {
            $this.closest('.newCommentForm').remove();
          }
        });

        $this.delegate('.newCommentForm .postNewCommentButton', 'click', function(event) {
          event.preventDefault();
          $this = $(this);

          var view = $this.data('view');

          var commentBody = $this.siblings('#newCommentBody').val();
          if (!$.isBlank(commentBody)) {
            $this.siblings('.error').slideUp();

            var commentData = $.extend({}, opts.commentCreateData, {
              body: commentBody
            });

            // See if this is a reply
            var parentCommentId = parseInt($this.closest('.feedItem').attr('data-itemId'));
            if (_.isNumber(parentCommentId) && !isNaN(parentCommentId)) {
              commentData.parent = {
                id: parentCommentId
              };
            }

            blist.util.doAuthedAction($.t('controls.feed.authed_actions.post_comment'), function(successCallback) {
              view.addComment(commentData,
                function(response) {
                  if (response.status == 'pending') {
                    $this.closest('.newCommentForm').remove();
                    $moderationNotice.fadeIn(300, function() {
                      $moderationNotice.effect('highlight', 5000);
                    });
                    return;
                  }

                  var newCommentData = feedDataMap(commentMap(response));

                  if (_.isFunction(opts.addCommentCallback)) {
                    opts.addCommentCallback(view, newCommentData);
                  }

                  $this.closest('.newCommentForm').remove();
                  if ((opts.alwaysShowNewCommentForm === true) &&
                    ($feed.find('.newCommentForm').length === 0)) {
                    createCommentForm($feed.find('.noResults'), opts.mainView);
                  }

                  if (_.isFunction(successCallback)) {
                    successCallback();
                  }
                },
                function(resp) {
                  $this.siblings('.error').slideDown().text(JSON.parse(resp.responseText).message);
                }
              );
            });
          } else {
            $this.siblings('.error').text($.t('controls.feed.comment_form.empty_body_error')).slideDown();
          }
        });

        $this.delegate('.feedNewCommentButton', 'click', function(event) {
          event.preventDefault();
          $this = $(this);

          if ($this.siblings('.newCommentForm').length === 0) {
            createCommentForm($this, getData($this).opts.mainView);
            $this.siblings('.newCommentForm').find('#newCommentBody').focus();
          }
        });

        var createCommentForm = function($after, mainView) {
          var $newCom = $.renderTemplate('feedItem_newComment');
          $newCom.find('.postNewCommentButton').data('view', mainView);
          $after.after($newCom);
        };

        if (opts.alwaysShowNewCommentForm === true) {
          createCommentForm($this.find('.noResults'), opts.mainView);
        }

        // disable certain features if the user is not logged in
        if (!blist.currentUserId) {
          $('.feedNewCommentButton, .postNewCommentButton').
            addClass('disabled').
            prop('disabled', true).
            socrataTip($.t('controls.feed.tooltips.add_comment_disabled'));
          $('.commentReplyLink').
            prop('disabled', true).
            socrataTip($.t('controls.feed.tooltips.add_comment_disabled'));
          $('.commentInappropriateLink').
            prop('disabled', true).
            socrataTip($.t('controls.feed.tooltips.flag_inappropriate_disabled'));
          $('.commentRateUpLink, .commentRateDownLink').
            prop('disabled', true).
            socrataTip($.t('controls.feed.tooltips.rate_comment_disabled'));
        }
      }
    });
  };

  var getData = function($elem) {
    return $elem.closest('.feed').data('feedList-data');
  };

  var getSerialId = function($elem, type) {
    return parseInt($elem.closest('.feedItem' + (type || '')).attr('data-serialId'));
  };

  // This method is part of a fix for the issue in ticket EN-5453
  // The strategy here is to remove views from the list of dropdown items in the discuss pane
  // For customers that have feature flag `remove_views_from_discuss_pane` set to true
  // This feature flag is false by default and will be turned on only for data.cityofnewyork.us
  // on feature flag rollback, getCategories function will always return ['all items', 'comments', 'views'];
  function getCategories() {
    var categories = ['all items', 'comments', 'views'];
    if (window.blist.feature_flags.remove_views_from_discuss_pane === true) {
      categories = ['comments'];
    }
    return categories;
  }

  $.fn.feedList.defaults = {
    addCommentCallback: function() {},
    actionDelegate: function(targetComment, opts) {
      return getView(targetComment.viewId, opts);
    },
    alwaysShowNewCommentForm: false,
    bindCommentEvents: true,
    commentCreateData: {},
    comments: [],
    defaultFilter: 'comments',
    filterCategories: getCategories(),
    hideFeed: false,
    highlightCallback: function(feedItem) {
      // by default highlight items that have to do with the blist owner
      return blist.dataset && ((feedItem.user || {}).id == blist.dataset.tableAuthor.id);
    },
    firstPageSize: null, // if not specified, defaults to pageSize
    mainView: null,
    pageSize: 20,
    replyPageLimit: 2,
    scrollContainerSelector: '.scrollContent',
    views: []
  };
})(jQuery);
