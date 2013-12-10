(function($) {

    var typeOrder = ['column', 'stackedcolumn', 'bar', 'stackedbar', 'pie', 'donut', 'line' , 'area', 'timeline', 'bubble', 'treemap'];

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
                { blist.datasetPage.sidebar.show('filter.conditionalFormatting'); }
            });

            cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                var metadata = $.extend(true, {}, cpObj._view.metadata);
                delete metadata.conditionalFormatting;
                cpObj._view.update({ metadata: metadata });
            });
        },

        render: function()
        {
            var cpObj = this;
            cpObj._super(null, null, function(completeRerender)
            {
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

                    if(!cpObj._view.metadata.conditionalFormatting){
                        cpObj.$dom().find('.conditionalFormattingWarning').hide();
                    };
                    //hide *Required text, people get it
                    cpObj.$dom().find('.mainError+.required').hide();



                    //setup eventing    

                    //Add flyout to unavailable chart types telling which columns are required
                    var unavailable = cpObj.$dom().find('.unavailable');
                    for(var i=0; i<unavailable.length; i++){
                        var type = unavailable[i].className.split(' ')[2];
                        cpObj.$dom().find('.unavailable.'+type).socrataTip({content: Dataset.chart.types[type].prompt});
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

                    //Clicking minus button repeater triggers rerender
                    cpObj.$dom().find('.repeater')
                            .delegate('.removeLink', 'click', function(e) { cpObj._changeHandler($(e.currentTarget));
                    });

                    //Section hiding animations
                    cpObj.$dom().find('.formSection.selectable .sectionSelect').click( function(e) {
                        var $sect = $(e.currentTarget).closest('.formSection');

                        //shown/hidden by base-pane eventing so needs to be shown and then reset to for animation to run
                        if ($sect.hasClass('collapsed'))
                        { $sect.find('.sectionContent').show().slideUp({duration: 100, easing: 'linear'}); }
                        else
                        { $sect.find('.sectionContent').hide().slideDown({duration: 100, easing: 'linear'}); }
                    });

                }
            });
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

        validateForm: function() {
          var valid = this._super();
          //If creating from a dataset don't spit warning messages immediately.
          var hideInlineErrors = _.isEmpty(this._view.displayFormat.valueColumns) ||
                                 _.some(this._view.displayFormat.valueColumns, _.isEmpty);
          this.$dom().toggleClass('inlineErrorsHidden', hideInlineErrors || false);
          return valid;
        },

        _changeHandler: function($input)
        {
            var cpObj = this;
            _.defer( function() {
                var initSidebarScroll = cpObj.$dom().closest('.panes').scrollTop();
                var originalChartType = $.subKeyDefined(cpObj._view, 'displayFormat.chartType') ? cpObj._view.displayFormat.chartType : undefined;
                var isBrandNewChart = _.isEmpty(originalChartType);

                ///VALIDATE///

                if ($input.data("origname") == "displayFormat.chartType")
                {
                    var newValues = cpObj._getFormValues();
                    var newChartType = newValues.displayFormat.chartType;
                    var isSameChart = !isBrandNewChart && originalChartType == newChartType;
                    if (cpObj.validateForm() || !isSameChart)
                    {
                        // Need to run the config through chart translation in case
                        // things need to change/update
                        if (_.isFunction(Dataset.chart.types[newChartType].translateFormat))
                        {
                            newValues.displayFormat =
                                Dataset.chart.types[newChartType].translateFormat(cpObj._view,
                                    newValues.displayFormat);
                        }

                        // For a new chart type selection, push the change through even if we don't validate.
                        // The reset will take care of sanitization itself.
                        cpObj._view.update(
                            $.extend(true, {}, newValues, {metadata: cpObj._view.metadata})
                        );
                    }
                    cpObj.reset();
                }

                if (!cpObj.validateForm()) { 
                    cpObj.$dom().closest('.panes').scrollTop(initSidebarScroll);
                    return; 
                }

                //Clean-up sparse inputs in value column repeater so colors sync and merge correctly.
                cpObj.$dom().find("[class*='ValueSelection'] .line").each( function (i, el) {
                    var $line = $(el);
                    if ($.isBlank($line.find('.columnSelectControl').val()))
                    { $line.remove(); }
                });

                //TODO: clean this up a bit, custom content with linkedFields + onlyIfs behave strangely
                //Show the correct color selection method with dsg enabled
                var $dsgColors = cpObj.$dom().find('.colorArray');
                var $colColors = cpObj.$dom().find('.colors');
                //If manually hidden through onlyIf
                if ($dsgColors.css('display') == "none" && $colColors)
                { $colColors.show(); }
                else
                { $colColors.hide(); }

                var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {chart: true}}}},
                    cpObj._getFormValues(), {metadata: cpObj._view.metadata});

                var addColumn = function(colId)
                {
                    var col = cpObj._view.columnForIdentifier(colId);
                    if (_.any(col.renderType.aggregates, function(a) { return a.value == 'sum'; }))
                    col.format.aggregate = 'sum';
                };

                _.each(view.displayFormat.fixedColumns || [], addColumn);

                // Conditionally apply a default pie/donut sort.
                var pieStyleCharts = ['pie', 'donut'];

                var isPieStyleChart = _.include(['pie', 'donut'], view.displayFormat.chartType)
                var isSameChartType = !isBrandNewChart && originalChartType == view.displayFormat.chartType;
                if ( (isBrandNewChart || isSameChartType) && isPieStyleChart &&
                        !$.subKeyDefined(cpObj, '_view.metadata.jsonQuery.order'))
                {
                    view.metadata = $.extend(true, view.metadata, cpObj._view.metadata);
                    view.metadata.jsonQuery.order = cpObj._getPieDefaultOrderBy(view.displayFormat.valueColumns);
                }

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

                cpObj.$dom().closest('.panes').scrollTop(initSidebarScroll);

                cpObj._finishProcessing();
            });
        },

        // NOTE: Keep this in sync with the one in d3.impl.pie.js!
        _getPieDefaultOrderBy: function(valueColumns)
        {
            var cpObj = this;
            return _.map(valueColumns, function(col)
                {
                    return {
                        ascending: false,
                        columnFieldName: cpObj._view.columnForIdentifier(col.fieldName || col.tableColumnId).fieldName
                    };
                });
        }

    }, {
        name: 'new_chart_create'
    },
        'controlPane');

    var isEdit = function(cpObj) {
        return _.include(cpObj._view.metadata.availableDisplayTypes, 'chart');
    };

    var forceOldVisualize = $.urlParam(window.location.href, 'visualize') == 'old' || blist.configuration.oldChartConfigForced;
    var isNewVisualize = $.urlParam(window.location.href, 'visualize') == 'nextgen' || (blist.configuration.newChartConfig && !forceOldVisualize);
    if (!blist.sidebarHidden.visualize.new_chart_create && isNewVisualize) {
        $.gridSidebar.registerConfig('visualize.new_chart_create', 'pane_new_chart_create', 0);
    }

})(jQuery);
