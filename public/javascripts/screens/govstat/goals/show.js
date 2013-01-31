
// govstatNS.js -- ms stat

$(function()
{
	var govstatNS = blist.namespace.fetch('blist.govstat');

// ELEMENT CACHING
    var $config = $('.config');
    var $configWrapper = $('.config .configWrapper');
    var $draft = $('.config .draft');
    var $final = $('.config .final');

    // pagewide handlers
    var handleResize = function()
    {
        $configWrapper.height(Math.max($(window).height() * 0.8, 400));
    };
    handleResize();
    $(window).resize(handleResize);


// MODELS
// dummy data for now

    // goals
    var goals = new govstatNS.collections.Goals([{
        id: '1234-5678',
        name: 'Thefts',
        category: null,
        agency: [],
        metrics: [],
        related_datasets: [ 'bqab-tjmv' ],
        start_date: null,
        end_date: '2012-12-03',
        required_change: null,
        is_public: false,
        comparison: '<'
    }, {
        id: 'abcd-5678',
        name: 'Potholes',
        category: null,
        agency: [],
        metrics: [],
        related_datasets: [],
        start_date: null,
        end_date: null,
        required_change: null,
        is_public: false,
        comparison: '>'
    }, {
        id: '1234-efgh',
        name: 'Hungry Kids',
        category: 'Opportunity',
        agency: [],
        metrics: [],
        related_datasets: [],
        start_date: null,
        end_date: null,
        required_change: null,
        is_public: true,
        comparison: '<'
    }], { parse: true });

    // first listen for removeFromAll Goal so we can put it in the delete queue
    var goalsPendingDelete = new govstatNS.collections.Goals([], {});
    goals.each(function(goal)
    {
        goal.on('removeFromAll', function() { goalsPendingDelete.add(goal); });
    });

    // split out goals
    var rawGoalsByCategory = goals.groupBy(function(goal)
    {
        return (goal.get('is_public') !== true) ? '__draft' : goal.get('category');
    });
    var draftGoals = new govstatNS.collections.Goals([], { draft: true });
    draftGoals.add(rawGoalsByCategory.__draft);
    delete rawGoalsByCategory.__draft;

    // categories
    var categories = new govstatNS.collections.Categories([], { parse: true });
    categories.add([{ name: 'Opportunity' }, { name: 'Security' }, { name: 'Sustainability' }, { name: 'Health' }]);
    categories.on('invalid', function() { console.error('invalid!'); });

    // now listen for removeFromAll Category so we can move its goals to draftGoals
    categories.on('remove', function(category)
    {
        category.goals.each(function(goal)
        {
            draftGoals.add(goal);
        });
    });


// INTERFACE
    // power tabswitch interface
    var currentTabIdx = 0;
    var $chooser = $('.configControl .chooser');
    var highlightTab = function(idx)
    {
        if (currentTabIdx === idx) { return; }
        currentTabIdx = idx;

        $chooser.children(':nth-child(' + (idx + 1) + ')')
            .addClass('active')
            .siblings().removeClass('active');

        targetPct = -70 * idx;
        $configWrapper.stop()
            .animate({ marginLeft: targetPct + '%' }, 600);
    };
    $chooser.children().on('click', function()
    {
        highlightTab($(this).prevAll().length);
    });

    // render draft goals
    var draftGoalsView = new govstatNS.views.goals.GoalList({
        collection: draftGoals,
        instanceView: govstatNS.views.goal.GoalCard
    });
    $draft.prepend(draftGoalsView.$el);
    draftGoalsView.render();

    // render categories
    categoriesView = new govstatNS.views.categories.CategoryList({
        collection: categories,
        instanceView: govstatNS.views.category.CategoryPane
    });
    $final.prepend(categoriesView.$el);
    categoriesView.render();

    // populate category goals
    categories.each(function(category)
    {
        var name = category.get('name');
        if (rawGoalsByCategory[name])
        {
            category.goals.add(rawGoalsByCategory[name]);
        }
    });


    // deal with new goal/new category
    $('.newGoal').on('click', function(event)
    {
        event.preventDefault();

        // add to drafts
        var newGoal = new govstatNS.models.Goal();
        draftGoals.add(newGoal);

        // show editor by default
        govstatNS.views.goal.GoalEditor.showDialog(newGoal);
    });

    $('.newCategory').on('click', function(event)
    {
       event.preventDefault();

       // add to final
       categories.add(new govstatNS.models.Category());
    });


    // deal with config drag events

    // copied + adapted from awesomereorder
        var scrollMargin = 40;
        var scrollSpeed = 25;
        var scrollCurve = 3;
        var scrollTimer, currentScrollSpeed, lastPosition, isScrolling = false;
        var borderWidth = function($elem, direction)
        {
            return parseInt($elem.css('border-' + direction + '-width'));
        };
        var setScroll = function(callback)
        {
            if (!isScrolling)
            {
                clearInterval(scrollTimer);
                scrollTimer = setInterval(callback, 10);
                isScrolling = true;
            }
        };
        var checkScroll = function($scrollParent, position)
        {
            var scrollParentOffset = $scrollParent.offset();
            var scrollParentBorderTop = borderWidth($scrollParent, 'top');
            var scrollParentBorderBottom = borderWidth($scrollParent, 'bottom');

            if (position.top < (scrollParentOffset.top + scrollMargin))
            {
                currentScrollSpeed = scrollSpeed *
                                     Math.min(Math.pow((scrollParentOffset.top + scrollMargin +
                                             scrollParentBorderTop - position.top) /
                                         scrollMargin, scrollCurve), 1);
                setScroll(function()
                {
                    $scrollParent.scrollTop($scrollParent.scrollTop() - currentScrollSpeed);
                });
            }
            else if ((position.top - scrollParentBorderTop) >
                         (scrollParentOffset.top + $scrollParent.outerHeight(false) -
                          scrollParentBorderBottom - scrollMargin))
            {
                currentScrollSpeed = scrollSpeed *
                                     Math.min(Math.pow((position.top - scrollParentBorderTop -
                                             (scrollParentOffset.top + $scrollParent.outerHeight(false) -
                                              scrollParentBorderBottom - scrollMargin)) /
                                         scrollMargin, scrollCurve), 1);
                setScroll(function()
                {
                    $scrollParent.scrollTop($scrollParent.scrollTop() + currentScrollSpeed);
                });
            }
            else
            {
                isScrolling = false;
                clearInterval(scrollTimer);
            }

            lastPosition = position;
        };
    // /awesomereorder

    var hoverTimer = null;
    var hoverIdx = null;

    $(document).on('mousemove', function(event)
    {
        if (!$config.hasClass('isDragging')) { return; }

        // figure out which child we're hovered over
        var newHoverIdx = Math.floor((event.pageX - $draft.position().left) / $draft.width());
        newHoverIdx = $.clamp(newHoverIdx, [ 0, $configWrapper.children().length - 1 ]);

        // if we've changed hover targets we should deal with it
        if (newHoverIdx !== hoverIdx)
        {
            if (newHoverIdx === currentTabIdx)
            {
                if (hoverTimer != null)
                {
                    window.clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
            }
            else
            {
                hoverTimer = window.setTimeout(function()
                {
                    highlightTab(newHoverIdx);
                    hoverTimer = null;
                }, 250);
            }

            // always clear scroll int, since elem has changed
            isScrolling = false;
            clearInterval(scrollTimer);
        }
        hoverIdx = newHoverIdx;

        // always call checkscroll for the current elem
        checkScroll($configWrapper.children(':nth-child(' + (hoverIdx + 1) + ')'), { top: event.pageY, left: event.pageX });
    });

});

