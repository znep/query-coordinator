
// govstatNS.js -- ms stat

$(function()
{
    var govstatNS = blist.namespace.fetch('blist.govstat');

// ELEMENT CACHING
    var $categoryContainer = $('.categoryContainer');
    var $draft = $('.draftGoals');


    var stdCallbacks = { success: statusFinished, error: statusError };

// MODELS

    var goals = new govstatNS.collections.Goals();
    var draftGoals = new govstatNS.collections.Goals([], { draft: true });
    var rawGoalsByCategory;
    var categories = new govstatNS.collections.Categories();

    // populate category goals
    var categorizeGoals = _.after(2, function()
    {
        categories.each(function(category)
        {
            var catId = category.id;
            if (rawGoalsByCategory[catId])
            {
                category.goals.add(rawGoalsByCategory[catId]);
                delete rawGoalsByCategory[catId];
            }
        });
        // Handle orphaned goals
        _.each(rawGoalsByCategory, function(catId)
        { draftGoals.add(rawGoalsByCategory[catId]); });
    });

    var hookUpGoal = function(goal)
    {
        goal.on('change:category', function()
        {
            statusWorking();
            goal.save(null, stdCallbacks);
        });
        goal.on('removeFromAll', function()
        {
            statusWorking();
            goal.destroy(stdCallbacks);
        });
    };

    // goals
    goals.fetch({update: true, success: function()
    {
        // listen for Goal events to update the server
        goals.each(hookUpGoal);

        // split out goals
        rawGoalsByCategory = goals.groupBy(function(goal)
        {
            return (goal.get('category') === '' || goal.get('category') == null) ? '__draft' : goal.get('category');
        });
        draftGoals.add(rawGoalsByCategory.__draft);
        delete rawGoalsByCategory.__draft;

        // render draft goals
        var draftGoalsView = new govstatNS.views.goals.GoalList({
            collection: draftGoals,
            instanceView: govstatNS.views.goal.GoalCard
        });
        $draft.prepend(draftGoalsView.$el);
        draftGoalsView.render();

        categorizeGoals();
    },
    error: function(__, xhr)
    { }});

    var hookUpCategory = function(category)
    {
        category.on('change:name', function()
        {
            statusWorking();
            category.save(null, stdCallbacks);
        });
        category.on('removeFromAll', function()
        {
            if ($.subKeyDefined(category, 'goals'))
            {
                category.goals.each(function(goal)
                { draftGoals.add(goal); });
            }
            statusWorking();
            category.destroy(stdCallbacks);
        });
    };

    // categories
    categories.fetch({update: true, success: function()
    {
        // now listen for appropriate Category events so we can update the server
        categories.each(hookUpCategory);

        // render categories
        categoriesView = new govstatNS.views.categories.CategoryList({
            collection: categories,
            instanceView: govstatNS.views.category.CategoryPane
        });
        $categoryContainer.append(categoriesView.$el);
        categoriesView.render();

        categorizeGoals();
    },
    error: function(__, xhr)
    {}});
    categories.on('invalid', function() { console.error('invalid!'); });


// INTERFACE

    // deal with new goal/new category
    $('.addNewItem a').on('click', function(event)
    {
        event.preventDefault();

        // add to drafts
        var newGoal = new govstatNS.models.Goal();
        draftGoals.add(newGoal);

        // show editor by default
        govstatNS.views.goal.GoalEditor.showDialog(newGoal);

        hookUpGoal(newGoal);
    });

    $('.addCategory').on('click', function(event)
    {
        event.preventDefault();

        var newCat = new govstatNS.models.Category({}, { parentCollection: categories });
        // add to final
        categories.add(newCat);
        $(document).scrollTop($('.categoryItem:first').outerHeight(true));

        hookUpCategory(newCat);
    });

    // deal with save

    // save individual goal
    $(document).on('click', '.goalEditor .actions .saveGoal', function(event)
    {
        event.preventDefault();
        var goal = $(this).closest('.goalEditor').data('backboneModel');
        statusWorking();
        goal.save(null, stdCallbacks);
    });

    var $statusIndicator = $.tag2({ _: 'div', className: 'globalStatusIndicator',
        contents: [
            { _: 'span', className: ['icon', 'waiting', 'ss-loading'] },
            { _: 'span', className: ['icon', 'good', 'ss-check'] },
            { _: 'span', className: ['icon', 'bad', 'ss-delete'] },
            { _: 'span', className: 'message' }
        ]
    });
    var curState = '';
    $('body').append($statusIndicator);
    function showStatus(state, message, timeout)
    {
        $statusIndicator.removeClass('state-' + curState)
            .addClass('state-' + state).addClass('shown')
            .find('.message').text(message);
        curState = state;
        if (_.isNumber(timeout))
        { setTimeout(hideStatus, timeout); }
    };

    function hideStatus()
    {
        $statusIndicator.removeClass('shown');
    };

    function statusWorking()
    { showStatus('waiting', 'Saving...'); };
    function statusFinished()
    { showStatus('good', 'Saved', 4000); };
    function statusError()
    { showStatus('bad', 'Error'); };
});

