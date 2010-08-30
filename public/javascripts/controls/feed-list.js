;(function($)
{
    var eventsBound = false;

    var commentDirective = {
        '.commentActions .commentInappropriateLink':
            function(a) { return a.context.commentFlagged ? 'Flagged' : 'Inappropriate'; },
        '.commentActions .commentInappropriateLink@class+':
            function(a) { return a.context.commentFlagged ? 'disabled' : ''; },
        '.commentActions .upRatings':
            function(a) { return (a.context.upRatings > 0) ? ('+' + a.context.upRatings) : ''; },
        '.commentActions .downRatings':
            function(a) { return (a.context.downRatings > 0) ? ('-' + a.context.downRatings) : ''; },
        '.commentActions .rateUp@class+':
            function(a) { return (!_.isUndefined(a.context.currentUserRating) &&
                                       a.context.currentUserRating.thumbUp === true) ? ' ratedUp' : ''; },
        '.commentActions .rateDown@class+':
            function(a) { return (!_.isUndefined(a.context.currentUserRating) &&
                                      a.context.currentUserRating.thumbUp === false) ? ' ratedDown' : ''; },
        '.commentActions@class+':
            function(a) { return (a.context.user.id == blist.currentUserId) ? 'ownItem' : ''; }
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
    _.each(['comment', 'view', 'reply'], function(itemType)
    {
        compiledCustomDirectives[itemType] = $.compileTemplate('feedItem_' + itemType,
            customDirectives[itemType]);
    });

    var feedDirectiveBase = {
        '.@class+': 'feedItem.itemType',
        '.@data-itemId': 'feedItem.itemId',
        '.feedCommon@class+': 'feedItem.itemType',
        '.feedActor': 'feedItem.user.displayName!',
        '.feedActor@href': function(a) { return $.generateProfileUrl(a.item.user); },
        '.feedBody': 'feedItem.body!',
        '.feedTimestamp': function(a) { return blist.util.humaneDate.getFromDate(a.item.timestamp * 1000); },
        '.feedCustom': function(a)
        {
            var renderer = compiledCustomDirectives[a.item.itemType];
            return _.isFunction(renderer) ? renderer(a.item) : '';
        }
    };
    var compiledFeedDirectiveNest = $.compileTemplate('feedItem', {
        'li': {
            'feedItem<-': feedDirectiveBase
        }
    });

    $.fn.feedList = function(options)
    {
        var opts = $.extend({}, $.fn.feedList.defaults, options);

        var getView = function(viewId)
        {
            return _.detect(opts.views, function(v) { return v.id == viewId; });
        };

        // This directive is declared here because it needs access to opts.
        var feedDirective = {
            'li': {
                'feedItem<-': $.extend({}, feedDirectiveBase, {
                    '.@data-serialId': 'feedItem.serialId',
                    '.feedChildren': function(a)
                    {
                        return _.isArray(a.item.children) ?
                               compiledFeedDirectiveNest(a.item.children) : '';
                    },
                    '.feedChildren@class+': function(a)
                    { return (_.isUndefined(a.item.children) ||
                             (a.item.childCount === 0)) ? 'hide' : ''; },
                    '.replyViewAllLink': 'View all #{feedItem.childCount} replies',
                    '.replyViewAllLink@class+': function(a)
                    { return (_.isUndefined(a.item.children) ||
                             (a.item.childCount < opts.replyPageLimit)) ? 'hide' : ''; }
                })
            }
        };

        // transform data to be more palatable
        var commentMap = function(comment, itemType)
        {
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
                viewId: comment.view.id,
                children: _.isUndefined(comment.children) ? [] :
                    _.map(comment.children, function(item) { return commentMap(item, 'reply'); })
            };
        };
        var comments = _.map(_.reject(opts.comments,
            function(item) { return $.isBlank(item.title) &&
                                    $.isBlank(item.body); }),
            function(item) { return commentMap(item); });
        var views = _.map(opts.views, function(view)
        {
            return {
                itemType: 'view',
                itemId: view.id,
                body: 'created a ' + view.displayName + ':',
                timestamp: view.createdAt,
                viewName: view.name,
                viewType: 'type' + view.styleClass,
                viewPath: view.url,
                viewDescription: view.description,
                user: view.owner
            };
        });

        // combine and sort
        var feedData = comments.concat(views);
        feedData.sort(function(a, b) { return b.timestamp - a.timestamp; });

        var feedMap = {};

        // trim and tag
        var feedDataMap = function(item)
        {
            if (!_.isUndefined(item.children))
            {
                item.childCount = item.children.length;
                item.allChildren = item.children;
                item.children = item.allChildren.slice(0, opts.replyPageLimit);
            }

            item.serialId = _.uniqueId();
            feedMap[item.serialId] = item;
            return item;
        };
        feedData = _.map(feedData, feedDataMap);

        this.each(function()
        {
            var $this = $(this);
            var $scrollContainer = opts.$scrollContainer || $this.closest(opts.scrollContainerSelector);
            var $feedList = $this.find('.feedList');
            var $moreItemsButton = $this.find('.feedMoreItemsLink');

            var showMoreItems = function()
            {
                var itemsShown = $feedList.children().length;
                $feedList.append(
                    $.renderTemplate('feedItem', feedData.slice(
                        itemsShown, itemsShown + opts.pageSize), feedDirective));

                var remainingItems = feedData.length - itemsShown - opts.pageSize;
                if (remainingItems <= 0)
                    $moreItemsButton.remove();
                else if (remainingItems == 1)
                    $moreItemsButton.text('View last item');
                else
                    $moreItemsButton.text('View next ' +
                        Math.min(remainingItems, opts.pageSize) + ' items');

                $scrollContainer.animate({
                    scrollTop: Math.min(
                        // either the height of the appended elements,
                        $this.outerHeight(true) - $scrollContainer.height(),
                        // or the height of the scroll container.
                        $scrollContainer.scrollTop() + $scrollContainer.height())
                }, 'slow');
            };
            showMoreItems();
            $moreItemsButton.click(function(event)
            {
                event.preventDefault();
                showMoreItems();
            });

            // Store off what we need to hook up events later.
            $this.data('feedList-data', {
                feedData: feedData,
                feedMap: feedMap,
                opts: opts
            });

            // Since we're live-ing these events rather than binding them,
            // make sure that we only do it once for the page. We can figure
            // out context later. We don't want to bind due to perf.
            if (!eventsBound)
            {
                eventsBound = true;

                // Expand visible comments
                $.live('.feed .replyViewAllLink', 'click', function(event)
                {
                    event.preventDefault();
                    var $this = $(this);

                    var data = getData($this);

                    $this.siblings('.feedChildren').empty().append(
                        compiledFeedDirectiveNest(data.feedMap[
                        getSerialId($this)].allChildren));

                    $this.remove();
                });

                // Any actions on the comment actions line goes here
                $.live('.feed .commentActions a', 'click', function(event)
                {
                    event.preventDefault();
                    var $this = $(this);
                    var data = getData($this);

                    // Get the actual comment in question
                    // TODO: This code won't work if we someday allow commenting
                    // on arbitrary feed items, eg comment on a view or trackback
                    var targetCommentData = data.feedMap[getSerialId($this, '.comment')];

                    // If this is a reply to a comment, subindex into it
                    var $reply = $this.closest('.feedItem.reply');
                    if ($reply.length > 0)
                    {
                        var targetCommentId = parseInt($reply.attr('data-itemId'));
                        targetCommentData = _.detect(targetCommentData.allChildren, function(reply)
                        {
                            return reply.itemId == targetCommentId;
                        });
                    }

                    // Take action
                    if ($this.is('.commentInappropriateLink:not(.disabled)'))
                    {
                        blist.util.doAuthedAction('flag a comment', function()
                        {
                            getView(targetCommentData.viewId).flagComment(
                                targetCommentData.itemId,
                                function()
                                {
                                    targetCommentData.commentFlagged = true;
                                    $this.fadeOut(function()
                                    {
                                        $this.addClass('disabled')
                                            .text('Flagged!').fadeIn();
                                    });
                                }
                            );
                        });
                    }
                    else if ($this.is('.commentRateUpLink:not(.ratedUp)') ||
                             $this.is('.commentRateDownLink:not(.ratedDown)'))
                    {
                        var thumbsUp = $this.hasClass('commentRateUpLink');
                        blist.util.doAuthedAction('rate a comment', function()
                        {
                            getView(targetCommentData.viewId).rateComment(
                                targetCommentData.itemId, thumbsUp,
                                function()
                                {
                                    var direction = thumbsUp ? 'up' : 'down';

                                    // Update data structures in case we rerender
                                    if (!_.isUndefined(targetCommentData.currentUserRating))
                                    {
                                        // The user has previously rated in the other direction
                                        targetCommentData[(thumbsUp ? 'down' : 'up') + 'Ratings']--;
                                        $this.closest('li').siblings().removeClass('ratedUp ratedDown');
                                    }
                                    targetCommentData.currentUserRating = { thumbUp: thumbsUp };
                                    targetCommentData[direction + 'Ratings']++;

                                    // Update UI
                                    $this.closest('li').addClass('rated' + direction.capitalize());
                                    _.each({'up': '+', 'down': '-'}, function(symbol, direction)
                                    {
                                        var text = symbol + targetCommentData[direction + 'Ratings'];
                                        if (targetCommentData[direction + 'Ratings'] === 0)
                                        {
                                            text = '';
                                        }

                                        $this.closest('li').siblings('.' + direction + 'Ratings').text(text);
                                    });
                                }
                            );
                        });
                    }
                    else if ($this.is('.commentReplyLink') &&
                        ($this.closest('.feedItem').children('.newCommentForm').length === 0))
                    {
                        var $newCom = $.renderTemplate('feedItem_newComment');
                        $newCom.find('.postNewCommentButton')
                            .data('view', getView(targetCommentData.viewId));
                        $this.closest('.feedItem').children('.feedChildren')
                            .before($newCom);
                        $this.closest('.feedItem').find('#newCommentBody').focus();
                    }
                });

                $.live('.newCommentForm .cancelNewCommentButton', 'click', function(event)
                {
                    event.preventDefault();
                    var $this = $(this);

                    // either the field is already blank, or we confirm it's okay.
                    if ($.isBlank($this.siblings('#newCommentBody').val()) ||
                        confirm('Are you sure? Your comment will be lost.'))
                    {
                        $this.closest('.newCommentForm').remove();
                    }
                });

                $.live('.newCommentForm .postNewCommentButton', 'click', function(event)
                {
                    event.preventDefault();
                    var $this = $(this);

                    var view = $this.data('view');

                    var commentBody = $this.siblings('#newCommentBody').val();
                    if (!$.isBlank(commentBody))
                    {
                        $this.siblings('.error').slideUp();

                        var commentData = { body: commentBody };

                        // See if this is a reply
                        var parentCommentId = parseInt($this.closest('.feedItem').attr('data-itemId'));
                        if (_.isNumber(parentCommentId) && !isNaN(parentCommentId))
                        {
                            commentData.parent = { id: parentCommentId };
                        }

                        blist.util.doAuthedAction('post a comment', function()
                        {
                            view.addComment(commentData,
                                function(response)
                                {
                                    var data = getData($this);

                                    var newCommentData = feedDataMap(commentMap(response));

                                    var $parentComment = $this.closest('.feedItem');
                                    if ($parentComment.length === 0)
                                    {
                                        // root comment; add the new comment to the front

                                        data.feedData.unshift(newCommentData);

                                        $this.closest('.feed').children('.feedList').prepend(
                                            $.renderTemplate('feedItem', [newCommentData], feedDirective));
                                    }
                                    else
                                    {
                                        // reply; add the new comment to the reply
                                        newCommentData.itemType = 'reply';

                                        var parentCommentData = data.feedMap[getSerialId($parentComment)];
                                        parentCommentData.allChildren.unshift(newCommentData);
                                        parentCommentData.children.unshift(newCommentData);
                                        parentCommentData.children.splice(opts.replyPageLimit, 1);

                                        $this.closest('.newCommentForm')
                                            .siblings('.feedChildren')
                                                .removeClass('hide')
                                                .prepend(compiledFeedDirectiveNest([newCommentData]));
                                    }

                                    $('#gridSidebar_about .numberOfComments').text(
                                        parseInt($.trim($('#gridSidebar_about .numberOfComments').text())) + 1);
                                    $this.closest('.newCommentForm').remove();
                                }
                            );
                        });
                    }
                    else
                    {
                        $this.siblings('.error')
                            .text('The comment body cannot be empty.').slideDown();
                    }
                });

                $.live('.feedNewCommentButton', 'click', function(event)
                {
                    event.preventDefault();
                    var $this = $(this);

                    if ($this.siblings('.newCommentForm').length === 0)
                    {
                        var $newCom = $.renderTemplate('feedItem_newComment');
                        $newCom.find('.postNewCommentButton')
                            .data('view', getData($this).opts.mainView);
                        $this.after($newCom);
                        $this.siblings('.newCommentForm').find('#newCommentBody').focus();
                    }
                });
            }
        });
    };

    var getData = function($elem)
    {
        return $elem.closest('.feed').data('feedList-data');
    };

    var getSerialId = function($elem, type)
    {
        return parseInt($elem.closest('.feedItem' + (type || '')).attr('data-serialId'));
    };

    $.fn.feedList.defaults = {
        comments: [],
        mainView: null,
        pageSize: 20,
        replyPageLimit: 2,
        scrollContainerSelector: '.scrollContent',
        views: []
    };
})(jQuery);
