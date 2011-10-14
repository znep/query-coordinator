;(function($)
{
    var noFilterValue = { noFilter: true }; // sentinel value for blank filters

/////////////////////////////////////
// UTIL

    // cleans out filters down to a "minimal effective" state: essentially strips out
    // everything that is a NOOP on the actual filter operation.
    var cleanFilter = function(rootCondition)
    {
        if (!cleanFilter_recurse(rootCondition))
        {
            return {};
        }
        else
        {
            return rootCondition;
        }
    };
    var cleanFilter_recurse = function(condition)
    {
        delete condition.metadata;

        if (!_.isArray(condition.children) || (condition.children.length === 0))
        {
            return false;
        }

        if ((condition.type == 'operator') && _.include(['AND', 'OR'], condition.value))
        {
            var noopChildren = [];
            _.each(condition.children, function(child)
            {
                if (!cleanFilter_recurse(child))
                {
                    condition.children = _.without(condition.children, child);
                }
            });
        }

        return condition.children.length > 0;
    };

    // helper to be sure we're fetching the right subcondition given a subcondition.
    // valid components: 'columnId', 'subcolumn', 'value'
    // subindex can choose specific direct child rather than just taking the first
    var findConditionComponent = function(condition, component, subindex)
    {
        var child = condition.children[subindex || 0];
        if ($.isBlank(child)) { return false; }

        var lookingFor = {
            columnId: 'column',
            subcolumn: 'column',
            value: 'literal'
        };
        var returning = {
            columnId: 'columnId',
            subcolumn: 'value',
            value: 'value'
        };

        var result = [];
        _.each(child.children, function(subchild)
        {
            if (subchild.type == lookingFor[component])
            {
                result.push(subchild[returning[component]]);
            }
        });

        if (result.length === 1)
        {
            return result[0];
        }
        else
        {
            return result;
        }
    };

    var getEditorComponentValue = function($editor)
    {
        var editor = $editor.data('unifiedFilter-editor');
        if (!editor.isValid())
        {
            return null;
        }

        var value = editor.currentValue();
        if (!$.isBlank(value) && !_.isNumber(value) && !_.isString(value) && !_.isBoolean(value) &&
            _.all(_.values(value), function(v) { return $.isBlank(v); }))
        {
            return null;
        }

        return value;
    };

    var getDefaultOperator = function(type)
    {
        return $.subKeyDefined(type, 'filterConditions.details.BETWEEN') ? 'between?' :
            $.subKeyDefined(type, 'filterConditions.details.EQUALS') ? 'EQUALS' :
            'blank?';
    };

    var getOperatorName = function(column, subcolumn, operator)
    {
        if (operator == 'blank?') { return 'is'; }
        var type = column.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + subcolumn))
        { type = type.subColumns[subcolumn]; }
        if (!$.subKeyDefined(type, 'filterConditions')) { return ''; }
        return (type.filterConditions.details[operator] || {}).text || '';
    };

    var scrubFilterOperators = function(fc)
    {
        // we handle blank/notblank separately
        return _.compact(_.map(fc.orderedList, function(op)
                {
                    return (op == 'IS_BLANK' || op == 'IS_NOT_BLANK') ? null :
                        {value: op, text: fc.details[op].text};
                })).concat({ value: 'blank?', text: 'is blank?' });
    };

    var getFilterValue = function(value, column, metadata)
    {
        if (!$.isBlank(metadata.subcolumn) && (metadata.operator != 'blank?') &&
                $.isPlainObject(value))
        { value = value[metadata.subcolumn]; }
        var type = column.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + metadata.subcolumn))
        { type = type.subColumns[metadata.subcolumn]; }
        if (_.isFunction(type.filterValue))
        { value = type.filterValue(value); }
        return value;
    };

    // see if a condition is basically blank
    var hasNoValues = function(condition)
    {
        return (condition.metadata.operator == 'blank?') ||
               (((!_.isArray(condition.children)) ||
                 (condition.children.length === 0)) &&
                (!_.isArray(condition.metadata.customValues) ||
                 (condition.metadata.customValues.length === 0)));
    };

    // determine the default operator for a column given context
    var defaultOperatorForColumn = function(column, subcolumn)
    {
        var type = column.renderType;
        if ($.subKeyDefined(type, 'subColumns.' + subcolumn))
        { type = type.subColumns[subcolumn]; }
        var operator = getDefaultOperator(type);

        if (operator == 'between?')
        {
            // if we got a 'between?' value back on the filter, run some heuristics to determine
            // if equals is appropriate (eg low-cardinality); use between otherwise.
            // 5 is a somewhat arbitrary heuristic constant here
            if ($.subKeyDefined(column, 'cachedContents.top') &&
                ((column.cachedContents.top.length < 20) ||
                 (_.select(column.cachedContents.top, function(v) { return v.count > 1; }).length > 5)))
            {
                operator = 'EQUALS';
            }
            else
            {
                operator = 'BETWEEN';
            }
        }

        return operator;
    };

    // for what we need here, we don't care about the actual logarithm;
    // just the primary exponent and the leading digit.
    var fastLog = function(n)
    {
        var exp = 0;
        var isNegative = (n < 0);

        n = Math.abs(n);

        if ((n < 1) && (n > 0))
        {
            // we're a negative exp
            while (n < 1)
            {
                n *= 10;
                exp--;
            }
        }
        else
        {
            // we're a nice normal number
            while (n >= 10)
            {
                n /= 10;
                exp++;
            }
        }
        return { leading: Math.floor(n), exp: exp, isNegative: isNegative };
    };

    // generate a Date that is rounded to a bounds
    var roundDate = function(date, resolution, direction)
    {
        // clone
        var result = new Date(date.getTime());

        var bottom = (direction == 'down');
        switch (resolution)
        {
            case 'year':
                result.setMonth(bottom ? 0 : 11);
            case 'month':
                if (bottom)
                {
                    result.setDate(1);
                }
                else
                {
                    // we're not as smart as Date, so let's ask it what it thinks
                    // the last day of the month is, the way a baboon might.
                    var expectedMonth = result.getMonth();
                    result.setDate(31);

                    if (result.getMonth() !== expectedMonth)
                    {
                        // well, we got it wrong. thankfully Date has set us straight.
                        result.setDate(31 - result.getDate());
                        result.setMonth(expectedMonth);
                        // we don't have to check or set year here; december is 31 days.
                    }
                }
            case 'day':
            default:
                result.setHours(bottom ? 0 : 23);
                result.setMinutes(bottom ? 0 : 59);
                result.setSeconds(bottom ? 0 : 59);
                result.setMilliseconds(bottom ? 0 : 999);
        }

        return result;
    };

    var getRenderType = function(column, subColumn)
    {
        var type = column.renderType;
        if (!$.isBlank(subColumn))
        {
            if ($.subKeyDefined(column.renderType, 'subColumns.' + subColumn))
            { type = column.renderType.subColumns[subColumn] ; }
            else
            { type = null; }
        }
        return type;
    };

/////////////////////////////////////
// PLUGIN
    $.fn.unifiedFilter = function(options)
    {
        // note: startup tasks are at the bottom.

        var $pane = this;
        var isDirty = false; // keep track of whether we've ever deviated from saved
        var isEdit = false;  // keep track of whether we're in edit mode

        // pull some things out of options for easier access
        var datasets = options.datasets;
        var dataset = datasets[0]; // grab the first one; eg fsckLegacy only makes sense for one anyway
        var filterableColumns = options.filterableColumns; // this will change so save it off
        var rootCondition = options.rootCondition; // note: this may be null/undef

    /////////////////////////////////////
    // DATASET-SPECIFIC UTIL

        // check to make sure we can render the thing; make minor corrections if possible
        var fsckLegacy_v1 = function(rootCondition)
        {
            var compatible = true;

            // make sure we have children before _.each'ing it
            rootCondition.children = rootCondition.children || [];

            // we can handle anything at the top level (AND or OR)
            _.each(rootCondition.children, function(condition, i)
            {
                if ((condition.type == 'operator') && _.include(['AND', 'OR'], condition.value))
                {
                    // we can't handle 3 levels deep....
                    if (_.any(condition.children || [], function(subcondition)
                            { return _.include(['AND', 'OR'], subcondition.value); /* BWWWWAAAAAAAAAAAAHHHHHHHHHHHHH */ }))
                    {
                        var childCompatible = true;

                        // ...unless it's multiple guidedFilter-generated betweens, in which case fix it
                        _.each(condition.children || [], function(subcondition, j)
                        {
                            var checkBetween = fsckLegacy_checkBetween(subcondition);
                            if (_.isObject(checkBetween))
                            {
                                condition.children[j] = checkBetween;
                            }
                            else
                            {
                                return childCompatible = (childCompatible && checkBetween);
                            }
                        });

                        return compatible = (compatible && childCompatible);
                    }

                    // a nested OR can only contain the same operations on the same column
                    var op, col;
                    _.each(condition.children || [], function(subcondition)
                    {
                        if ((subcondition.type !== (op || subcondition.type)) ||
                            (subcondition.columnId !== (col || subcondition.columnId)))
                        {
                            return compatible = false;
                        }
                        op = subcondition.type;
                        col = subcondition.columnId;
                    });
                }
                else
                {
                    // we're something not a conjunction; we should be able to nest this
                    // and everything will be okay
                    rootCondition.children[i] = {
                        type: 'operator',
                        value: 'OR',
                        children: [ condition ]
                    };
                }
            });

            // ensure root node and all direct subchildren have accurate metadata objects
            if (_.isUndefined(rootCondition.metadata))
            {
                rootCondition.metadata = {
                    advanced: true,
                    unifiedVersion: 1
                };
            }
            _.each(rootCondition.children, function(child)
            {
                if (_.isUndefined(child.metadata))
                {
                    var column = dataset.columnForID(findConditionComponent(child, 'columnId'));
                    var operator = child.children[0].value;

                    if (_.include(['IS_BLANK', 'IS_NOT_BLANK'], operator))
                    {
                        operator = 'blank?';
                    }
                    child.metadata = {
                        tableColumnId: column.tableColumnId,
                        operator: operator
                    };
                    var subcolumn = (findConditionComponent(child, 'subcolumn') || '').toLowerCase();
                    if (subcolumn && _.include(_.keys(column.renderType.subColumns || {}), subcolumn)) // sanity check
                    {
                        child.metadata.subcolumn = subcolumn;
                    }
                }
            });

            fsckLegacy_v2(rootCondition);

            return compatible;
        };
        var fsckLegacy_checkBetween = function(condition)
        {
            if ((condition.value == 'AND') && (condition.children.length == 2))
            {
                if (((condition.children[0].value == 'GREATER_THAN_OR_EQUALS') &&
                     (condition.children[1].value == 'LESS_THAN_OR_EQUALS')) ||
                    ((condition.children[0].value == 'LESS_THAN_OR_EQUALS') &&
                     (condition.children[1].value == 'GREATER_THAN_OR_EQUALS')))
                {
                    return {
                        type: 'operator',
                        value: 'BETWEEN',
                        children: [
                            { columnId: findConditionComponent(condition, 'columnId'),
                              type: 'column' },
                            { value: findConditionComponent(condition, 'value', 0),
                              type: 'literal' },
                            { value: findConditionComponent(condition, 'value', 1),
                              type: 'literal' }
                        ]
                    };
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
            return true;
        };

        var fsckLegacy_v2 = function(rootCondition)
        {
            // assumes that we are already v1 compliant

            // the difference between v1 and v2 is fundamentally that any given
            // condition needs to know how to manipulate multiple distinct datasets
            // at any given time. this means that it has to be given a tableColumnId
            // per view-uid, which means that the tableColumnId field is now an obj

            _.each(rootCondition.children, function(condition)
            {
                var newTCIDObj = {};
                newTCIDObj[dataset.publicationGroup] = condition.metadata.tableColumnId;
                condition.metadata.tableColumnId = newTCIDObj;
            });

            rootCondition.metadata.unifiedVersion = 2;

            return true;
        };

    /////////////////////////////////////
    // EXTERNAL BINDINGS

        this.bind('columns_changed', function(event, args)
        {
            filterableColumns = args.columns;

            if ($.isBlank($pane))
            {
                // we don't exist yet.
                return;
            }

            // update filters and remove ones that no longer apply
            $pane.find('.filterLink.columnName').each(function()
            {
                var $this = $(this);
                if (!_.include(filterableColumns, $this.popupSelect_selectedItems()[0]))
                {
                    removeFilter($this.closest('.filterCondition'), true);
                }
                else
                {
                    $this.popupSelect_update(filterableColumns);
                }
            });
        });

        this.bind('revert', function()
        {
            isDirty = false;

            if ($.isBlank($pane))
            {
                // we don't exist yet.
                return;
            }

            $pane
                .find('.noFilterConditionsText').show()
                .siblings().remove();
            renderQueryFilters();
        });

    /////////////////////////////////////
    // RENDER+EVENTS

        // check and render all the filters that are saved on the view
        var renderQueryFilters = function()
        {
            if ($.isBlank(rootCondition) && $.subKeyDefined(dataset, 'query.filterCondition'))
            {
                // extend this only if we have to and it exists (otherwise {} registers as !undefined)
                rootCondition = $.extend(true, {}, dataset.query.filterCondition);
            }

            if (!_.isUndefined(rootCondition))
            {
                // great, we have a real filter to work with.

                // if we have something completely nonsensical, check v1 (which also checks v2)
                // otherwise, check v2
                if (((_.isUndefined(rootCondition.metadata) || _.isNaN(rootCondition.metadata.unifiedVersion)) &&
                        !fsckLegacy_v1(rootCondition)) ||
                    ((rootCondition.metadata.unifiedVersion < 2) && !fsckLegacy_v2(rootCondition)))
                {
                    // this is some legacy or custom format that we're not capable of dealing with
                    throw "Error: We're not currently capable of dealing with this filter."
                }
            }
            else if ($.subKeyDefined(dataset, 'metadata.filterCondition'))
            {
                // we might be looking at a default view with a filterCondition.
                rootCondition = $.extend(true, {}, dataset.metadata.filterCondition);

                // this must be at least a v1 unified filter. verify v2ness
                if (rootCondition.metadata.unifiedVersion < 2)
                {
                    fsckLegacy_v2(rootCondition);
                }
            }
            else
            {
                // we seriously can't find anything. init a new root.
                rootCondition = {
                    type: 'operator',
                    value: 'AND',
                    children: [],
                    metadata: {
                        advanced: true,
                        unifiedVersion: 2
                    }
                };
            }

            // the core server has a nasty habit of stripping empty []'s.
            rootCondition.children = rootCondition.children || [];

            // if there are no conditions at all, force to advanced
            if (rootCondition.children.length == 0)
            {
                rootCondition.metadata.advanced = true;
            }

            // are we advanced?
            $pane.toggleClass('advanced', !!rootCondition.metadata.advanced);
            $pane.toggleClass('notAdvanced', !rootCondition.metadata.advanced);
            $pane.find('.advancedStateLine').removeClass('hide')
                 .filter(!!rootCondition.metadata.advanced ?
                           '.editModeAdvancedOffLine' : '.editModeAdvancedOnLine').addClass('hide');

            // set menu to current state
            $pane.find('.mainFilterOptionsMenu .matchAnyOrAll').removeClass('checked')
                .filter(':has(>a[data-actionTarget=' + rootCondition.value + '])').addClass('checked');

            // now render each filter
            _.each(rootCondition.children, renderCondition);

            // if we have nothing, show the beginner's message
            if (rootCondition.children.length == 0)
            {
                _.defer(function()
                {
                    // hide and show don't work on this loop because the pane itself is hidden
                    $pane.find('.initialFilterMode').show();
                    $pane.find('.normalFilterMode').hide();
                });
            }
        };

        // initial render and setup of filter condition
        var renderCondition = function(condition)
        {
            var metadata = condition.metadata || {};
            // TODO: need to actually merge the datasets (how?) rather than just taking the first blindly
            var column = dataset.columnForTCID(metadata.tableColumnId[dataset.publicationGroup]);

            if (_.isUndefined(column))
            {
                // someone must have changed the type on this or something. abort mission.
                return;
            }

            // render the main bits
            var $filter = $.renderTemplate('filterCondition', { metadata: metadata, column: column }, {
                '.filterCondition@class+': function() { return (metadata.expanded === false) ? 'collapsed' : 'expanded'; },
                '.columnName': 'column.name!',
                '.subcolumnName': function() { return (((column.renderType.subColumns || {})
                        [metadata.subcolumn] || {}).title || '').toLowerCase(); },
                '.operator': function()
                    { return getOperatorName(column, metadata.subcolumn, metadata.operator); }
            });
            var filterUniqueId = 'filter_' + _.uniqueId();
            $filter.find('.autogeneratedCount').val(metadata.includeAuto || 5);

            if (_.include(['BETWEEN', 'GREATER_THAN', 'GREATER_THAN_OR_EQUALS',
                           'LESS_THAN', 'LESS_THAN_OR_EQUALS'], metadata.operator))
            {
                $filter.find('.autogeneratedProperties').html(
                    '<p>Suggested values are determined automatically for this operator type.</p>');
            }

            // hook up events
            $filter.find('.filterRemoveButton').click(function(event)
            {
                event.preventDefault();

                removeFilter($filter);
                parseFilters();
            });
            $filter.find('.filterExpander').click(function(event)
            {
                event.preventDefault();

                if ($filter.hasClass('expanded'))
                {
                    $filter.find('.filterValues').stop().slideUp();
                    $filter.removeClass('expanded').addClass('collapsed');
                }
                else
                {
                    $filter.find('.filterValues').stop().slideDown();
                    $filter.removeClass('collapsed').addClass('expanded');
                }
            });
            $filter.find('.filterLink').click(function(event)
            {
                event.preventDefault();
            });
            $filter.find('.autogeneratedCount').change(function(event)
            {
                metadata.includeAuto = parseInt($(this).val());

                $filter.find('.autogenerated .line').remove();
                addAutogeneratedValues(condition, column, $filter, filterUniqueId, []);
            });

            // hook up popup menus
            $filter.find('.columnName').popupSelect({
                choices: filterableColumns,
                listContainerClass: 'popupColumnSelect',
                onShowCallback: function() { return $pane.hasClass('advanced'); },
                prompt: 'Select a column to filter by:',
                renderer: function(col)
                {
                    return [{
                        tagName: 'span',
                        'class': [ 'iconWrapper', col.renderTypeName ],
                        contents: {
                            tagName: 'span',
                            'class': 'blist-th-icon'
                        }
                    }, {
                        tagName: 'span',
                        'class': 'columnName',
                        contents: $.htmlStrip(col.name)
                    }];
                },
                selectCallback: function(newColumn)
                {
                    if (newColumn == column)
                    {
                        // if the column hasn't changed don't do anything
                        return true;
                    }

                    // make sure we deal with subcolumn in case we've set one
                    if (!$.isBlank(newColumn.renderType.subColumns))
                    {
                        metadata.subcolumn = newColumn.renderType.defaultFilterSubColumn;
                    }
                    else
                    {
                        delete metadata.subcolumn;
                    }

                    if (!$.subKeyDefined(getRenderType(newColumn, metadata.subcolumn),
                        'filterConditions.details.' + metadata.operator))
                    {
                        // the column they'd like to select doesn't support the operator they've selected
                        if (!hasNoValues(condition) &&
                            !confirm('Doing this will remove all values from your filter! Are you sure you wish to do this?'))
                        {
                            return false;
                        }
                        condition.children = [];
                        metadata.operator = defaultOperatorForColumn(newColumn, metadata.subcolumn);
                        metadata.customValues = [];
                    }

                    metadata.tableColumnId[dataset.publicationGroup] = newColumn.tableColumnId;
                    replaceFilter($filter, condition);

                    return true;
                },
                selectedItems: column
            });

            var validOperators = scrubFilterOperators(
                getRenderType(column, metadata.subcolumn).filterConditions);
            $filter.find('.operator').popupSelect({
                choices: validOperators,
                listContainerClass: 'popupOperatorSelect',
                onShowCallback: function() { return $pane.hasClass('advanced'); },
                prompt: 'Select an operation to filter by:',
                renderer: function(operator)
                {
                    return operator.text;
                },
                selectCallback: function(newOperator)
                {
                    if (newOperator == metadata.operator)
                    {
                        return true;
                    }

                    if ((newOperator.value == 'BETWEEN') ||
                        (newOperator.value == 'blank?') ||
                        (metadata.operator == 'BETWEEN') ||
                        (metadata.operator == 'blank?'))
                    {
                        // when going to/from these types, we must blank the values (sorry)
                        if (!hasNoValues(condition) &&
                            !confirm('Doing this will remove all values from your filter! Are you sure you wish to do this?'))
                        {
                            return false;
                        }
                        condition.children = [];
                        metadata.customValues = [];
                        metadata.operator = newOperator.value;

                        replaceFilter($filter, condition);

                        return true;
                    }
                    else
                    {
                        metadata.operator = newOperator.value;
                        $filter.find('.operator').text(getOperatorName(column,
                            metadata.subcolumn, newOperator.value));

                        replaceFilter($filter, condition);

                        return true;
                    }
                },
                selectedItems: _.detect(validOperators, function(operator)
                {
                    return operator.value == metadata.operator;
                })
            });

            if (!$.isBlank(column.renderType.subColumns))
            {
                $filter.find('.subcolumnName').popupSelect({
                    choices: _.keys(column.renderType.subColumns),
                    listContainerClass: 'popupSubcolumnSelect',
                    onShowCallback: function() { return $pane.hasClass('advanced'); },
                    prompt: 'Select the part of ' + $.htmlStrip(column.name) + ' to filter by:',
                    renderer: function(subcolumn)
                    {
                        return ((column.renderType.subColumns[subcolumn] || {}).title || '').toLowerCase();
                    },
                    selectCallback: function(newSubcolumn)
                    {
                        if (newSubcolumn == metadata.subcolumn)
                        {
                            // nothing's changed here. ignore...
                            return true;
                        }

                        if (!$.subKeyDefined(getRenderType(column, newSubcolumn),
                            'filterConditions.details.' + metadata.operator))
                        {
                            // the column they'd like to select doesn't support the operator they've selected
                            if (!hasNoValues(condition) &&
                                !confirm('Doing this will remove all values from your filter! Are you sure you wish to do this?'))
                            {
                                return false;
                            }
                            condition.children = [];
                            metadata.operator = defaultOperatorForColumn(column, newSubcolumn);
                            metadata.customValues = [];
                        }

                        metadata.subcolumn = newSubcolumn;
                        replaceFilter($filter, condition);

                        return true;
                    },
                    selectedItems: metadata.subcolumn
                });

                // also set the class initially
                $filter.addClass(metadata.subcolumn);
            }

            // wire up options menu
            $filter.find('.filterOptionsMenu').menu({
                additionalDataKeys: ['actionTarget'],
                contents: [
                    { text: 'Show suggested values', href: '#toggleSuggestedValues',
                      className: 'toggleAutogenerated' + (_.isUndefined(metadata.includeAuto) ? '' : ' checked') },
                    { divider: true },
                    { text: 'Select one', href: '#selectOne', actionTarget: 'one',
                      className: 'selectOneOrMany' + (metadata.multiSelect === false ? ' checked' : '') },
                    { text: 'Select many', href: '#selectMany', actionTarget: 'many',
                      className: 'selectOneOrMany' + (metadata.multiSelect !== false ? ' checked' : '') },
                    { divider: true },
                    { text: 'Match any condition', href: '#matchAny', actionTarget: 'OR',
                      className: 'matchAnyOrAll' + (condition.value == 'OR' ? ' checked' : '') },
                    { text: 'Match all conditions', href: '#matchAll', actionTarget: 'AND',
                      className: 'matchAnyOrAll' + (condition.value == 'AND' ? ' checked' : '') }
                ],
                menuButtonClass: 'filterOptionsMenuButton options',
                menuButtonContents: ''
            })
                .find('.menuEntry a').click(function(event)
                {
                    event.preventDefault();
                    var $this = $(this);
                    var $entry = $this.closest('.menuEntry');

                    if ($entry.hasClass('toggleAutogenerated'))
                    {
                        if (!_.isUndefined(metadata.includeAuto))
                        {
                            $entry.removeClass('checked');
                            $filter.find('.autogenerated .line').each(function()
                            {
                                var $line = $(this);
                                if (!$line.find('.filterLineToggle').is(':checked'))
                                {
                                    $line.remove();
                                }
                            });

                            delete metadata.includeAuto;
                            parseFilters();
                        }
                        else
                        {
                            $entry.addClass('checked');
                            metadata.includeAuto = 5;
                            var addedValues = addAutogeneratedValues(condition, column, $filter, filterUniqueId, []);

                            if (addedValues.length === 0)
                            {
                                var $noAutoValuesMessage = $.tag({
                                    tagName: 'div',
                                    'class': 'noAutoValuesMessage',
                                    contents: 'There are no suggested values for this column and operator.'
                                });

                                $noAutoValuesMessage.appendTo($filter);
                                $noAutoValuesMessage.slideDown(function()
                                {
                                    setTimeout(function()
                                    {
                                        $noAutoValuesMessage.slideUp(function()
                                        {
                                            $noAutoValuesMessage.remove();
                                        });
                                    }, 2000);
                                });
                            }
                        }
                    }
                    else if ($entry.hasClass('selectOneOrMany'))
                    {
                        metadata.multiSelect = ($this.attr('data-actionTarget') === 'many');

                        replaceFilter($filter, condition);
                    }
                    else if ($entry.hasClass('matchAnyOrAll'))
                    {
                        condition.value = $this.attr('data-actionTarget');

                        $entry.siblings('.matchAnyOrAll').removeClass('checked');
                        $entry.addClass('checked');

                        parseFilters();
                    }
                });

            // dump in values
            if (metadata.multiSelect === false)
            {
                // add in "no filter" line; it's a radioline
                addFilterLine(noFilterValue, column, condition, $filter, filterUniqueId,
                              { selected: !_.isArray(condition.children) ||
                                          (condition.children.length === 0)});
            }

            if (metadata.operator == 'blank?')
            {
                // special case these since they have no actual values
                var cachedContents = column.cachedContents || {};
                addFilterLine({ item: 'blank', count: cachedContents['null'] }, column,
                              condition, $filter, filterUniqueId, { textOnly: true,
                              selected: _.any(condition.children || [], function(child) { return child.value == 'IS_BLANK'; }) });
                addFilterLine({ item: 'not blank', count: cachedContents['non_null'] }, column,
                              condition, $filter, filterUniqueId, { textOnly: true,
                              selected: _.any(condition.children || [], function(child) { return child.value == 'IS_NOT_BLANK'; }) });
            }
            else
            {
                // selected values
                var usedValues = [];
                _.each(condition.children || [], function(child, i)
                {
                    var value = findConditionComponent(condition, 'value', i);
                    usedValues.push(value);

                    var childMetadata = child.metadata || {};
                    addFilterLine({ item: value }, column, condition, $filter, filterUniqueId,
                                  { selected: ((metadata.multiSelect !== false) || (i === 0)),
                                    freeform: !!childMetadata.freeform });
                });

                // autogen values
                if (!_.isUndefined(metadata.includeAuto))
                {
                    addAutogeneratedValues(condition, column, $filter, filterUniqueId, usedValues);
                }

                // custom values
                if (_.isArray(metadata.customValues))
                {
                    _.each(metadata.customValues, function(value)
                    {
                        // don't render dupes
                        if (!_.contains(usedValues, value))
                        {
                            addFilterLine({ item: value }, column, condition, $filter, filterUniqueId);
                        }
                    });
                }

                // freeform line
                addFilterLine('', column, condition, $filter, filterUniqueId, { freeform: true });
            }

            // data
            $filter.data('unifiedFilter-condition', condition);

            // ui
            $pane.find('.filterConditions')
                .children('.noFilterConditionsText').hide().end()
                .append($filter);
            $filter.slideDown();

            return $filter;
        };

        // remove a filter entirely
        var removeFilter = function($filter, skipParseFilters)
        {
            prepFilterRemoval($filter, function()
            {
                rootCondition.children = _.without(rootCondition.children,
                    $filter.data('unifiedFilter-condition'));

                // Sometimes the filter loses its parent before it gets here
                if ($filter.parent().length > 0)
                {
                    if ($filter.siblings().length === 1)
                    {
                        // this is the last filter.
                        $pane.find('.noFilterConditionsText').show();
                    }

                    $filter.remove();
                }

                if (skipParseFilters !== true)
                {
                    parseFilters();
                }
            });
        };

        // replace a filter box with a new one to reflect changes
        var replaceFilter = function($filter, condition)
        {
            prepFilterRemoval($filter, function()
            {
                $filter.replaceWith(renderCondition(condition));
                parseFilters();
            });
        };

        // core of both remove and replaceFilter
        var prepFilterRemoval = function($filter, callback)
        {
            _.defer(function()
            {
                $filter.find('.filterLink').each(function()
                {
                    var tip = $(this).data('popupSelect-tip');
                    if (!_.isUndefined(tip))
                    {
                        tip.destroy();
                    }
                });

                _.defer(callback);
            });
        };

        // add a single filter item to a condition
        var addFilterLine = function(valueObj, column, condition, $filter, filterUniqueId, options)
        {
            var metadata = condition.metadata || {};
            if (_.isUndefined(options)) { options = {}; }

            // add elems
            var $line = $.tag({
                tagName: 'div',
                'class': 'line clearfix'
            });

            var inputId = 'unifiedFilterInput_' + _.uniqueId();
            $line.append($.tag({
                    tagName: 'input',
                    type: (metadata.multiSelect === false) ? 'radio' : 'checkbox',
                    id: inputId,
                    name: filterUniqueId,
                    'class': 'filterLineToggle'
            }));
            if (options.selected === true)
            {
                $line.find('.filterLineToggle').attr('checked', true);
            }
            $line.find(':radio, :checkbox').uniform();

            if (options.autogenerated !== true)
            {
                $line.append($.tag({
                    tagName: 'a',
                    'class': 'removeFilterLine remove',
                    'href': '#remove',
                    contents: {
                        tagName: 'span',
                        'class': 'icon',
                        contents: 'remove'
                    }
                }));
            }

            if (options.freeform)
            {
                var renderType = column.renderType;
                if ($.subKeyDefined(column.renderType, 'subColumns.' + metadata.subcolumn))
                { renderType = column.renderType.subColumns[metadata.subcolumn]; }

                var editorInt = renderType.filterConditions.details[metadata.operator].interfaceType;

                // dump in the appropriate number of editors
                _(renderType.filterConditions.details[metadata.operator].editorCount).times(function(i)
                {
                    if (i > 0)
                    {
                        $line.append($.tag({
                            tagName: 'span',
                            contents: 'and',
                            'class': 'conjunction'
                        }));
                    }

                    $line.append($.tag({
                            tagName: 'div',
                            'class': 'filterValueEditor'
                    }));
                });
                $line.find('.filterValueEditor').each(function(i)
                {
                    var $this = $(this);
                    var editorValue = getFilterValue(_.isArray(valueObj.item) ?
                        valueObj.item[i] : valueObj.item, column, metadata);

                    $this.data('unifiedFilter-editor',
                        $this.blistEditor({type: renderType, editorInterface: editorInt,
                            value: editorValue, row: null,
                            format: column.format, customProperties: {dropDownList: column.dropDownList,
                                baseUrl: column.baseUrl()}}));
                });

                // events
                $line.find('.filterValueEditor input').bind('focus', function()
                {
                    if ($line.nextAll().length === 0)
                    {
                        // this is the last freeform line and the user just selected it; spawn new
                        addFilterLine('', column, condition, $filter, filterUniqueId, { freeform: true });
                    }
                });

                var eventName = 'edit_end';
                if (_.include(['checkbox', 'stars'], column.renderTypeName))
                {
                    eventName = 'editor-change';
                }
                $line.find('.filterValueEditor').bind(eventName, function()
                {
                    var $this = $(this);
                    var $lineToggle = $line.find('.filterLineToggle');

                    if ((eventName == 'edit_end') && ($(document.activeElement).parents().index($this) < 0))
                    {
                        // edit_end was called but we're actually elsewhere.
                        return;
                    }

                    var $allLineToggles = $filter.find('.filterLineToggle');
                    if ($.isBlank(getEditorComponentValue($this)))
                    {
                        var $nextLine = $this.closest('.line').next('.line');
                        if ($nextLine.is(':last-child'))
                        {
                            $nextLine.remove();
                        }

                        if ($lineToggle.is(':checked'))
                        {
                            if (metadata.multiSelect === false)
                            {
                                $allLineToggles.filter(':first').attr('checked', true);
                            }
                            $lineToggle.removeAttr('checked');
                        }
                    }
                    else
                    {
                        // don't check it if we're in edit mode, since edit mode shouldn't filter
                        if ((!$lineToggle.is(':checked')) && !isEdit)
                        {
                            if (metadata.multiSelect === false)
                            {
                                $allLineToggles.removeAttr('checked');
                            }
                            $lineToggle.attr('checked', true);
                        }
                    }
                    $.uniform.update($allLineToggles);
                    parseFilters();
                });
            }
            else if (valueObj == noFilterValue)
            {
                $line.append($.tag({
                    tagName: 'label',
                    'class': 'lineValue noFilterValue',
                    'for': inputId,
                    contents: 'Do not filter'
                }));
                $line.data('unifiedFilter-value', noFilterValue);
            }
            else
            {
                // dump in rendered values
                $line.append($.tag({
                    tagName: 'label',
                    'class': 'lineValue',
                    'for': inputId,
                    contents: _.map($.arrayify(valueObj.item), function(valueObjPart, i)
                    {
                        valueObjPart = getFilterValue(valueObjPart, column, metadata);

                        var response = (i > 0) ? ' and ' : '';
                        if ((options.textOnly === true))
                        {
                            response += valueObjPart.toString();
                        }
                        else
                        {
                            try
                            {
                                response += getRenderType(column, metadata.subcolumn)
                                    .renderer(valueObjPart, column, false, true);
                            }
                            catch (ex)
                            {
                                response += valueObjPart.toString();
                            }
                        }
                        return response;
                    })
                }));

                // if subcolumn, count is invalid since server is counting entire value, not subvalue
                if (!_.isUndefined(valueObj.count) && _.isUndefined(metadata.subcolumn))
                {
                    $line.append($.tag({
                    tagName: 'span',
                    'class': 'lineCount',
                    contents: [ '(', valueObj.count, ')' ]
                    }));
                }

                // data
                $line.data('unifiedFilter-value', valueObj.item);
            }

            // events
            $line.find('.filterLineToggle').bind('change click', _.throttle(parseFilters, 0));

            $line.find('.removeFilterLine').click(function(event)
            {
                event.preventDefault();
                var $line = $(this).closest('.line');

                if (!$line.is(':last-child')) // don't want to delete the last freeform line
                {
                    $line.remove();
                    parseFilters();
                }
            });

            // dom
            if (options.autogenerated === true)
            {
                $filter.find('.filterValues .autogenerated').append($line);
            }
            else
            {
                $filter.find('.filterValues').append($line);
            }
        };

        // add a new condition
        var addNewCondition = function(column)
        {
            var newCondition = {
                children: [],
                type: 'operator',
                value: 'OR',
                metadata: {}
            };

            if ($.isBlank(column))
            {
                // we weren't given a column to start with; pick one that's filterable--
                // ideally one that's not been filtered yet
                if (filterableColumns.length === 0)
                {
                    // nothing to filter!
                    return;
                }
                column = _.detect(filterableColumns, function(col)
                {
                    return !_.any(rootCondition.children, function(cond)
                    {
                        return cond.metadata.tableColumnId[dataset.publicationGroup] == col.tableColumnId;
                    })
                });
                if ($.isBlank(column))
                {
                    column = filterableColumns[0];
                }
            }
            newCondition.metadata.tableColumnId = newCondition.metadata.tableColumnId || {};
            newCondition.metadata.tableColumnId[dataset.publicationGroup] = column.tableColumnId;

            // do we have a composite column? if so get the most relevant subcolumn.
            if (!$.isBlank(column.renderType.subColumns))
            {
                newCondition.metadata.subcolumn = column.renderType.defaultFilterSubColumn;
            }

            // okay, we have a column. now figure out what to filter it on.
            newCondition.metadata.operator = defaultOperatorForColumn(column,
                newCondition.metadata.subcolumn);

            rootCondition.children.push(newCondition);
            renderCondition(newCondition);
            return newCondition;
        };

        // add autogenerated values to a condition
        var addAutogeneratedValues = function(condition, column, $filter, filterUniqueId, usedValues)
        {
            var metadata = condition.metadata || {};

            var internallyUsedValues = [];

            if (_.include(['EQUALS', 'NOT_EQUALS'], metadata.operator) &&
                $.subKeyDefined(column, 'cachedContents.top'))
            {
                var topCount = Math.min(metadata.includeAuto || 5, column.cachedContents.top.length);

                // iter through originals with count
                _(topCount).times(function(i)
                {
                    var topValue = getFilterValue(column.cachedContents.top[i].item, column, metadata);

                    if (_.isUndefined(topValue))
                    {
                        return;
                    }
                    if (!_.contains(usedValues, topValue))
                    {
                        addFilterLine({item: topValue}, column, condition, $filter,
                                      filterUniqueId, { autogenerated: true });

                        internallyUsedValues.push(topValue);
                    }
                });
            }
            else if (_.include(['BETWEEN', 'LESS_THAN', 'LESS_THAN_OR_EQUALS',
                                'GREATER_THAN', 'GREATER_THAN_OR_EQUALS'], metadata.operator) &&
                     $.subKeyDefined(column, 'cachedContents.largest')) // assume smallest exists
            {
                if (column.cachedContents.smallest == column.cachedContents.largest)
                {
                    // really nothing to be between.
                    return;
                }

                // whatever we decide to do, it'll come down to some range boundaries
                var rangeBoundaries = [];

                if (_.include(['number', 'money', 'percent'], column.renderTypeName))
                {
                    // dealing with a numeric type here
                    var range = column.cachedContents.largest - column.cachedContents.smallest;
                    var lowerBound = fastLog(column.cachedContents.smallest);
                    var upperBound = fastLog(column.cachedContents.largest);

                    if (range > 5000) // 5000 is somewhat arbitrary but informed by Benford's Law
                    {
                        // we're at a large enough range that we should just use a logarithmic scale

                        // adjust to the outside of our ranges
                        if (lowerBound.isNegative)  { lowerBound.exp++; }
                        if (!upperBound.isNegative) { upperBound.exp++; }

                        // negative numbers
                        if (lowerBound.isNegative)
                        {
                            for (var i = lowerBound.exp; i >= (upperBound.isNegative ? upperBound.exp : 1); i--)
                            {
                                rangeBoundaries.push(-Math.pow(10, i));
                            }
                        }
                        // zero
                        if (lowerBound.isNegative && !upperBound.isNegative)
                        {
                            rangeBoundaries.push(0);
                        }
                        // positive numbers
                        if (!upperBound.isNegative)
                        {
                            for (var i = (lowerBound.isNegative ? 1 : lowerBound.exp); i <= upperBound.exp; i++)
                            {
                                rangeBoundaries.push(Math.pow(10, i));
                            }
                        }
                    }
                    else
                    {
                        // we're a pretty small range, so just divide somewhat evenly into 5ish buckets
                        var adjustedLowerBound =
                            (lowerBound.isNegative ? (lowerBound.leading + 1) : lowerBound.leading) *
                            Math.pow(10, lowerBound.exp);

                        rangeBoundaries.push(adjustedLowerBound);

                        var interval = (column.cachedContents.largest - adjustedLowerBound) / metadata.includeAuto;

                        if (interval > 20)
                        {
                            // we don't want to end up with ranges that look nonsensically 
                            // specific like 1,236,946.23, so just bump the interval up to
                            // the nearest nice value
                            var intervalLog = fastLog(interval);
                            interval = (intervalLog.leading + 1) * Math.pow(10, intervalLog.exp);
                        }

                        var lastValue = adjustedLowerBound;
                        while (lastValue < column.cachedContents.largest)
                        {
                            lastValue += interval;
                            rangeBoundaries.push(lastValue);
                        }
                    }
                }
                else if (_.include(['date', 'calendar_date'], column.renderTypeName))
                {
                    // dealing with a date thing here
                    var start = column.cachedContents.smallest;
                    var end = column.cachedContents.largest;

                    // epoch ms if relevant
                    if (_.isNumber(start)) { start *= 1000; }
                    if (_.isNumber(end))   { end *= 1000; }
                    var startDate = new Date(start);
                    var endDate = new Date(end);

                    var day = 86400000; // in ms

                    var range = (endDate.getTime() - startDate.getTime()) / day;

                    var roundingFactor = '';
                    var interval = 0;

                    if      (range < 8)    { roundingFactor = 'day';   interval = 1;  } // days
                    else if (range < 32)   { roundingFactor = 'day';   interval = 7;  } // weeks
                    else if (range < 196)  { roundingFactor = 'month'; interval = 1;  } // months
                    else if (range < 367)  { roundingFactor = 'month'; interval = 3;  } // quarters
                    else if (range < 3670) { roundingFactor = 'year';  interval = 1;  } // years
                    else                   { roundingFactor = 'year';  interval = 10; } // decades

                    startDate = roundDate(startDate, roundingFactor, 'down');

                    rangeBoundaries.push(startDate.getTime());

                    var dateMethods = {
                        day: 'Date',
                        month: 'Month',
                        year: 'FullYear'
                    }

                    var incrementingDate = new Date(startDate.getTime());
                    while (incrementingDate < endDate)
                    {
                        incrementingDate['set' + dateMethods[roundingFactor]](
                            incrementingDate['get' + dateMethods[roundingFactor]]() + interval);
                        rangeBoundaries.push(incrementingDate.getTime());
                    }

                    // remove the last thing and round tighter.
                    rangeBoundaries.pop();
                    rangeBoundaries.push(roundDate(endDate, roundingFactor, 'up').getTime());

                    // massage the format given the type
                    if (!_.isUndefined(column.renderType.stringFormat))
                    {
                        rangeBoundaries = _.map(rangeBoundaries, function(d)
                        {
                            return new Date(d).toString(column.renderType.stringFormat);
                        });
                    }
                    else
                    {
                        rangeBoundaries = _.map(rangeBoundaries, function(d)
                        {
                            return d / 1000;
                        });
                    }
                }

                // we have boundaries, now do some massaging depending on
                // what operator we have.
                if (_.include(['LESS_THAN', 'LESS_THAN_OR_EQUALS'], metadata.operator))
                {
                    rangeBoundaries.shift(); // doesn't make sense to filter below min
                }
                else if (_.include(['GREATER_THAN', 'GREATER_THAN_OR_EQUALS'], metadata.operator))
                {
                    rangeBoundaries.pop(); // doesn't make sense to filter above max
                }

                if (metadata.operator == 'BETWEEN')
                {
                    while (rangeBoundaries.length > 1)
                    {
                        var value = [ rangeBoundaries[0], rangeBoundaries[1] ];
                        internallyUsedValues.push(value);
                        addFilterLine({ item: value }, column, condition, $filter,
                                      filterUniqueId, { autogenerated: true });
                        rangeBoundaries.shift();
                    }
                }
                else
                {
                    while (rangeBoundaries.length > 0)
                    {
                        var value = rangeBoundaries[0];
                        internallyUsedValues.push(value);
                        addFilterLine({ item: value }, column, condition, $filter,
                                      filterUniqueId, { autogenerated: true });
                        rangeBoundaries.shift();
                    }
                }
            }

            return internallyUsedValues;
        };

        var hookUpSidebarActions = function()
        {
            // advanced toggle
            $pane.find('.advancedStateLink').click(function(event)
            {
                event.preventDefault();
                var isAdvanced = $(this).hasClass('advancedOnLink');

                // update pane state
                $pane.toggleClass('advanced', isAdvanced || isEdit);
                $pane.toggleClass('notAdvanced', !isAdvanced && !isEdit);
                rootCondition.metadata.advanced = isAdvanced;

                // update edit mode messages
                $pane.find('.advancedStateLine').removeClass('hide')
                     .filter(isAdvanced ? '.editModeAdvancedOffLine' : '.editModeAdvancedOnLine').addClass('hide');

                parseFilters();
            });

            // main menu
            $pane.find('.mainFilterOptionsMenu').menu({
                additionalDataKeys: ['actionTarget'],
                contents: [
                    { text: 'Match any condition', href: '#matchAny', actionTarget: 'OR', className: 'matchAnyOrAll' },
                    { text: 'Match all conditions', href: '#matchAll', actionTarget: 'AND', className: 'matchAnyOrAll' }
                ],
                menuButtonClass: 'filterOptionsMenuButton options',
                menuButtonContents: ''
            })
                .find('.menuEntry a').click(function(event)
                {
                    event.preventDefault();
                    var $this = $(this);
                    var $entry = $this.closest('.menuEntry');

                    rootCondition.value = $this.attr('data-actionTarget');

                    $entry.siblings('.matchAnyOrAll').removeClass('checked');
                    $entry.addClass('checked');

                    parseFilters();
                });

            // add condition button
            $pane.find('.addFilterConditionButton').click(function(event)
            {
                event.preventDefault();
                addNewCondition();
                $pane.find('.initialFilterMode').hide();
                $pane.find('.normalFilterMode').show();
            });

            // publisher edit mode
            $pane.find('.editFilter').click(function(event)
            {
                event.preventDefault();

                if (dataset.temporary)
                {
                    if (confirm('You will lose any unsaved changes if you choose to continue. ' +
                                'Please save any changes you wish to keep before proceeding.'))
                    {
                        // we need to first reset to a clean state, to avoid
                        // saving changes we don't mean to
                        dataset.reload()
                    }
                    else
                    {
                        return;
                    }
                }

                $pane.find('.initialFilterMode').hide();
                $pane.find('.normalFilterMode').show();
                $pane.removeClass('notAdvanced').addClass('editMode advanced');
                $pane.find('.editModeMessage').effect('highlight', {}, 3000);
                isEdit = true;
            });

            $pane.find('.saveEditedFilter').click(function(event)
            {
                event.preventDefault();
                var $this = $(this);

                $this.addClass('disabled');
                $pane.find('.savingEditedFilterSpinner').css('display', 'inline-block');

                parseFilters(); // be absolutely sure we got everything

                // if we're a default view, move off the filterCondition from query to metadata
                if (dataset.type == 'blist')
                {
                    dataset.update({ metadata:
                        $.extend({}, dataset.metadata, { filterCondition: rootCondition }) });

                    // just to be sure:
                    var query = dataset.query;
                    delete query.filterCondition;
                    dataset.update({ query: query });
                }
                else
                {
                    dataset.update({ query:
                        $.extend({}, dataset.query, { filterCondition: rootCondition }) });
                }

                dataset.save(function()
                {
                    $pane.removeClass('editMode');
                    isEdit = false;

                    $this.removeClass('disabled');
                    $pane.find('.savingEditedFilterSpinner').hide();
                });
            });

            $pane.find('.discardEditedFilter').click(function(event)
            {
                event.preventDefault();

                $pane.removeClass('editMode');
                isEdit = false;

                dataset.update({}); // hack to force temporary
                dataset.reload();
            });
        };

    /////////////////////////////////////
    // PARSING + DATASET

        // figure out what they entered and drop it into the dataset object
        var parseFilters = function()
        {
            var $filterConditions = $pane.find('.filterCondition');
            $filterConditions.removeClass('countInvalid');

            // TODO: rethink how to merge into existing filters (mount point)
            var datasetConditions = {};
            _.each(datasets, function(ds)
            {
                datasetConditions[ds.id] = {
                    type: 'operator',
                    value: rootCondition.value,
                    children: [],
                    metadata: {
                        unifiedVersion: 2
                    }
                };
            });

            $filterConditions.each(function()
            {
                var $filterCondition = $(this);
                var condition = $filterCondition.data('unifiedFilter-condition');
                var metadata = condition.metadata || {};

                var children = [];
                var column = dataset.columnForTCID(metadata.tableColumnId[dataset.publicationGroup]);
                var columnDefinition = {
                    type: 'column',
                    //columnId: column.id
                    columnFieldName: column.fieldName
                };

                if (!_.isUndefined(metadata.subcolumn))
                {
                    columnDefinition.value = metadata.subcolumn;
                }

                var $lineToggles = $filterCondition.find('.filterLineToggle');

                $lineToggles.filter(':checked').each(function()
                {
                    var $line = $(this).closest('.line');
                    var value = $line.data('unifiedFilter-value');

                    if (value == noFilterValue)
                    {
                        // they want no filter here
                        return;
                    }
                    else if (metadata.operator == 'blank?')
                    {
                        // is_blank and is_not_blank are special
                        children.push({
                            type: 'operator',
                            value: 'IS_' + value.replace(' ', '_').toUpperCase(),
                            children: [ columnDefinition ]
                        });
                        return;
                    }
                    else if ($.isBlank(value))
                    {
                        // must be a custom line
                        value = [];
                        $line.find('.filterValueEditor').each(function()
                        {
                            value.push(getEditorComponentValue($(this)));
                        });

                        if (_.any(value, $.isBlank))
                        {
                            // they're not done editing yet — something is blank.
                            return;
                        }
                    }

                    children.push({
                        type: 'operator',
                        value: metadata.operator,
                        metadata: {
                            freeform: ($line.find('.filterValueEditor').length > 0)
                        },
                        children: [columnDefinition].concat(_.map($.arrayify(value), function(v)
                        {
                            return {
                                type: 'literal',
                                value: getFilterValue(v, column, metadata)
                            };
                        }))
                    });
                });

                condition.metadata.customValues = [];
                $lineToggles.filter(':not(:checked)').each(function()
                {
                    var $line = $(this).closest('.line');

                    if (!$line.parents().hasClass('autogenerated'))
                    {
                        // if this is a custom value the user specified, add it to the metadata
                        var value = $line.data('unifiedFilter-value');
                        if (value == noFilterValue)
                        {
                            // ignore this line
                            return;
                        }

                        if ($.isBlank(value))
                        {
                            // must be a custom value line
                            value = [];
                            $line.find('.filterValueEditor').each(function()
                            {
                                value.push(getEditorComponentValue($(this)));
                            });

                            if (_.any(value, $.isBlank))
                            {
                                // they're not done editing yet — something is blank.
                                return;
                            }
                        }

                        condition.metadata.customValues.push(value);
                    }
                });

                // populate the canonical condition
                condition.children = $.extend(true, [], children);

                // go through each dataset we have, update if necessary
                _.each(datasets, function(ds)
                {
                    if (!$.subKeyDefined(ds, 'query.filterCondition') ||
                        (ds.query.filterCondition !== rootCondition))
                    {
                        // we're not the default filter, need to push this on
                        /*columnDefinition.columnId =
                            ds.columnForTCID(metadata.tableColumnId[ds.publicationGroup]).id;*/

                        var dsCondition = $.extend({}, condition);
                        dsCondition.children = $.extend(true, [], children);
                        datasetConditions[ds.id].children.push(dsCondition);
                    }
                });

                if (children.length > 0)
                {
                    $filterCondition.siblings().addClass('countInvalid');
                }
            });

            // now let's see how clean we are. if we're clean, no need to update the dataset.
            // TODO: can't really just blindly iterate through this with one isDirty. rethink.
            _.each(datasets, function(ds)
            {
                if (isDirty ||
                    !_.isEqual(cleanFilter($.extend(true, {}, ds.query.filterCondition)),
                               cleanFilter($.extend(true, {}, rootCondition))))
                {
                    var processedFilterCondition = rootCondition;

                    if (!$.subKeyDefined(ds, 'query.filterCondition') ||
                        (ds.query.filterCondition !== rootCondition))
                    {
                        // we're not on the default filter; need to use specific condition
                        processedFilterCondition = datasetConditions[ds.id];
                    }

                    // fire it off
                    ds.update(
                        { query: $.extend({}, ds.query,
                            { filterCondition: $.extend(true, {}, processedFilterCondition) })});

                    isDirty = true;
                }
            });
        };

    /////////////////////////////////////
    // GEARS IN MOTION

        hookUpSidebarActions();
        renderQueryFilters();
    };
})(jQuery);
