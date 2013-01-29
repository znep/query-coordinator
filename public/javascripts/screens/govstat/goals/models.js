;(function(){

// METRIC
var Metric = Backbone.Model.extend({

});

// AGENCY

var Agency = Backbone.Model.extend({
    parse: function(response)
    {
        if (_.isString(response))
        {
			response = { name: response };
        }
		return response;
    },
    toJSON: function() { return this.get('name'); }
});

var Agencies = Backbone.Collection.extend({
    model: Agency
});

// DATASETPROXY

var DatasetProxy = Backbone.Model.extend({
	initialize: function(_, options)
	{
		if (!$.isBlank(options.dataset)) { this._dataset = options.dataset; }
	},
	parse: function(response)
	{
		if (_.isString(response))
		{
			response = { id: response };
		}
		return response;
	},
	getDataset: function(callback)
	{
		// not super happy with this; in backbone parlance it would seem more
		// correct to bind to a 'hydrate' event and handle the dry case on the
		// consumer side. but, this seems simpler and more in line with what we
		// already do.
		if (!$.isBlank(this._dataset))
		{
			callback(this._dataset);
		}
		else
		{
			Dataset.createFromViewId(this.get('id'), callback);
		}
	},
	toJSON: function() { return this.get('id'); }
});

var DatasetsProxy = Backbone.Collection.extend({
	model: DatasetProxy
});

// GOAL

var Goal = Backbone.Model.extend({
    model:
    {
        metric: Metric,
        agency: Agencies,
		related_datasets: DatasetsProxy
    },

    initialize: function()
    {
        if (!this.get('agency'))
        {
            this.set('agency', new Agencies());
        }
    },
    parse: function(response)
    {
        for (var key in this.model)
        {
            nestedClass = this.model[key];
            nestedData = response[key];
            response[key] = new nestedClass(nestedData, { parse: true });
        }
        return response;
    }
});

var Goals = Backbone.Collection.extend({
    model: Goal,

    initialize: function(_, options)
    {
        this.on('add', function(goal)
        {
            if (options.category instanceof Category)
            {
                goal.set('category', options.category.get('name'));
                goal.set('is_public', true);
            }
            else if (options.draft === true)
            {
				goal.set('category', null);
                goal.set('is_public', false);
            }
        });
    }
});

// CATEGORY

var Category = Backbone.Model.extend({
    initialize: function()
    {
        if (!this.get('color'))
        {
            this.set('color', Category.getColor());
        }

        this.on('add', function(_, collection)
        {
            this.collection = collection;
        });
    }
});


var categoryColors = [ '#0b2850', '#320d1f', '#8f0f2f', '#be2327', '#eb702a' ];
var lastColor = 0;
Category.getColor = function()
{
    return categoryColors[lastColor++ % categoryColors.length];
}

var Categories = Backbone.Collection.extend({
    model: Category
});

// EXPORT

$.extend(blist.namespace.fetch('blist.govstat'), {
    collections:
    {
        Categories: Categories,
        Goals: Goals,
        Agencies: Agencies,
		DatasetsProxy: DatasetsProxy
    },
    models:
    {
        Category: Category,
        Goal: Goal,
        Metric: Metric,
        Agency: Agency,
		DatasetProxy: DatasetProxy
    }
});

})();

