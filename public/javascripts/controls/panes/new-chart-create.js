(function($) {

    var typeOrder = ['column', 'bar', 'stackedcolumn', 'stackedbar', 'pie', 'donut', 'line' , 'area', 'timeline', 'bubble', 'treemap'];

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
                cpObj.$dom().find('.chartTypeSelection .radioLine').each(function(index, node){
                    $(node).addClass(typeOrder[index])
                });

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

                //Add flyout to unavailable chart types telling which columns are required
                var unavailable = cpObj.$dom().find('.unavailable');
                for(var i=0; i<unavailable.length; i++){
                    var type = unavailable[i].className.split(' ')[2];
                    cpObj.$dom().find('.unavailable.'+type).socrataTip({message: Dataset.chart.types[type].prompt});
                };

                //takes in classname <'radioLine' ('unavailable')? type>
                var setHeader = function(type){
                    
                    var current = type.split(' ')[1];
                    if(current!='unavailable'){
                        cpObj.$dom().find('.formSection.chartTypeSelection, .paneContent') 
                        .removeClass(function(i, oldClasses) {
                            var matches = oldClasses.match(/\S*-selected/);
                            return ($.isBlank(matches) ? '' : matches.join(' '));
                        }) 
                        .addClass(type+'-selected')
                        //Set the text to current icon type
                        .find('.currentSelection .selectionName')
                        .text(Dataset.chart.types[current].text);
                    };
                }
                if (blist.dataset.displayFormat.chartType){
                    setHeader('radioLine '+blist.dataset.displayFormat.chartType);
                }
                //Bind section classing to chart-type selection
                cpObj.$dom().find('.chartTypeSelection .radioLine').click(function(e) {
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
            
            var options = {
                    view: cpObj._view,
                    isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),    
                    useOnlyIf: true
            }

            var result = blist.configs.chart.configChartSelector(options);

            var type = cpObj._view.displayFormat.chartType;
            if (type) {
                result = result.concat(blist.configs.chart.newConfigForType(type, {
                    view: cpObj._view,
                    isEdit: isEdit(cpObj) && !cpObj._view.isGrouped(),    
                    useOnlyIf: true
                }));
            }

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

        _changeHandler: function($input)
        {
            
            var cpObj = this;
            _.defer( function() {

                ///VALIDATE///
                if (cpObj.$dom().find('.formSection').length <= 1) { 
                    cpObj._view.update(
                        $.extend(true, {}, cpObj._getFormValues(), {metadata: cpObj._view.metadata})
                    );
                    cpObj.reset(); 
                    return; 
                }; 

                //Need to sync up fields between chart types only if we are switching types.
                if ($input.data("origname") == "displayFormat.chartType") 
                { 
                    var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
                    cpObj._getFormValues(), {metadata: cpObj._view.metadata});
                    cpObj._view.update(view);
                    cpObj.reset();
                }

                if (!cpObj._finish()) { return; }

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

               

                //TEST WITH FILTERS

                var didCallback = false;
                if (isEdit(cpObj))
                {
                    // We need to show all columns when editing a view so that
                    // any filters/facets work properly
                    var colIds = _.pluck(cpObj._view.realColumns, 'id');
                    if (colIds.length > 0)
                    {
                        cpObj._view.setVisibleColumns(colIds, null, true);
                        didCallback = true;
                    }
                }

                cpObj._finishProcessing();
            });
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