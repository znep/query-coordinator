;(function($)
{
    var eventsBound = false;

    var commentDirective = {
        '.commentActions .positiveRatings':
            function(a) { return (a.context.upRatings > 0) ? ('+' + a.context.upRatings) : ''; },
        '.commentActions .negativeRatings':
            function(a) { return (a.context.downRatings > 0) ? ('-' + a.context.downRatings) : ''; },
        '.commentActions .rateUp@class+':
            function(a) { return (!_.isUndefined(a.context.currentUserRating) &&
                                       a.context.currentUserRating.thumbUp === true) ? ' ratedUp' : ''; },
        '.commentActions .rateDown@class+':
           function(a) { return (!_.isUndefined(a.context.currentUserRating) &&
                                      a.context.currentUserRating.thumbUp === false) ? ' ratedDown' : ''; }
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
            'feedItem<-': $.extend({}, feedDirectiveBase, {
                
            })
        }
    });
    var feedDirective = {
        'li': {
            'feedItem<-': $.extend({}, feedDirectiveBase, {
                '.feedChildren': function(a)
                {
                    return _.isArray(a.item.children) ? compiledFeedDirectiveNest(a.item.children) : '';
                },
                '.feedChildren@class+': function(a)
                { return( _.isUndefined(a) || (a.item.childCount === 0)) ? 'hide' : ''; },
                '.replyViewAllLink': 'View all #{feedItem.childCount} replies',
                '.replyViewAllLink@data-itemId': 'feedItem.serialId',
                '.replyViewAllLink@class+': function(a)
                { return (_.isUndefined(a) || (a.item.childCount < 4)) ? 'hide' : ''; } //TODO
            })
        }
    };

    $.fn.feedList = function(options)
    {
        var opts = $.extend({}, $.fn.feedList.defaults, options);

        // transform data to be more palatable
        var commentMap = function(comment, itemType)
        {
            return {
                itemType: itemType || 'comment',
                commentId: comment.id,
                body: _.compact([comment.title, comment.body]).join(' '),
                timestamp: comment.createdAt,
                downRatings: comment.downRatings,
                upRatings: comment.upRatings,
                user: comment.user,
                children: _.isUndefined(comment.children) ? [] :
                    _.map(comment.children, function(item) { return commentMap(item, 'reply'); })
            };
        };
        var comments = _.map(opts.comments, function(item) { return commentMap(item); });
        var views = _.map(opts.views, function(view)
        {
            return {
                itemType: 'view',
                viewId: view.id,
                body: 'created a ' + blist.dataset.getTypeName(view) + ':',
                timestamp: view.createdAt,
                viewName: view.name,
                viewType: 'type' + blist.dataset.getDisplayType(view),
                viewPath: $.generateViewUrl(view),
                viewDescription: view.description,
                user: view.owner
            };
        });

        // combine and sort
        var feedData = comments.concat(views)
        feedData.sort(function(a, b) { return b.timestamp - a.timestamp; });

        // trim and tag
        var i = 0;
        feedData = _.map(feedData, function(item)
        {
            if (!_.isUndefined(item.children))
            {
                item.childCount = item.children.length;
                item.allChildren = item.children;
                item.children = item.allChildren.slice(0, opts.replyPageLimit);
            }

            item.serialId = i++;
            return item;
        });

        this.each(function()
        {
            var $this = $(this);
            var $feedList = $this.find('.feedList');

            var $moreItemsButton = $.tag({
                tagName: 'a', 'class': 'feedMoreItemsLink',
                contents: ['View next ', opts.pageSize, ' items']
            });
            $this.append($moreItemsButton);

            var itemsShown = 0;
            var showMoreItems = function()
            {
                $feedList.append(
                    $.renderTemplate('feedItem', feedData.slice(
                        itemsShown, itemsShown + opts.pageSize), feedDirective));

                itemsShown += opts.pageSize;

                var remainingItems = feedData.length - itemsShown;
                if (remainingItems <= 0)
                    $moreItemsButton.remove();
                else if (remainingItems == 1)
                    $moreItemsButton.text('View last item');
                else
                    $moreItemsButton.text('View next ' +
                        Math.min(remainingItems, opts.pageSize) + ' items');
            };
            showMoreItems();
            $moreItemsButton.click(function(event)
            {
                event.preventDefault();
                showMoreItems();
            });

            // Since we're live-ing these events rather than binding them,
            // make sure that we only do it once for the page. We can figure
            // out context later. We don't want to bind due to perf.
            if (!eventsBound)
            {
                
            }
        });
    };

    $.fn.feedList.defaults = {
        comments: [],
        pageSize: 20,
        replyPageLimit: 2,
        views: []
    };
})(jQuery);