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
var showDatasetSelect = function(callback, goalName, extraArgs)
{
    var $modal = $.showModal('selectDataset');
    $modal.find('iframe').attr('src', browseUrl + (extraArgs || '') + '&_cache=' + (new Date()).getTime());
    commonNS.selectedDataset = function(dataset)
    {
        // the dataset we get back may be fragment-cached. don't trust it.
        Dataset.createFromViewId(dataset.id, callback);
        $.popModal();
    };

    // wire in our custom field
    var $input = $modal.find('.viewUrl');
    $input.blistTextPrompt();
    $modal.find('form').on('submit', function(event)
    {
        event.preventDefault();

        // parse URL using an a tag (<3 this trick)
        var url = $input.val();
        var a = document.createElement('a');
        a.href = url;
        var uid = /\/(\w{4}-\w{4})$/i.exec(a.pathname);

        if ($.isBlank(uid))
        {
            $modal.find('.viewUrlError').addClass('error').text('Could not identify that dataset. Are you sure it is the web address of a dataset?');
        }
        else
        {
            Dataset.createFromViewId(uid[1], callback);
            $.popModal();
        }

        return false; // ie!
    });
};


// GOAL
var GoalCard = Backbone.View.extend({
    tagName: 'li',
    className: 'singleItem',
    events:
    {
        'click': 'showEditor'
    },
    initialize: function()
    {
        var self = this;
        this.listenTo(this.model, 'change:name',
            function(_, name) { self.$('h2').text(self.getName()); });
        this.listenTo(this.model, 'change:category', function() { self.updateColor(); });
        this.listenTo(this.model, 'change:is_public', function(_, is_public) { self.$el.toggleClass('internal', is_public === false); });
        this.listenTo(this.model, 'change:id', function(_, id) { self.$('.view.button').attr('href', '/goal/' + id); });
    },
    render: function()
    {
        if (this._rendered === true) return; else this._rendered = true;

        // markup
        this.$el.append($.tag2([{
            _: 'div',
            className: 'singleInner',
            contents: [{
                _: 'div',
                className: 'title',
                contents: [{
                    _: 'h2',
                    contents: this.getName()
                }]
            }, {
                _: 'div',
                className: 'primaryAction',
                contents: [{
                    _: 'a',
                    href: '#',
                    contents: {
                        _: 'span',
                        className: 'actionDetails ss-right',
                        contents: 'Edit goal'
                    }
                }]
            }, {
                _: 'div',
                className: 'secondaryAction',
                contents: [{
                    _: 'a',
                    href: '/goal/' + this.model.id,
                    rel: 'external',
                    className: 'button view',
                    contents: {
                        _: 'span',
                        className: 'actionDetails ss-checkclipboard',
                        contents: 'View'
                    }
                }]
            }]
        }], true));

        // color
        this.updateColor();
        this.$el.toggleClass('internal', this.model.get('is_public') === false);

        // model
        this.$el.data('model', this.model);

        // events
        // drag and drop
        this.$el.draggable({
            delay: 100,
            distance: 5,
            helper: 'clone',
            opacity: 0.7,
            revert: 'invalid',
            revertDuration: 180,
            scope: 'goals',
            scroll: true
        });

        // prevent drag+drop initiation on linkclick
        this.$el.find('.secondaryAction a').on('mousedown', function(event)
        {
            event.stopPropagation();
        });
    },

    updateColor: function()
    {
        var category = this.$el.closest('.categoryItem').data('model');
        this.$el.css('background-color', (category ? category.get('color') : null) || '#888');
    },
    showEditor: function(event)
    {
        var $a = $(event.target).closest('a');
        if ($a.hasClass('view')) { return; }
        event.preventDefault();
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
        'change .mainDetails input.date': 'updateDateAttr',
        'change .additionalDetails select': 'updateFakeBooleanAttr',
        'change .additionalDetails .iconPickerHandle': 'updateParamAttr',
        'change .additionalDetails input[type=checkbox]': 'updateCheckAttr',
        'change .relatedDatasets input[type=checkbox]': 'updateCheckAttr',
        'hallomodified .notes': 'updateNotesAttr'
    },
    initialize: function()
    {
        var self = this;
        this.listenTo(this.model, 'change:is_public',
            function(_, is_public) { self.$el.toggleClass('draft', !is_public); });

        var titleFields = [ 'subject', 'comparison_function', 'name', 'goal_delta', 'goal_delta_is_pct', 'end_date' ];
        this.listenTo(this.model, _.map(titleFields, function(field) { return 'change:' + field }).join(' '),
            function() { self.$el.find('.customTitle input').blur(); }); // update default title
    },
    render: function()
    {
        var self = this;
        if (this._rendered === true) return; else this._rendered = true;

        this.$el.toggleClass('draft', this.model.get('is_public') !== true);

        // render markup
        var $actions = govstatNS.markup.goalEditor.actions(this.model);
        var $mainDetails = govstatNS.markup.goalEditor.mainDetails(this.model);
        var $additionalDetails = govstatNS.markup.goalEditor.additionalDetails(this.model);
        var $relatedDatasets = govstatNS.markup.goalEditor.relatedDatasets(this.model);
        var $metrics = govstatNS.markup.goalEditor.metrics();

        // custom components
        // drop in agency list
        var agencyList = new AgencyList({ collection: this.model.get('agencies'), instanceView: AgencyEditor });
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
            }, self.model.get('name'),
            '&limitTo[]=charts&limitTo[]=maps&limitTo[]=blob&suppressed_facets[]=type');
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

        var $publicWrapper = $additionalDetails.find('.publicInput');
        bindSelect($publicWrapper.find('select'), $publicWrapper.find('span.selectValue'));

        // bind fancy date
        var $dateInputs = $mainDetails.find('input.date');
        $dateInputs.each(function()
        {
            var $this = $(this);
            $this.DatePicker({
                date: new Date($this.val()) || new Date(),
                locale: $.DatePickerLocaleOptions,
                onChange: function(_, newDate)
                {
                    $this
                        .val(newDate.toDateString())
                        .trigger('change')
                        .blur();
                },
                starts: 0,
                eventName: 'focus'
            });
        });

        // bind fancy custom_title
        $mainDetails.find('.customTitle input').example(function() { return self._generateGoalSentence(); });

        // bind fancy icon
        var $iconPicker = $additionalDetails.find('.iconPickerHandle');
        _.defer(function() { $iconPicker.iconPicker(); }); // defer for scrollbind

        // bind fancy imageselect
        $additionalDetails.find('input.titleImageInput').imageUploader({
            buttonText: 'Choose an Image',
            buttonClass: 'selectImageButton ss-uploadfolder',
            containerSelector: '.imageInput',
            imageSelector: '.titleImage',
            imageIsContainer: false,
            success: function(_, _, response) { self.model.set('title_image', '/api/assets/' + response.id); }
        });

        // bind fancy textedit
        var $notes = $additionalDetails.find('.notes');
        $additionalDetails.find('.notesWrapper').on('click', function() { $notes.focus(); });

        $notes.hallo({
            toolbar: 'halloToolbarContextual',
            plugins: {
                halloformat: {
                    formatting: {
                        bold: true, italic: true
                    }
                },
                hallolists: {},
                halloplainpaster: {}
            }
        });

        // append
        this.$el.append($actions);
        this.$el.append($mainDetails);
        this.$el.append($metrics);
        this.$el.append($additionalDetails);
        this.$el.append($relatedDatasets);

        this.$el.data('backboneModel', this.model);
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

        var value = $input.attr('name');
        if ($input.hasClass('prompt')) { value = null; }

        this.model.set(value, $input.val());
    },
    updateFakeBooleanAttr: function(event)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), $input.val() === 'true');
    },
    updateParamAttr: function(event, val)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), val);
    },
    updateCheckAttr: function(event)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), $input.is(':checked'));
    },
    updateDateAttr: function(event)
    {
        var $input = $(event.target);
        var d = new Date($input.val());
        this.model.set($input.attr('name'), _.isNaN(d.valueOf()) ? null : d.toISOString());
    },
    updateNotesAttr: function(event)
    {
        var self = this;
        _.defer(function()
        {
            var $markup = $(event.target).clone();
            self.model.set('description', $markup.html());
        });
    },

    _generateGoalSentence: function()
    {
        var comparisons = { '<': 'reduce', '>': 'increase' };

        var rawEndDate = this.model.get('end_date');
        var endDate = $.isBlank(rawEndDate) ? null : new Date(rawEndDate);
        var formattedEndDate = endDate ? ('by ' + endDate.format('%h %Y')) : '';

        var formattedGoalDelta = this.model.get('goal_delta') || null;
        if (!$.isBlank(formattedGoalDelta))
        {
            formattedGoalDelta =
              'by ' +
              formattedGoalDelta +
              (this.model.get('goal_delta_is_pct') ? '%' : '');
        }

        return _.compact([
            this.model.get('subject') || 'We',
            'will',
            comparisons[this.model.get('comparison_function')] || 'change',
            this.model.get('name') || 'something',
            formattedGoalDelta,
            formattedEndDate
        ]).join(' ');
    }
});

// static methods
GoalEditor.showDialog = function(goal)
{
    var editorView = new GoalEditor({ model: goal });
    editorView.render();

    editorView.$el.addClass('socrataDialog locked');
    editorView.$el.showModal();
    var $headerBar = editorView.$el.find('.headerBar');
    $headerBar.waypoint(function(ev, dir)
    {
        $headerBar.width(dir === 'down' ? $headerBar.width() : '');
        $headerBar.toggleClass('sticky', dir === 'down');
    }, { context: $('.socrataModalWrapper') });
};

// GOALS
var GoalList = Backbone.CollectionView.extend({
    tagName: 'ul',
    className: 'goalList clearfix',
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
    className: 'categoryItem',
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
            self.$('.categoryTitle h2').text(self.getName());
            self.$('.categoryTitleEdit').val(name);
        });
    },
    render: function()
    {
        var self = this;

        if (this._rendered === true) return; else this._rendered = true;

        // make list item
        var $title = $.tag2([{
            _: 'div',
            className: [ 'categoryTitle' ],
            contents: [{
                _: 'a',
                className: ['removeCategory', 'ss-delete'],
                href: '#remove'
            }, {
                _: 'h2',
                contents: this.getName()
            }, {
                _: 'a',
                className: ['editIcon', 'ss-write'],
                href: '#edit'
            }, {
                _: 'input',
                type: 'text',
                className: 'categoryTitleEdit',
                title: 'Category Name',
                value: this.model.get('name')
            }]
        }]);

        // make a goal list per category pane
        goalsView = new GoalList({ collection: this.model.goals, instanceView: GoalCard });
        goalsView.render();

        // data
        this.$el.data('category', this.model.id);
        this.$el.data('model', this.model);

        // add everything
        this.$el.append($title);
        this.$el.append(goalsView.$el);

        this.$('.categoryTitle, .categoryTitle .editIcon, .categoryTitle .removeCategory').css('color', this.model.get('color'));
        this.$('.categoryTitle').css('border-color', this.model.get('color'));
    },

    maybeRemoveCategory: function(event)
    {
        event.preventDefault();
        if (confirm('Are you sure you want to remove this category? All goals currently assigned to this category will be reverted to Draft Goals.'))
        {
            this.model.trigger('removeFromAll');
        }
    },
    editTitle: function(event)
    {
        event.preventDefault();
        this.$('.categoryTitle h2, .editIcon').hide();
        this.$('.categoryTitleEdit').show().focus();
    },
    uneditTitle: function()
    {
        this.$('.categoryTitle h2, .editIcon').show();
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
    },
    _addOneView: function(view)
    {
        this.$el.prepend(view.$el);
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
        'keydown .newAgency input': 'newAgency',
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
    newAgency: function(event)
    {
        if (event.keyCode < 32) { return; } // let things progress for special keys

        event.preventDefault();

        // extract value
        var chr = String.fromCharCode(event.keyCode);
        if (!event.shiftKey) { chr = chr.toLowerCase(); }

        // create new agency + editor
        this.collection.add(new govstatNS.models.Agency());

        // focus on said editor; populate with new value
        var $newInput = this.$('.newAgency').prev().find('input');
        $newInput.val(chr).focus().caretToEnd();
    },
    removeAgency: function(event)
    {
        event.preventDefault();
        this.collection.remove($(event.target).closest('.agencyEditor').data('model'));
    },
    _addOneView: function(view)
    {
        this.$('.newAgency').before(view.$el);

        _.defer(function()
        {
            view.$el.append($.tag2({
                _: 'a',
                className: ['removeAgency', 'ss-delete'],
                href: '#remove',
                title: 'Remove This Agency'
            }));
        });
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

var DatasetCardList = Backbone.OrderableView.extend({
    tagName: 'div',
    className: 'datasetCardList',
    events: {
        'click .datasetCard .removeDataset': 'removeDataset'
    },
    render: function()
    {
        this.$el.awesomereorder({
            handleSelector: '.dragHandle',
            listItemSelector: '.datasetCard',
            uiDraggableDefaults: {
                containment: false
            }
        });
    },
    removeDataset: function(event)
    {
        event.preventDefault();
        this.collection.remove($(event.target).closest('.datasetCard').data('model'));
    },
    _move: function() {}, // nobody else touches the ordering but us
    _addOneView: function(view, model)
    {
        var self = this;

        Backbone.CollectionView.prototype._addOneView.apply(this, arguments);

        view.$el.append($.tag2({
            _: 'a',
            className: ['removeDataset', 'ss-delete'],
            href: '#remove',
            title: 'Remove This Dataset'
        }));
        view.$el.append($.tag2({ _: 'div', className: 'dragHandle' }));

        // ordering: kick awesomereorder
        this.$el.trigger('awesomereorder-listupdated');

        // listen to drop
        view.$el.on('awesomereorder-dropped', function()
        {
            self.collection.move(model, view.$el.prevAll().length);
        });
    }
});

// COLUMNPROXY

var ColumnCard = Backbone.View.extend({
    tagName: 'div',
    className: 'columnCard',
    events: {
        'change select': 'fieldNameChanged'
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
    fieldNameChanged: function(event)
    {
        this.model.set('field_name', $(event.target).val());
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
                    .append('<option value="">(None)</option>')
                    .append($.tag2(_.map(ds.columnsForType(self.model.acceptableTypes), function(column)
                    {
                        return {
                            _: 'option',
                            value: column.fieldName,
                            contents: $.htmlEscape(column.name)
                        };
                    })))
                    .val(self.model.get('field_name'))
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
        'change .textInput input': 'textChanged',
        'change .comparison select': 'comparisonChanged'
    },
    initialize: function()
    {
        var self = this;
        self.listenTo(self.model, 'change:comparison_function', function(_, value)
        { self.$('.comparison select').val(value).trigger('change'); });
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

    textChanged: function(event)
    {
        var $input = $(event.target);
        this.model.set($input.attr('name'), $input.val());
    },
    comparisonChanged: function(event) { this.model.set('comparison_function', $(event.target).val()); },
    _addIndicator: function(indicator, childClass)
    {
        var indicatorEditor = new IndicatorEditor({ model: indicator });
        indicatorEditor.render();

        // break it up into sections so they line up :(
        this.$('.datasetContainer .' + childClass).append(indicatorEditor.$('.datasetSection'));
        this.$('.calculationContainer .' + childClass).append(indicatorEditor.$('.calculationSection'));

        // and then wire the events in :(
        this.$('.indicator').on('change', '.' + childClass + ' select', function(event)
        {
            var $select = $(event.target);
            indicator.set($select.attr('name'), $select.val());
        });
        this.$('.indicator').on('change', '.' + childClass + ' input.date', function(event)
        {
            var $input = $(event.target);
            var d = new Date($input.val());
            indicator.set($input.attr('name'), _.isNaN(d.valueOf()) ? null : d.toISOString());
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
    removeMetric: function(event)
    {
        event.preventDefault();
        this.collection.remove($(event.target).closest('.metric').data('model'));
    },
    _addOneView: function(view)
    {
        Backbone.CollectionView.prototype._addOneView.apply(this, arguments);

        view.$el.append($.tag2({
            _: 'a',
            className: ['removeMetric', 'ss-delete'],
            href: '#remove',
            title: 'Remove This Metric'
        }));
    }
});

// INDICATOR

var IndicatorEditor = Backbone.View.extend({
    tagName: 'div',
    className: 'indicatorWrapper',
    events: {
        // These don't work because everything is pulled up to the metric
        //'change input.date': 'dateChanged',
        //'change select': 'selectChanged'
    },
    initialize: function()
    {
        this.listenTo(this.model, 'change:column_function', function(__, value)
        {
            this._$columnFunctionInput.toggleClass('hasFunction', _.include([ 'sum', 'divide' ], value));
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
            }, self.model.get('name'));
        });

        // drop in column card
        this._addColumnCard('date_column');
        this._addColumnCard('column1');
        this._addColumnCard('column2');

        // bind fancy date
        var $dateInputs = this.$('input.date');
        $dateInputs.each(function()
        {
            var $this = $(this);
            $this.DatePicker({
                date: new Date($this.val()),
                onChange: function(_, newDate)
                {
                    $this
                        .val(newDate.toDateString())
                        .trigger('change')
                        .blur();
                },
                starts: 0,
                eventName: 'focus'
            });
        });

        // save off columnfunction for quick access
        this._$columnFunctionInput = this.$('.columnFunctionInput');
    },
    _addColumnCard: function(name)
    {
        var columnProxy = this.model.get(name);
        var columnCard = new ColumnCard({ model: columnProxy });
        columnCard.render();
        this.$('.columnContainer.' + name).append(columnCard.$el);
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


