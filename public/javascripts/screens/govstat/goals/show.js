
// govstat.js -- ms stat

$(function()
{
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
    var goals = new govstat.collections.Goals([{
        id: '1234-5678',
        name: 'Thefts',
        category: null,
        agency: [],
        metrics: [],
        related_datasets: [],
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

    // split out goals
    var rawGoalsByCategory = goals.groupBy(function(goal)
    {
        return (goal.get('is_public') !== true) ? '__draft' : goal.get('category');
    });
    //_.each(goalsByCategory, function(v, k) { goalsByCategory[k] = new govstat.collections.Goals(v); });
    var draftGoals = new govstat.collections.Goals(rawGoalsByCategory.__draft || [], { draft: true });
    delete rawGoalsByCategory.__draft;

    // categories
    var categories = new govstat.collections.Categories([{ name: 'Opportunity' }, { name: 'Security' }, { name: 'Sustainability' }, { name: 'Health' }], { parse: true });
    categories.on('invalid', function() { debugger; });

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
    var draftGoalsView = new govstat.views.goals.GoalList({
        collection: draftGoals,
        instanceView: govstat.views.goal.GoalCard
    });
    $draft.prepend(draftGoalsView.el);
    draftGoalsView.render();

    // render categories
    categoriesView = new govstat.views.categories.CategoryList({
        collection: categories,
        instanceView: govstat.views.category.CategoryPane
    });
    $final.prepend(categoriesView.$el);
    categoriesView.render();

    // render category goals
    goalsByCategory = {};
    categoriesView.$el.children().each(function()
    {
        var $this = $(this);
        goalsByCategory[$this.data('category')] = $this.data('goals');
    });

    _.each(rawGoalsByCategory, function(goals, category)
    {
        goalsByCategory[category].add(goals);
    });


    // deal with new goal/new category
    $('.newGoal.button').on('click', function(event)
    {
        event.preventDefault();

        // add to drafts
        var newGoal = new govstat.models.Goal();
        draftGoals.add(newGoal);

        // show editor by default
        govstat.views.goal.GoalEditor.showDialog(newGoal);
    });

    $('.newCategory.button').on('click', function(event)
    {
       event.preventDefault();

       // add to final
       categories.add(new govstat.models.Category());
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
        var util = { clamp: function(n, min, max) { return n < min ? min : n > max ? max : n } }; // TODO: remove
        newHoverIdx = util.clamp(newHoverIdx, 0, $configWrapper.children().length - 1);

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

