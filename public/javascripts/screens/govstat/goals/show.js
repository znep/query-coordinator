
// govstatNS.js -- ms stat

$(function()
{
    var govstatNS = blist.namespace.fetch('blist.govstat');

// ELEMENT CACHING
    var $categoryContainer = $('.categoryContainer');
    var $draft = $('.draftGoals');


// MODELS

    var goals = new govstatNS.collections.Goals();
    var goalsPendingDelete = new govstatNS.collections.Goals();
    var draftGoals = new govstatNS.collections.Goals([], { draft: true });
    var rawGoalsByCategory;
    var categories = new govstatNS.collections.Categories();
    var categoriesPendingDelete = new govstatNS.collections.Categories();

    // populate category goals
    var categorizeGoals = _.after(2, function()
    {
        categories.each(function(category)
        {
            var catId = category.id;
            if (rawGoalsByCategory[catId])
            {
                category.goals.add(rawGoalsByCategory[catId]);
            }
        });
    });

    // goals
    goals.fetch({update: true, success: function()
    {
        // first listen for removeFromAll Goal so we can put it in the delete queue
        // don't need to listen to new goals; they don't exist on the server anyway
        goals.each(function(goal)
        {
            goal.on('removeFromAll', function() { goalsPendingDelete.add(goal); });
        });

        // split out goals
        rawGoalsByCategory = goals.groupBy(function(goal)
        {
            return (goal.get('is_public') !== true) ? '__draft' : goal.get('category');
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

    // categories
    categories.fetch({update: true, success: function()
    {
        // now listen for removeFromAll Category so we can move its goals to draftGoals
        categories.each(function(category)
        {
            category.on('removeFromAll', function()
            {
                categoriesPendingDelete.add(category);
                if ($.subKeyDefined(category, 'goals'))
                {
                    category.goals.each(function(goal)
                    { draftGoals.add(goal); });
                }
            });
        });

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
    });

    $('.addCategory').on('click', function(event)
    {
       event.preventDefault();

       // add to final
       categories.add(new govstatNS.models.Category({}, { parentCollection: categories }));
       $(document).scrollTop($(document).scrollHeight());
    });

    // deal with save
    $('.saveAll').on('click', function(event)
    {
        event.preventDefault();
        goalsPendingDelete.each(function(goal)
        { goal.destroy(); });
        var categoriesSaved = _.after(categories.length, function()
        {
            categories.each(function(category)
            {
                category.goals.each(function(goal) { goal.save(); });
            });
        });
        categories.each(function(category)
        { category.save(null, { success: function() { categoriesSaved(); } }); });
        draftGoals.each(function(goal) { goal.save(); });
        categoriesPendingDelete.each(function(category)
        { category.destroy(); });
    });

});

