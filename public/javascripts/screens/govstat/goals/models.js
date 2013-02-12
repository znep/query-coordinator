;(function(){

// COLUMNPROXY
var ColumnProxy = Backbone.Model.extend({
    initialize: function(_, options)
    {
        this.datasetProxy = options.datasetProxy;

        this.acceptableTypes = options.acceptableTypes;

        this.listenTo(this.datasetProxy, 'change:id', function()
        {
            this.set('field_name', null);
        });
    },
    parse: function(response)
    {
        if (_.isString(response))
        {
            response = { field_name: response };
        }
        return response;
    },
    toJSON: function() { return this.get('field_name'); }
});

// DATASETPROXY

var DatasetProxy = Backbone.Model.extend({
	initialize: function(_, options)
	{
		if (options && !$.isBlank(options.dataset)) { this._dataset = options.dataset; }

        this.on('change:id', function() { this._dataset = null; });
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
        else if (!this.get('id'))
        {
            callback();
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

// INDICATOR

var numericTypes = [ 'number', 'percent', 'money', 'stars' ];
var Indicator = Backbone.Model.extend({
    model:
    {
        dataset: DatasetProxy
        // column 1 and 2 should both be columnproxies but we instantiate them manually below to link to datasetproxy
    },

    initialize: function(_, options)
    {
        this.indicatorType = options.indicatorType || 'baseline';

        if (!this.get('dataset')) { this.set('dataset', new DatasetProxy()); }

        var datasetProxy = this.get('dataset');
        this.set('column1', new ColumnProxy({ field_name: this.get('column1') },
                                            { datasetProxy: datasetProxy, acceptableTypes: numericTypes }));
        this.set('column2', new ColumnProxy({ field_name: this.get('column2') },
                                            { datasetProxy: datasetProxy, acceptableTypes: numericTypes }));
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
})

// METRIC

var Metric = Backbone.Model.extend({
    model:
    {
        current: Indicator,
        baseline: Indicator
    },

    initialize: function()
    {
        if (!this.get('current')) { this.set('current', new Indicator(null, { indicatorType: 'current' })) };
        if (!this.get('baseline')) { this.set('baseline', new Indicator(null, { indicatorType: 'baseline' })) };
    },
    parse: function(response)
    {
        if (!response.compute) { response.compute = {} };
        response.aggregation_function = response.compute.aggregation_function;
        response.column_function = response.compute.column_function;
        response.metric_period = response.compute.metric_period;
        delete response.compute;

        for (var key in this.model)
        {
            nestedClass = this.model[key];
            nestedData = response[key];
            response[key] = new nestedClass(nestedData, { parse: true });
        }

        return response;
    },
    toJSON: function()
    {
        var result = Backbone.Model.prototype.toJSON.call(this);
        result.compute = {
            aggregation_function: result.aggregation_function,
            column_function: result.column_function,
            metric_period: result.metric_period
        };
        delete result.aggregation_function;
        delete result.column_function;
        delete result.metric_period;
    }
});

var Metrics = Backbone.Collection.extend({
    model: Metric
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

// GOAL

var Goal = Backbone.Model.extend({
    model:
    {
        agencies: Agencies,
        related_datasets: DatasetsProxy,
        metrics: Metrics
    },
    urlRoot: '/api/govStatGoals',

    initialize: function()
    {
        if (!this.get('agencies')) { this.set('agencies', new Agencies()); }
        if (!this.get('related_datasets')) { this.set('related_datasets', new DatasetsProxy()); }
        if (!this.get('metrics')) { this.set('metrics', new Metrics()); }

        var metrics = this.get('metrics');
        if (metrics.length === 0) { metrics.add(new Metric()); }

        // prevailing metric gets goal comparison
        this.on('change:comparison', function(_, value)
        {
            var metrics = this.get('metrics');
            if (!metrics || metrics.length < 2) { return; } // something's wrong

            metrics.at(0).set('comparison', value);
        });
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
    },
    toJSON: function()
    {
        var model = this;
        var attrs = _.clone(model.attributes);
        _.each(_.keys(model.model), function(k) { attrs[k] = _.compact(model.attributes[k].toJSON()); });
        _.each(_.keys(attrs), function(k)
        {
            if (_.isArray(attrs[k]) && _.isEmpty(attrs[k]) || _.isNull(attrs[k]))
            { delete attrs[k]; }
        });
        _.each(['goal_delta'], function(k)
        { if (_.isString(attrs[k])) { attrs[k] = parseFloat(attrs[k]); } });
        return attrs;
    },
    sync: function(method, model, options)
    {
        options = options || {};
        options.url = (method == 'create' ? model.urlRoot : model.urlRoot + '/' + model.id) + '.json';

        Backbone.sync(method, model, options);
    }
});

var Goals = Backbone.Collection.extend({
    model: Goal,
    url: '/api/govStatGoals.json',

    initialize: function(__, options)
    {
        var self = this;

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

            this.listenTo(goal, 'removeFromAll', function() { this.remove(goal); });
        });
        this.on('remove', function(goal)
        {
            self.stopListening(goal);
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

        this.goals = new Goals([], { category: this });

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
    model: Category,
    url: '/api/govStatCategories.json',

    initialize: function(__, options)
    {
        var self = this;

        this.on('add', function(category)
        {
            this.listenTo(category, 'removeFromAll', function() { this.remove(category); });
        });
        this.on('remove', function(category)
        {
            self.stopListening(category);
        });
    }
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

