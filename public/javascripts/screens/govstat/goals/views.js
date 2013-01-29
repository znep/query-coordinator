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
        var $mainDetails = govstatNS.markup.goalEditor.mainDetails(this.model);
        var $additionalDetails = govstatNS.markup.goalEditor.additionalDetails(this.model);
        var $relatedDatasets = govstatNS.markup.goalEditor.relatedDatasets(this.model);

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
			var $modal = $.showModal('selectDataset');
			$modal.find('iframe').attr('src', browseUrl + '&Goal_Related-Dataset=' + escape(self.model.get('name')));
			commonNS.selectedDataset = function(dataset)
			{
				var datasetProxy = new govstatNS.models.DatasetProxy({ id: dataset.id }, { dataset: dataset });
				relatedDatasets.add(datasetProxy);
				$.popModal();
			};
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
        this.$el.append($mainDetails);
        this.$el.append($additionalDetails);
        this.$el.append($relatedDatasets);
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
            _: 'h2',
            className: 'categoryTitle',
            contents: this.getName()
        }, {
            _: 'h2',
            className: 'editIcon',
            contents: 'edit'
        }, {
            _: 'input',
            type: 'text',
            className: 'categoryTitleEdit',
            title: 'Category Name',
            value: this.model.get('name')
        }]);

        // make a goal list per category pane
        this.model.goals = new govstatNS.collections.Goals([], { category: this.model });
        goalsView = new GoalList({ collection: this.model.goals, instanceView: GoalCard });
        goalsView.render();

        // color
        this.$el.css('background-color', this.model.get('color'));

        // data
        this.$el.data('category', this.model.get('name'));
        this.$el.data('goals', this.model.goals);

        // add everything
        this.$el.append($title);
        this.$el.append(goalsView.$el);
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
    addOne: function(model)
    {
        // HACK: override to adjust where the add new field goes
        var view = new this.options.instanceView({ model: model });
        this._views[model.cid] = view;

        this.$('.newAgency').before(view.$el);
        view.render();

        view.$el.append($.tag2({
            _: 'a',
            className: 'removeAgency',
            href: '#',
            title: 'Remove This Agency',
            contents: 'close'
        }));
    }
});

// DATASETSPROXY

var DatasetCard = Backbone.View.extend({
	tagName: 'div',
	className: 'datasetCard',
	render: function()
	{
		var self = this;
		if (this._rendered === true) return; else this._rendered = true;

		// drop in a spinner
		this.$el.append($.tag2({ _: 'h2', className: 'loading', contents: 'Loading&hellip;' }));

		// data
		this.$el.data('model', this.model);

		// the go fetch the actual metadata
		this.model.getDataset(function(ds)
		{
			self.$el
				.empty()
				.append(govstatNS.markup.datasetCard(ds));
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
    },
    agencies:
    {
        AgencyList: AgencyList
    },
    agency:
    {
        AgencyEditor: AgencyEditor
    }
};

})();


