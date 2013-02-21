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
        this.set('date_column', new ColumnProxy({ field_name: this.get('date_column') },
                                            { datasetProxy: datasetProxy, acceptableTypes: 'calendar_date' }));
        this.set('column1', new ColumnProxy({ field_name: this.get('column1') },
                                            { datasetProxy: datasetProxy, acceptableTypes: numericTypes }));
        this.set('column2', new ColumnProxy({ field_name: this.get('column2') },
                                            { datasetProxy: datasetProxy, acceptableTypes: numericTypes }));
    },
    isComplete: function()
    {
        var js = this.toJSON();
        var res = !$.isBlank(js.compute_function.column_function) &&
            !$.isBlank(js.compute_function.aggregation_function) &&
            !$.isBlank(js.dataset) && !$.isBlank(js.column1) && !$.isBlank(js.date_column) &&
            (this.indicatorType != 'baseline' || !$.isBlank(js.start_date) && !$.isBlank(js.end_date));
        return res;
    },
    parse: function(response)
    {
        for (var key in this.model)
        {
            nestedClass = this.model[key];
            nestedData = response[key];
            response[key] = new nestedClass(nestedData, { parse: true });
        }
        response.column_function = (response.compute_function || {}).column_function;
        response.aggregation_function = (response.compute_function || {}).aggregation_function;
        response.aggregation_function2 = (response.compute_function || {}).aggregation_function2;
        delete response.compute_function;

        return response;
    },
    toJSON: function()
    {
        var self = this;
        var result = Backbone.Model.prototype.toJSON.call(this);
        _.each(_.keys(self.model).concat(['column1', 'column2', 'date_column']),
                function(k) { result[k] = self.attributes[k].toJSON(); });
        result.compute_function = { column_function: result.column_function || 'null',
            aggregation_function: result.aggregation_function || 'sum',
            aggregation_function2: result.aggregation_function2 || 'sum', metric_period: 'monthly' };
        _.each(['column_function', 'aggregation_function', 'aggregation_function2'], function(k)
            { delete result[k]; });

        // Set in the UI???
        result.source_data_period = 'daily';
        if (this.indicatorType == 'baseline')
        {
            result.type = 'burndown';
            // hard-code for now; need to add UI
            result.start_date = '1 Jan 2012';
            result.end_date = '31 Dec 2012';
        }

        return result;
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
    isComplete: function()
    {
        var js = this.toJSON();
        return !$.isBlank(js.title) && !$.isBlank(js.comparison.comparison_function) &&
            !$.isBlank(js.unit) &&
            this.get('current').isComplete() && this.get('baseline').isComplete();
    },
    parse: function(response)
    {
        for (var key in this.model)
        {
            nestedClass = this.model[key];
            nestedData = response[key];
            response[key] = new nestedClass(nestedData, { parse: true, indicatorType: key });
        }
        _.each(_.keys(response.comparison || {}), function(k)
        { response[k] = response.comparison[k]; });
        delete response.comparison;

        return response;
    },
    toJSON: function()
    {
        var self = this;
        var result = Backbone.Model.prototype.toJSON.call(this);
        _.each(_.keys(self.model), function(k) { result[k] = self.attributes[k].toJSON(); });
        result.comparison = { comparison_function: result.comparison_function || '<',
            time_to_compare: 'now' };
        delete result.comparison_function;
        delete result.time_to_compare;
        result.unit = result.unit || ' ';
        return result;
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

    initialize: function()
    {
        if (!this.get('agencies')) { this.set('agencies', new Agencies()); }
        if (!this.get('related_datasets')) { this.set('related_datasets', new DatasetsProxy()); }
        if (!this.get('metrics')) { this.set('metrics', new Metrics()); }

        var metrics = this.get('metrics');
        if (metrics.length === 0) { metrics.add(new Metric()); }

        // Default start_date to today
        if ($.isBlank(this.get('start_date')))
        { this.set('start_date', new Date().toISOString()); }

        // prevailing metric gets goal comparison
        this.on('change:comparison_function', function(_, value)
        {
            var metrics = this.get('metrics');
            if (!metrics || metrics.length < 1) { return; } // something's wrong

            metrics.at(0).set('comparison_function', value);
        });
    },
    url: function()
    {
        return '/api/govStatGoals' + (this.isNew() ? '' : '/' + this.id) + '.json';
    },
    parse: function(response)
    {
        var self = this;
        for (var key in this.model)
        {
            nestedClass = this.model[key];
            nestedData = response[key];
            response[key] = new nestedClass(nestedData, { parse: true });
        }
        try
        { response.metadata = JSON.parse(response.metadata || '{}'); }
        catch (e)
        { response.metadata = {}; }
        if ($.isBlank(response.metrics)) { response.metrics = new Metrics(); }
        _.each(_.keys(response.metadata.metrics || {}).sort(), function(mI)
        {
            response.metrics.add(new Metric(response.metadata.metrics[mI], { parse: true }), { at: mI });
        });
        response.comparison_function = (response.metadata || {}).comparison_function;
        return response;
    },
    toJSON: function()
    {
        var self = this;
        var attrs = _.clone(self.attributes);
        _.each(_.keys(self.model), function(k) { attrs[k] = _.compact(self.attributes[k].toJSON()); });
        _.each(_.keys(attrs), function(k)
        {
            if (_.isArray(attrs[k]) && _.isEmpty(attrs[k]) || _.isNull(attrs[k]))
            { delete attrs[k]; }
        });
        _.each(['goal_delta'], function(k)
        { if (_.isString(attrs[k])) { attrs[k] = parseFloat(attrs[k]); } });

        if (!_.isObject(attrs.metadata))
        { attrs.metadata = {}; }
        attrs.metadata.comparison_function = attrs.comparison_function;
        delete attrs.comparison_function;

        // Always re-construct from scratch
        attrs.metadata.metrics = {};
        self.get('metrics').each(function(metric, i)
        {
            if (!metric.isComplete())
            { attrs.metadata.metrics[i] = attrs.metrics[i]; }
        });
        _.each(_.keys(attrs.metadata.metrics).sort().reverse(), function(mI)
        { attrs.metrics.splice(mI, 1); });

        attrs.metadata = JSON.stringify(attrs.metadata);
        return attrs;
    }
});

var Goals = Backbone.Collection.extend({
    model: Goal,
    url: '/api/govStatGoals.json',

    initialize: function(__, options)
    {
        var self = this;

        options = options || {};
        this.on('add', function(goal)
        {
            if (options.category instanceof Category)
            {
                goal.set('category', options.category.id);
                goal.set('is_public', true);
            }
            else if (options.draft === true)
            {
                goal.set('category', '');
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
        var self = this;
        if (!this.get('color'))
        {
            this.set('color', Category.getColor());
        }

        this.goals = new Goals([], { category: this });

        this.on('change:id', function()
        {
            this.goals.each(function(goal) { goal.set('category', self.id); });
        });
        this.on('add', function(_, collection)
        {
            this.collection = collection;
        });
    },
    url: function()
    {
        return '/api/govStatCategories' + (this.isNew() ? '' : '/' + this.id) + '.json';
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

    initialize: function()
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

