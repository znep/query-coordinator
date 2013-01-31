;(function(){

var govstatNS = blist.namespace.fetch('blist.govstat');
var commonNS = blist.namespace.fetch('blist.common');

// UTIL

// select binding
var bindSelect = function($select, $span)
{
    var setSpan = function()
    {
        $span.text($select.children(':selected').text());
    };
    setSpan();

    $select.on('change', setSpan);
};

// dataset picker
var showDatasetSelect = function(callback)
{
	var $modal = $.showModal('selectDataset');
	$modal.find('iframe').attr('src', browseUrl + '&Goal_Related-Dataset=' + escape(self.model.get('name')));
	commonNS.selectedDataset = function(dataset)
	{
		callback(dataset);
		$.popModal();
	};
};


// GOAL
var GoalCard = Backbone.View.extend({
    tagName: 'li',
    className: 'goalCard',
    events:
    {
        'click': 'showEditor'
    },
    initialize: function()
    {
        var self = this;
        this.listenTo(this.model, 'change:name',
            function(_, name) { self.$('h2').text(self.getName()); });
    },
    render: function()
    {
        if (this._rendered === true) return; else this._rendered = true;

        // markup
        this.$el.append($.tag2([{
            _: 'h2',
            contents: this.getName()
        }], true));

        // model
        this.$el.data('model', this.model);

        // events
        // drag and drop
        this.$el.draggable({
            containment: $('.config'), // HACK: probably should be passed in
            delay: 100,
            distance: 5,
            helper: 'clone',
            opacity: 0.7,
            revert: 'invalid',
            revertDuration: 180,
            scope: 'goals',
            scroll: false,
            start: function() { $('.config').addClass('isDragging'); },
            stop: function() { $('.config').removeClass('isDragging'); }
        });
    },

    showEditor: function()
    {
        GoalEditor.showDialog(this.model);
    },

    getName: function()
    {
        var name = this.model.get('name');
        if (!name || (name === '')) { name = 'New Goal'; };
        return name;
    }
});

var browseUrl = $('#selectDataset iframe').attr('src');
var GoalEditor = Backbone.View.extend({
    tagName: 'div',
    className: 'goalEditor',
    events:
    {
        'click .deleteGoal': 'maybeDeleteGoal',
        'change .mainDetails input[type=text]:not(.date), .mainDetails select': 'updateTextAttr',
        'change .mainDetails input[type=checkbox]': 'updateCheckAttr',
		'change input.date': 'updateDateAttr',
		'keypress .notes': 'updateNotesAttr'
    },
    initialize: function()
    {
        var self = this;
        this.listenTo(this.model, 'change:is_public',
            function(_, is_public) { self.$el.toggleClass('draft', !is_public); });
    },
    render: function()
    {
		var self = this;
	    if (this._rendered === true) return; else this._rendered = true;

        this.$el.toggleClass('draft', this.model.get('is_public') !== true);

        // render markup
        var $actions = govstatNS.markup.goalEditor.actions();
        var $mainDetails = govstatNS.markup.goalEditor.mainDetails(this.model);
        var $additionalDetails = govstatNS.markup.goalEditor.additionalDetails(this.model);
        var $relatedDatasets = govstatNS.markup.goalEditor.relatedDatasets(this.model);
        var $metrics = govstatNS.markup.goalEditor.metrics();

        // custom components
		// drop in agency list
        var agencyList = new AgencyList({ collection: this.model.get('agency'), instanceView: AgencyEditor });
        agencyList.render();
        $additionalDetails.find('.agencyInput').append(agencyList.$el);

		// drop in related datasets
		var relatedDatasets = this.model.get('related_datasets');
		var datasetCardList = new DatasetCardList({ collection: relatedDatasets, instanceView: DatasetCard });
		datasetCardList.render();
		$relatedDatasets.find('.datasetListContainer').append(datasetCardList.$el);
		$relatedDatasets.find('a.addDataset').on('click', function(event)
		{
			event.preventDefault();
			showDatasetSelect(function(dataset)
            {
				var datasetProxy = new govstatNS.models.DatasetProxy({ id: dataset.id }, { dataset: dataset });
				relatedDatasets.add(datasetProxy);
            });
		});

        // drop in metrics
        var metrics = this.model.get('metrics');
        var metricList = new MetricList({ collection: metrics, instanceView: MetricEditor });
        metricList.render();
        $metrics.find('.metricListContainer').append(metricList.$el);
        $metrics.find('.addMetric').on('click', function(event)
        {
            event.preventDefault();
            metrics.add(new govstatNS.models.Metric());
        });

        // custom controls
        // bind fancy select
        var $comparisonWrapper = $mainDetails.find('.comparisonInput');
        bindSelect($comparisonWrapper.find('select'), $comparisonWrapper.find('span.selectValue'));

		// bind fancy date
		var $dateInputs = $mainDetails.find('input.date').add($additionalDetails.find('input.date'));
		$dateInputs.each(function()
		{
			var $this = $(this);
			$this.DatePicker({
				date: $this.attr('data-rawvalue') || new Date(),
				onChange: function(_, newDate)
				{
					$this
						.attr('data-rawvalue', newDate.toISOString())
						.val(newDate.toDateString())
						.trigger('change')
						.blur();
				},
				starts: 0,
				eventName: 'focus'
			});
		});

        // bind fancy textedit
        var $notes = $additionalDetails.find('.notes');
        $additionalDetails.find('.notesWrapper').on('click', function(event) { $notes.focus(); });
        $notes.on('blur', function() { $notes.trigger('change'); });

        // append
        this.$el.append($actions);
        this.$el.append($mainDetails);
        this.$el.append($additionalDetails);
        this.$el.append($relatedDatasets);
        this.$el.append($metrics);
    },

    maybeDeleteGoal: function(event)
    {
        event.preventDefault();
        if (confirm('Are you sure you want to delete this goal?'))
        {
            this.model.trigger('removeFromAll');
            $.popModal();
        }
    },
    updateTextAttr: function(event)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), $input.val());
    },
    updateCheckAttr: function(event)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), $input.is(':checked'));
    },
	updateDateAttr: function(event)
	{
		var $input = $(event.target);
		this.model.set($input.attr('name'), $input.attr('data-rawvalue'));
	},
	updateNotesAttr: function(event)
	{
		var self = this;
		_.defer(function()
		{
			var $markup = $(event.target).clone();
			$markup.find('br').replaceWith('\n');
			self.model.set('description', $markup.text());
		});
	}
});

// static methods
GoalEditor.showDialog = function(goal)
{
    var editorView = new GoalEditor({ model: goal });
    editorView.render();

    editorView.$el.addClass('socrataDialog');
    editorView.$el.showModal();
};

// GOALS
var GoalList = Backbone.CollectionView.extend({
    tagName: 'ul',
    className: 'goalList',
    render: function()
    {
        var self = this;

        // markup
        this.$el.append(this.renderCollection());

        // model
        this.$el.data('collection', this.collection);

        // events
        this.$el.droppable({
            activeClass: 'dropTarget',
            drop: function(_, ui)
            {
                var model = ui.draggable.data('model');
                var origList = ui.draggable.closest('.goalList').data('collection');

                origList.remove(model);
                self.collection.add(model);
            },
            scope: 'goals'
        });
    }
});

// CATEGORY
var CategoryPane = Backbone.View.extend({
    tagName: 'li',
    events: {
        'click .removeCategory': 'maybeRemoveCategory',
        'click .categoryTitle': 'editTitle',
        'click .editIcon': 'editTitle',
        'blur .categoryTitleEdit': 'saveTitle',
        'keyup .categoryTitleEdit': 'handleTitleKey'
    },
    initialize: function()
    {
        var self = this;
        this.listenTo(this.model, 'change:name', function(_, name)
        {
            self.$('.categoryTitle').text(self.getName());
            self.$('.categoryTitleEdit').val(name);

            // HACKMAYBE/TODO: this seems model-y
            self.model.goals.each(function(goal)
            {
                goal.set('category', name);
            });
        });
    },
    render: function()
    {
        if (this._rendered === true) return; else this._rendered = true;

        // make list item
        var $title = $.tag2([{
            _: 'a',
            className: 'removeCategory',
            href: '#remove',
            contents: 'Close'
        }, {
            _: 'h2',
            className: 'categoryTitle',
            contents: this.getName()
        }, {
            _: 'a',
            className: 'editIcon',
            href: '#edit',
            contents: 'edit'
        }, {
            _: 'input',
            type: 'text',
            className: 'categoryTitleEdit',
            title: 'Category Name',
            value: this.model.get('name')
        }]);

        // make a goal list per category pane
        goalsView = new GoalList({ collection: this.model.goals, instanceView: GoalCard });
        goalsView.render();

        // color
        this.$el.css('background-color', this.model.get('color'));

        // data
        this.$el.data('category', this.model.get('name'));

        // add everything
        this.$el.append($title);
        this.$el.append(goalsView.$el);
    },

    maybeRemoveCategory: function()
    {
        if (confirm('Are you sure you want to remove this category? All goals currently assigned to this category will be reverted to Draft Goals.'))
        {
            this.model.trigger('removeFromAll');
        }
    },
    editTitle: function()
    {
        this.$('.categoryTitle, .editIcon').hide();
        this.$('.categoryTitleEdit').show().focus();
    },
    uneditTitle: function()
    {
        this.$('.categoryTitle, .editIcon').show();
        this.$('.categoryTitleEdit').hide();
    },
    handleTitleKey: function(event)
    {
        if (event.keyCode === 13)
        {
            this.saveTitle();
        }
        else if (event.keyCode === 27)
        {
            this.$('.categoryTitleEdit').val(this.model.get('name'));
            this.uneditTitle();
        }
    },
    saveTitle: function()
    {
        this.model.set('name', this.$('.categoryTitleEdit').val(), { validate: true });
        this.uneditTitle();
    },

    getName: function()
    {
        var name = $.htmlEscape(this.model.get('name'));
        if (!name || (name === '')) { name = 'New Category'; };
        return name;
    }
});

// CATEGORIES
var CategoryList = Backbone.CollectionView.extend({
    tagName: 'ul',
    className: 'categories',
    render: function()
    {
        this.$el.append(this.renderCollection());
    }
});

// AGENCY
var AgencyEditor = Backbone.View.extend({
    tagName: 'li',
    className: 'agencyEditor',
    events: {
        'change input': 'nameChanged'
    },
    render: function()
    {
        if (this._rendered === true) return; else this._rendered = true;

        this.$el.append(govstatNS.markup.agencyEditor(this.model));

        this.$el.data('model', this.model);
    },
    nameChanged: function()
    {
        this.model.set('name', this.$('input').val());
    }
});

// AGENCIES
var AgencyList = Backbone.CollectionView.extend({
    tagName: 'ul',
    className: 'agencyList',
    events: {
        'focus .newAgency input': 'newAgency',
        'click .removeAgency': 'removeAgency'
    },
    render: function()
    {
        if (this._rendered === true) return; else this._rendered = true;

        this.$el.append(this.renderCollection());

        // create blank field
        var $newAgency = $('<li class="agencyEditor newAgency"/>');
        $newAgency.append(govstatNS.markup.agencyEditor(new govstatNS.models.Agency()));
        this.$el.append($newAgency);
    },
    newAgency: function()
    {
        // create new agency + editor
        this.collection.add(new govstatNS.models.Agency());

        // focus on said editor
        this.$('.newAgency').prev().find('input').focus();
    },
    removeAgency: function(event)
    {
        event.preventDefault();
        this.collection.remove($(event.target).closest('.agencyEditor').data('model'));
    },
    _addOneView: function(view)
    {
        this.$('.newAgency').before(view.$el);

        view.$el.append($.tag2({
            _: 'a',
            className: 'removeAgency',
            href: '#remove',
            title: 'Remove This Agency',
            contents: 'Close'
        }));
    }
});

// DATASETSPROXY

var DatasetCard = Backbone.View.extend({
	tagName: 'div',
	className: 'datasetCard',
    initialize: function()
    {
        this.listenTo(this.model, 'change:id', function() { this.updateDataset(); });
    },
	render: function()
	{
		if (this._rendered === true) return; else this._rendered = true;

		// data
		this.$el.data('model', this.model);

		// then go fetch the actual metadata
		this.updateDataset();
	},
    empty: function()
    {
        this.$('h2, .datasetIcon').remove();
    },
    updateDataset: function()
    {
		var self = this;

		// drop in a spinner
        this.empty();
		this.$el.append($.tag2({ _: 'h2', className: 'loading', contents: 'Loading&hellip;' }));

		this.model.getDataset(function(ds)
		{
            self.empty();
            if ($.isBlank(ds))
            {
                self.$el.append($.tag2({ _: 'h2', className: 'prompt', contents: 'Please select a dataset' }));
            }
            else
            {
    			self.$el.append(govstatNS.markup.datasetCard(ds));
            }
		});
    }
});

var DatasetCardList = Backbone.CollectionView.extend({
    tagName: 'div',
    className: 'datasetCardList',
	events: {
		'click .datasetCard .removeDataset': 'removeDataset'
	},
    render: function()
    {
        this.$el.append(this.renderCollection());
    },
	removeDataset: function(event)
	{
		event.preventDefault();
		this.collection.remove($(event.target).closest('.datasetCard').data('model'));
	},
    _addOneView: function(view)
    {
        Backbone.CollectionView.prototype._addOneView.apply(this, arguments);

        view.$el.append($.tag2({
            _: 'a',
            className: 'removeDataset',
            href: '#remove',
            title: 'Remove This Dataset',
            contents: 'Close'
        }));
    }
});

// COLUMNPROXY

var ColumnCard = Backbone.View.extend({
    tagName: 'div',
    className: 'columnCard',
    events: {
        
    },
    initialize: function()
    {
        this.listenTo(this.model.datasetProxy, 'change:id', function() { this.updateEntries(); });
    },
    render: function()
    {
        var self = this;
        if (this._rendered === true) return; else this._rendered = true;

        this.$el.append(govstatNS.markup.columnCard(this.model));

        // bind fancy select
        bindSelect(this.$('select'), this.$('span.selectValue'));

        // fetch entries if we have em
        this.updateEntries();
    },
    updateEntries: function()
    {
        var self = this;
        this.model.datasetProxy.getDataset(function(ds)
        {
            if ($.isBlank(ds))
            {
                self.$('select')
                    .empty()
                    .trigger('change');

                self.$('span.selectValue')
                    .addClass('needsDataset')
                    .text('Please select a dataset');
            }
            else
            {
                self.$('select')
                    .empty()
                    .append('<option>(None)</option>')
                    .append($.tag2(_.map(ds.columnsForType(self.model.acceptableTypes), function(column)
                    {
                        return {
                            _: 'option',
                            value: column.fieldName,
                            contents: $.htmlEscape(column.name)
                        };
                    })))
                    .trigger('change');

                self.$('span.selectValue').removeClass('needsDataset');
            }
        });
    }
});

// METRICS

var MetricEditor = Backbone.View.extend({
    tagName: 'form',
    className: 'metric',
    events: {
        'change .nameInput input': 'nameChanged',
        'change .comparison select': 'comparisonChanged'
    },
    render: function()
    {
		var self = this;
		if (this._rendered === true) return; else this._rendered = true;

        var $markup = govstatNS.markup.metricEditor(this.model);
        this.$el.append($markup);

        // bind fancy select
        var $select = this.$('.comparison select');
        bindSelect($select, $select.siblings('span.selectValue'));

        // add indicators
        this._addIndicator(this.model.get('current'), 'left');
        this._addIndicator(this.model.get('baseline'), 'right');

        // save off model
        this.$el.data('model', this.model);
    },

    nameChanged: function() { this.model.set('name', $(event.target).val()); },
    comparisonChanged: function() { this.model.set('comparison', $(event.target).val()); },
    _addIndicator: function(indicator, childClass)
    {
        var indicatorEditor = new IndicatorEditor({ model: indicator });
        indicatorEditor.render();

        // break it up into sections so they line up :(
        this.$('.datasetContainer .' + childClass).append(indicatorEditor.$('.datasetSection'));
        this.$('.calculationContainer .' + childClass).append(indicatorEditor.$('.calculationSection'));
        this.$('.periodContainer .' + childClass).append(indicatorEditor.$('.periodSection'));

        // and then wire the events in :(
        this.$('.indicator').on('change', '.' + childClass + ' select', function(event)
        {
            var $select = $(event.target);
            indicator.set($select.attr('name'), $select.val());
        });
    }
});

var MetricList = Backbone.CollectionView.extend({
    tagName: 'div',
    className: 'metricList',
    events: {
        'click .metric .removeMetric': 'removeMetric'
    },
    render: function()
    {
        this.$el.append(this.renderCollection());
    },
    removeMetric: function()
    {
        event.preventDefault();
        this.collection.remove($(event.target).closest('.metric').data('model'));
    },
    _addOneView: function(view)
    {
        Backbone.CollectionView.prototype._addOneView.apply(this, arguments);

        view.$el.append($.tag2({
            _: 'a',
            className: 'removeMetric',
            href: '#remove',
            title: 'Remove This Metric',
            contents: 'Close'
        }));
    }
});

// INDICATOR

var IndicatorEditor = Backbone.View.extend({
    tagName: 'div',
    className: 'indicatorWrapper',
    events: {
        'change select': 'selectChanged'
    },
    initialize: function()
    {
        this.listenTo(this.model, 'change:column_function', function(_, value)
        {
            this._$columnFunctionInput.toggleClass('hasFunction', value && (value !== 'null'));
        });
    },
    render: function()
    {
		var self = this;
		if (this._rendered === true) return; else this._rendered = true;

        var $markup = govstatNS.markup.indicatorEditor(this.model);
        this.$el.append($markup);

        // bind fancy select
        this.$('select').each(function()
        {
            var $this = $(this);
            bindSelect($this, $this.siblings('span.selectValue'));
        });

        // drop in dataset card
        var datasetProxy = this.model.get('dataset');
        var datasetCard = new DatasetCard({ model: datasetProxy });
        datasetCard.render();
        this.$('.datasetContainer').append(datasetCard.$el);
		this.$('a.selectDataset').on('click', function(event)
		{
			event.preventDefault();
			showDatasetSelect(function(dataset)
            {
                datasetProxy.set('id', dataset.id);
            });
		});

        // drop in column card
        this._addColumnCard(1);
        this._addColumnCard(2);

        // save off columnfunction for quick access
        this._$columnFunctionInput = this.$('.columnFunctionInput');
    },
    selectChanged: function()
    {
        var $select = $(event.target);
        this.model.set($select.attr('name'), $select.val());
    },
    _addColumnCard: function(idx)
    {
        var columnProxy = this.model.get('column' + idx);
        var columnCard = new ColumnCard({ model: columnProxy });
        columnCard.render();
        this.$('.columnContainer.column' + idx).append(columnCard.$el);
    }
});


// EXPORT
govstatNS.views = {
    goals:
    {
        GoalList: GoalList
    },
    goal:
    {
        GoalCard: GoalCard,
        GoalEditor: GoalEditor
    },
    categories:
    {
        CategoryList: CategoryList
    },
    category:
    {
        CategoryPane: CategoryPane
    }
};

})();


