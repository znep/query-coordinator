(function($) {
    $.Control.extend('pane_new_chart_create', {
        _init: function()
        {
           var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);

            cpObj.$dom().delegate('.showConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                if ($.subKeyDefined(blist, 'datasetPage.sidebar'))
                { blist.datasetPage.sidebar.show('visualize.conditionalFormatting'); }
            });

            cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                var metadata = $.extend(true, {}, cpObj._view.metadata);
                delete metadata.conditionalFormatting;
                cpObj._view.update({ metadata: metadata });
            });
        },

        render: function() {
            var completeRerender = this._super();
            var cpObj = this;

            if (completeRerender) 
            { 
            //setup DOM 
                //Push custom icons into sidebar dom
                cpObj.$dom().find('.chartTypeSelection .formHeader')
                    .append($.tag({ tagName: 'div', 'class': ['currentSelection'],
                        contents: [{ tagName: 'span', 'class': ['selectionName']}, 
                                   { tagName: 'span', 'class': ['selectionIcon']}]
                    }));

                //Insert icon elements where needed
                cpObj.$dom().find('.line.hasIcon')
                    .after($.tag({ tagName: 'div', 'class': ['lineIcon'] }));

                //Repeater add buttons change icon of section
                cpObj.$dom().find('.hasIcon.repeater .addValue')
                    .hover( 
                        function() { 
                            $(this).parent().siblings().filter('.lineIcon').addClass('hover');
                        },
                        function() { 
                            $(this).parent().siblings().filter('.lineIcon').removeClass('hover');
                        }
                );

                //setup eventing

                //takes in classname <type>-icon
                var setHeader = function(type){
                    cpObj.$dom().find('.formSection.chartTypeSelection') 
                    .removeClass(function(i, oldClasses) {
                        var matches = oldClasses.match(/\S*-icon/);
                        return ($.isBlank(matches) ? '' : matches.join(' '));
                    }) 
                    .addClass(type)
                    //Set the text to current icon type
                    .find('.currentSelection .selectionName')
                    .text(cpObj.$dom().find('.'+type +' > span > span').text());
                    //.text(type.split('-')[0]); 
                }
                if (blist.dataset.displayFormat.chartType){
                    setHeader(blist.dataset.displayFormat.chartType+'-icon');
                }
                //Bind section classing to chart-type selection
                cpObj.$dom().find('label[class$="-icon"]').click(function(e) {
                    setHeader($(e.currentTarget).attr('class'));
                });                    
            }
        },

        getTitle: function() {
            return 'New visualize';
        },

        //Append area can be before, after ...
        _getSections: function() {
            var cpObj = this;

            //getting rid of "Chart" at the end of the charttype string
            var chartTypesCopy = $.extend({}, Dataset.chart.types);
            for (var type in chartTypesCopy)
            {
                chartTypesCopy[type].text = chartTypesCopy[type].text.replace(' Chart','');
            }

            //Order the chart types in a custom order
            var typeOrder = ['column', 'bar', 'stackedcolumn', 'stackedbar', 'pie', 'donut', 'line' , 'area', 'timeline', 'bubble', 'treemap'];
            var chartTypesSorted = {};
            for (var i=0; i<typeOrder.length; i++)
            {
                chartTypesSorted[typeOrder[i]]=chartTypesCopy[typeOrder[i]];
                
                //Add custom class for chart types not available with current dataset
                if(!Dataset.chart.hasRequiredColumns(
                    cpObj._view.realColumns,
                    Dataset.chart.types[typeOrder[i]].requiredColumns, 
                    isEdit(cpObj) && !cpObj._view.isGrouped())){

                    chartTypesSorted[typeOrder[i]].lineClass = 'unAvailable';
                }
            }

            var result = [{
                    title: $.t('screens.ds.grid_sidebar.chart.setup.title'),
                    type: 'selectable',
                    initShow: true,
                    validateCollapsed: true,
                    customClasses: 'sectionSubheading chartTypeSelection',
                    fields: [{
                            text: $.t('screens.ds.grid_sidebar.chart.setup.type'),
                            name: 'displayFormat.chartType',
                            type: 'radioGroup',
                            required: true,
                            extraClass: 'option-icons',
                            sectionSelector: true,
                            defaultValue: '',
                            prompt: $.t('screens.ds.grid_sidebar.chart.setup.type_prompt'),
                            options: chartTypesSorted
                        }
                    ]
                }

            ];

            _.each(_.keys(Dataset.chart.types), function(type) {
                result = result.concat(blist.configs.chart.newConfigForType(type, {
                    view: cpObj._view,
                    isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),    
                    useOnlyIf: true
                }));
            });

            return result;
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.chart.title'); },

        _getCurrentData: function()
        { return this._super() || this._view; },

        isAvailable: function()
        {
            return (this._view.valid || isEdit(this)) &&
                (_.include(this._view.metadata.availableDisplayTypes, 'chart') ||
                    !this._view.isAltView());
        },



        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ?
                $.t('screens.ds.grid_sidebar.base.validation.invalid_view') : $.t('screens.ds.grid_sidebar.chart.validation.viz_limit');
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(this, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});

            var addColumn = function(colId)
            {
                var col = cpObj._view.columnForIdentifier(colId);
                if (_.any(col.renderType.aggregates, function(a) { return a.value == 'sum'; }))
                col.format.aggregate = 'sum';
            };

            _.each(view.displayFormat.fixedColumns || [], addColumn);

            if (_.include(['pie', 'donut'], view.displayFormat.chartType))
            { view.query = $.extend(view.query, cpObj._view.query,
                { orderBys: _.map(view.displayFormat.valueColumns, function(col)
                    {
                        var orderBy = { ascending: false, expression: {
                            columnId: cpObj._view.columnForIdentifier(col.fieldName || col.tableColumnId).id,
                            type: 'column'
                        }};
                        return orderBy;
                    }) }
             );}
           
            if (((view.displayFormat.chartType == 'bar') || (view.displayFormat.chartType == 'column')) &&
                (view.displayFormat.stacking == true))
            {
                view.displayFormat.chartType = 'stacked' + view.displayFormat.chartType;
            }
            cpObj._view.update(view);

            var didCallback = false;
            if (isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj._view.realColumns, 'id');
                if (colIds.length > 0)
                {
                    cpObj._view.setVisibleColumns(colIds, finalCallback, true);
                    didCallback = true;
                }
            }

            cpObj._finishProcessing();
            cpObj.reset();
            if (!didCallback && _.isFunction(finalCallback)) { finalCallback(); }
        }

    }, {
        name: 'new_chart_create'
    },
        'controlPane');

    var isEdit = function(cpObj) {
        return _.include(cpObj._view.metadata.availableDisplayTypes, 'chart');
    };

    if (!blist.sidebarHidden.new_chart_create) {
        $.gridSidebar.registerConfig('new_chart_create', 'pane_new_chart_create');
    }

})(jQuery);