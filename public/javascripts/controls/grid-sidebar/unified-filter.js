;(function($)
{
    if (blist.sidebarHidden.filter &&
        blist.sidebarHidden.filter.filterDataset) { return; }

    var $pane;
    var noFilterValue = { noFilter: true }; // sentinel value for blank filters

/////////////////////////////////////
// DEFS

    var defaultOperator = {
        text: 'EQUALS',
        html: 'EQUALS',
        number: 'between?',
        date: 'between?',
        calendar_date: 'between?',
        photo: 'blank?',
        photo_obsolete: 'blank?',
        money: 'between?',
        phone: 'EQUALS',
        checkbox: 'EQUALS',
        flag: 'EQUALS',
        stars: 'EQUALS',
        percent: 'between?',
        url: 'EQUALS',
        'document': 'blank?',
        document_obsolete: 'blank?',
        'location': 'EQUALS',
        tag: 'CONTAINS',
        email: 'EQUALS',
        picklist: 'EQUALS',
        drop_down_list: 'EQUALS',
        dataset_link: 'EQUALS' // ??
    };
    var operatorNames = {
        EQUALS: 'is',
        NOT_EQUALS: 'is not',
        LESS_THAN: 'is less than',
        LESS_THAN_OR_EQUALS: 'is less than or equal to',
        GREATER_THAN: 'is greater than',
        GREATER_THAN_OR_EQUALS: 'is greater than or equal to',
        STARTS_WITH: 'starts with',
        CONTAINS: 'contains',
        BETWEEN: 'is between',
        'blank?': 'is'
    };
    var subcolumnNames = {
        phone_number: 'number',
        phone_type: 'type',
        url: 'url',
        description: 'description',
        human_address: 'address',
        latitude: 'latitude',
        longitude: 'longitude'
    };
    var defaultSubcolumn = {
        phone: 'phone_type',
        'location': 'human_address',
        url: 'description'
    };
    var filterableTypes = _.compact(_.map(blist.data.types, function(t, n)
    {
        return !$.isBlank(t.filterConditions) ? n : null;
    }));

/////////////////////////////////////
// BINDINGS

    var filterableColumns = blist.dataset.columnsForType(filterableTypes);
    blist.dataset.bind('columns_changed', function()
    {
        filterableColumns = blist.dataset.columnsForType(filterableTypes);

        if ($.isBlank($pane))
        {
            // we don't exist yet.
            return;
        }

        // update filters and remove ones that no longer apply
        var needsParse = false;
        $pane.find('.filterLink.columnName').each(function()
        {
            var $this = $(this);
            if (!_.include(filterableColumns, $this.popupSelect_selectedItems()[0]))
            {
                var $filter = $this.closest('.filterCondition');

                var rootCondition = $pane.data('unifiedFilter-root');
                rootCondition.children = _.without(rootCondition.children,
                    $filter.data('unifiedFilter-condition').condition);

                if ($filter.siblings().length === 1)
                {
                    // this is the last filter.
                    $pane.find('.noFilterConditionsText').show();
                }

                $filter.remove();
                needsParse = true;
            }
            else
            {
                $this.popupSelect_update(filterableColumns);
            }
        });

        if (needsParse) { parseFilters(); }
    });

    blist.dataset.bind('clear_temporary', function()
    {
        $pane
            .find('.noFilterConditionsText').show()
            .siblings().remove();
        renderQueryFilters();
    });

/////////////////////////////////////
// UTIL

    // check to make sure we can render the thing; make minor corrections if possible
    var fsckLegacy = function(rootCondition)
    {
        var compatible = true;

        // we can handle anything at the top level (AND or OR)
        _.each(rootCondition.children, function(condition, i)
        {
            if (_.include(['AND', 'OR'], condition.type))
            {
                // we can't handle 3 levels deep....
                if (_.any(condition.children, function(subcondition)
                        { return _.include(['AND', 'OR'], subcondition.value); /* BWWWWAAAAAAAAAAAAHHHHHHHHHHHHH */ }))
                {
                    var childCompatible = true;

                    // ...unless it's multiple guidedFilter-generated betweens, in which case fix it
                    _.each(condition.children, function(subcondition, j)
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
                _.each(condition.children, function(subcondition)
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
                var column = blist.dataset.columnForID(findConditionComponent(child, 'columnId'));
                child.metadata = {
                    tableColumnId: column.tableColumnId,
                    operator: child.children[0].value
                };
                var subcolumn = findConditionComponent(child, 'subcolumn');
                if (subcolumn && _.include(column.subColumnTypes || [], subcolumn)) // sanity check
                {
                    child.metadata.subcolumn = subcolumn;
                }
            }
        });

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
        if (!$.isBlank(value) && !_.isNumber(value) && !_.isString(value) &&
            _.all(_.values(value), function(v) { return $.isBlank(v); }))
        {
            return null;
        }

        return value;
    };

    var scrubFilterOperators = function(operators)
    {
        // we handle blank/notblank separately
        return _.reject(operators, function(operator)
        {
            return (operator.value == 'IS_NOT_BLANK') || (operator.value == 'IS_BLANK');
        }).concat({ value: 'blank?', text: 'is blank?' });
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

/////////////////////////////////////
// RENDER+EVENTS

    // check and render all the filters that are saved on the view
    var renderQueryFilters = function()
    {
        var rootCondition;
        if (_.isUndefined(blist.dataset.query.filterCondition))
        {
            // init a new root
            rootCondition = {
                type: 'operator',
                value: 'AND',
                children: [],
                metadata: {
                    advanced: true,
                    unifiedVersion: 1
                }
            };
        }
        else
        {
            rootCondition = $.extend(true, {}, blist.dataset.query.filterCondition);

            if ((_.isUndefined(rootCondition.metadata) || (rootCondition.metadata.unifiedVersion !== 1)) &&
                !fsckLegacy(rootCondition))
            {
                // this is some legacy or custom format that we're not capable of dealing with
                throw "Error: We're not currently capable of dealing with this filter."
            }
        }

        // are we advanced?
        $pane.toggleClass('advanced', !!rootCondition.metadata.advanced);
        $pane.toggleClass('notAdvanced', !rootCondition.metadata.advanced);

        // set menu to current state
        $('.mainFilterOptionsMenu .matchAnyOrAll').removeClass('checked')
            .filter('[data-actionTarget=' + rootCondition.value + ']').addClass('checked');

        // data
        $pane.data('unifiedFilter-root', rootCondition);

        // now render each filter
        _.each(rootCondition.children || [], renderCondition);
    };

    // initial render and setup of filter condition
    var renderCondition = function(condition)
    {
        var metadata = condition.metadata || {};
        var column = blist.dataset.columnForTCID(metadata.tableColumnId);
        // render the main bits
        var $filter = $.renderTemplate('filterCondition', { metadata: metadata, column: column }, {
            '.filterCondition@class+': function() { return (metadata.expanded === false) ? 'collapsed' : 'expanded'; },
            '.columnName': 'column.name!',
            '.subcolumnName': function() { return subcolumnNames[metadata.subcolumn] || ''; },
            '.operator': function() { return operatorNames[metadata.operator]; }
        });

        // hook up events
        $filter.find('.filterRemoveButton').click(function(event)
        {
            event.preventDefault();

            var rootCondition = $pane.data('unifiedFilter-root');
            rootCondition.children = _.without(rootCondition.children,
                $filter.data('unifiedFilter-condition').condition);

            if ($filter.siblings().length === 1)
            {
                // this is the last filter.
                $pane.find('.noFilterConditionsText').show();
            }

            // before we can remove we have to destroy all bt's
            $filter.find('.filterLink').each(function()
            {
                var tip = $(this).data('popupSelect-tip');
                if (!_.isUndefined(tip))
                {
                    tip.destroy();
                }
            });

            $filter.remove();
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

        // hook up popup menus
        $filter.find('.columnName').popupSelect({
            choices: filterableColumns,
            listContainerClass: 'popupColumnSelect',
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

                if (!_.include(_.pluck(newColumn.renderType.filterConditions, 'value'), metadata.operator))
                {
                    // the column they'd like to select doesn't support the operator they've selected
                    if (!hasNoValues(condition) &&
                        !confirm('Doing this will remove all values from your filter! Are you sure you wish to do this?'))
                    {
                        return false;
                    }
                    condition.children = [];
                    metadata.operator = defaultOperator[newColumn.renderTypeName];
                    metadata.customValues = [];
                }

                // make sure we deal with subcolumn in case we've set one
                if (_.isArray(newColumn.subColumnTypes))
                {
                    metadata.subcolumn = defaultSubcolumn[newColumn.renderTypeName];
                }
                else
                {
                    delete metadata.subcolumn;
                }

                metadata.tableColumnId = newColumn.tableColumnId;
                _.defer(function()
                {
                    // column select tip fails to close if the parent is removed first
                    $filter.replaceWith(renderCondition(condition));
                    parseFilters();
                });

                return true;
            },
            selectedItems: column
        });

        var validOperators = scrubFilterOperators(column.renderType.filterConditions);
        $filter.find('.operator').popupSelect({
            choices: validOperators,
            listContainerClass: 'popupOperatorSelect',
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

                    _.defer(function()
                    {
                        // column select tip fails to close if the parent is removed first
                        $filter.replaceWith(renderCondition(condition));
                        parseFilters();
                    });

                    return true;
                }
                else
                {
                    metadata.operator = newOperator.value;
                    $filter.find('.operator').text(operatorNames[metadata.operator]);
                    parseFilters();

                    return true;
                }
            },
            selectedItems: _.detect(validOperators, function(operator)
            {
                return operator.value == metadata.operator;
            })
        });

        if (!_.isUndefined(column.subColumnTypes))
        {
            $filter.find('.subcolumnName').popupSelect({
                choices: column.subColumnTypes,
                listContainerClass: 'popupSubcolumnSelect',
                prompt: 'Select the part of ' + $.htmlStrip(column.name) + ' to filter by:',
                renderer: function(subcolumn)
                {
                    return subcolumnNames[subcolumn];
                },
                selectCallback: function(newSubcolumn)
                {
                    if (newSubcolumn == metadata.subcolumn)
                    {
                        // nothing's changed here. ignore...
                        return true;
                    }

                    $filter.removeClass(metadata.subcolumn);
                    metadata.subcolumn = newSubcolumn;
                    $filter.addClass(metadata.subcolumn);
                    $filter.find('.subcolumnName').text(subcolumnNames[metadata.subcolumn]);

                    parseFilters();
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
                // { text: 'Suggested values', href: '#toggleSuggestedValues',
                //   className: (metadata.includeAuto > 0 ? 'checked' : '') },
                // { divider: true },
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

                if ($entry.hasClass('selectOneOrMany'))
                {
                    metadata.multiSelect = ($this.attr('data-actionTarget') === 'many');

                    $filter.replaceWith(renderCondition(condition));
                    parseFilters();
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
        var filterUniqueId = 'filter_' + _.uniqueId();

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
                          selected: _.any(condition.children, function(child) { return child.value == 'IS_BLANK'; }) });
            addFilterLine({ item: 'not blank', count: cachedContents['non_null'] }, column,
                          condition, $filter, filterUniqueId, { textOnly: true,
                          selected: _.any(condition.children, function(child) { return child.value == 'IS_NOT_BLANK'; }) });
        }
        else
        {
            // selected values
            var usedValues = [];
            _.each(condition.children || [], function(child, i)
            {
                var value = findConditionComponent(condition, 'value', i);
                var childMetadata = child.metadata || {};
                addFilterLine({ item: value }, column, condition, $filter, filterUniqueId,
                              { selected: ((metadata.multiSelect !== false) || (i === 0)),
                                freeform: !!childMetadata.freeform });
                usedValues.push(value);
            });
            // autogen values
            if (!_.isUndefined(column.cachedContents) && !_.isUndefined(column.cachedContents.top))
            {
                // TODO: This only handles EQUALS filters
                
                var topCount = Math.min(metadata.includeAuto || 0, column.cachedContents.length);

                // iter through originals with count
                _(topCount).times(function(i)
                {
                    if (!_.contains(usedValues, column.cachedContents.top[i].item))
                    {
                        addFilterLine(column.cachedContents.top[i], column, condition, $filter,
                                      filterUniqueId, { autogenerated: true });
                    }
                });

                // save off the item values to compare with later
                usedValues = usedValues.concat(_.pluck(column.cachedContents.top.slice(0, topCount), 'item'));
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
        $filter.data('unifiedFilter-condition', {
            column: column,
            condition: condition
        });

        // ui
        $pane.find('.filterConditions')
            .children('.noFilterConditionsText').hide().end()
            .append($filter);
        $filter.slideDown();

        // updateFilter($filter); // do we need?

        return $filter;
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

        if (options.freeform)
        {
            var renderTypeName = column.renderTypeName;
            if (_.include(['tag', 'html', 'email', 'dataset_link'], renderTypeName))
            {
                // flatten these down to text instead
                renderTypeName = 'text';
            }

            // dump in the appropriate number of editors
            _((metadata.operator == 'BETWEEN') ? 2 : 1).times(function(i)
            {
                if (i > 0)
                {
                    $line.find('.filterValueEditor:first').after($.tag({
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
                var editorValue = _.isArray(valueObj) ? valueObj.item[i] : valueObj.item;
                if (!_.isUndefined(metadata.subcolumn))
                {
                    var newValue = {};
                    newValue[metadata.subcolumn] = editorValue;
                    editorValue = newValue;
                }

                $this.data('unifiedFilter-editor',
                    $this.blistEditor({ row: null, column: column, typeName: renderTypeName,
                                        value: editorValue }));
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
                var $lineToggle = $line.find(':checkbox, :radio');

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
                    if (!$lineToggle.is(':checked'))
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
                    return ((i > 0) ? ' and ' : '') +
                           ((options.textOnly === true) ? valueObjPart :
                               column.renderType.renderer(valueObjPart, column));
                })
            }));
            if (!_.isUndefined(valueObj.count))
            {
                $line.append($.tag({
                tagName: 'span',
                'class': 'lineCount',
                contents: [ '(', valueObj.count, ')' ]
                }));
            }
            if (options.autogenerated === true)
            {
                $line.addClass('autogenerated');
            }

            // data
            $line.data('unifiedFilter-value', valueObj.item);
        }

        // events
        $line.find('.filterLineToggle').bind('change click', _.throttle(parseFilters, 0));

        // dom
        $filter.find('.filterValues').append($line);
    };

    // add a new condition
    var addNewCondition = function(rootCondition, column)
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
            var columns = blist.dataset.columnsForType(filterableTypes);
            if (columns.length === 0)
            {
                // nothing to filter!
                return;
            }
            column = _.detect(columns, function(col)
            {
                return !_.any(rootCondition.children, function(cond)
                {
                    return cond.metadata.tableColumnId == col.tableColumnId;
                })
            });
            if ($.isBlank(column))
            {
                column = columns[0];
            }
        }
        newCondition.metadata.tableColumnId = column.tableColumnId;

        // do we have a composite column? if so get the most relevant subcolumn.
        if (_.isArray(column.subColumnTypes))
        {
            newCondition.metadata.subcolumn = defaultSubcolumn[column.renderTypeName];
        }

        // okay, we have a column. now figure out what to filter it on.
        newCondition.metadata.operator = defaultOperator[column.renderTypeName] || 'blank?';

        if (newCondition.metadata.operator == 'between?')
        {
            // if we got a 'between?' value back on the filter, run some heuristics to determine
            // if equals is appropriate (eg low-cardinality); use between otherwise.
            // 5 is a somewhat arbitrary heuristic constant here
            if (!_.isUndefined(column.cachedContents) &&
                !_.isUndefined(column.cachedContents.top) &&
                ((column.cachedContents.top.length < 20) ||
                 (_.select(column.cachedContents.top, function(v) { return v.count > 1; }).length > 5)))
            {
                newCondition.metadata.operator = 'EQUALS';
            }
            else
            {
                newCondition.metadata.operator = 'BETWEEN';
            }
        }

        rootCondition.children.push(newCondition);
        renderCondition(newCondition);
        return newCondition;
    };

    var hookUpSidebarActions = function()
    {
        // advanced toggle
        $pane.find('.advancedLine a').click(function(event)
        {
            event.preventDefault();
            var isAdvanced = $(this).hasClass('advancedOnLink');
            $pane.toggleClass('advanced', isAdvanced);
            $pane.toggleClass('notAdvanced', !isAdvanced);
            $pane.data('unifiedFilter-root').metadata.advanced = isAdvanced;
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

                $pane.data('unifiedFilter-root').value = $this.attr('data-actionTarget');

                $entry.siblings('.matchAnyOrAll').removeClass('checked');
                $entry.addClass('checked');

                parseFilters();
            });

        // add condition button
        $pane.find('.addFilterConditionButton').click(function(event)
        {
            event.preventDefault();
            addNewCondition($pane.data('unifiedFilter-root'));
        });
    };

// SIDEBAR
    var renderCallback = function($elem)
    {
        $pane = $elem;
        hookUpSidebarActions();
        renderQueryFilters();
    };

    var isEdit = _.include(['filter', 'grouped'], blist.dataset.type) &&
        blist.dataset.hasRight('update_view');

    var configName = 'filter.unifiedFilter';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter',
        subtitle: 'Filter the rows of this dataset based on their contents.',
        noReset: true,
        onlyIf: function()
        {
            return isEdit ? blist.dataset.realColumns.length > 0 :
                blist.dataset.visibleColumns.length > 0 && blist.dataset.valid;
        },
        disabledSubtitle: function()
        {
            return !blist.dataset.valid && !isEdit ? 'This view must be valid' :
                'This view has no columns to filter';
        },
        sections: [{
            customContent: {
                template: 'filterPane',
                directive: {},
                data: {},
                callback: renderCallback
            }
        }]
    };

    $.gridSidebar.registerConfig(config);

/////////////////////////////////////
// PARSING + DATASET

    // figure out what they entered and drop it into the dataset object
    var parseFilters = function()
    {
        var filters = [];

        var rootCondition = $pane.data('unifiedFilter-root');

        $pane.find('.filterCondition').each(function()
        {
            var $filterCondition = $(this);
            var data = $filterCondition.data('unifiedFilter-condition');
            var condition = data.condition;
            var metadata = condition.metadata || {};
            var column = data.column;

            var children = [];
            var columnDefiniton = {
                type: 'column',
                columnId: column.id
            };

            if (!_.isUndefined(metadata.subcolumn))
            {
                columnDefiniton.value = metadata.subcolumn;
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
                        children: [ columnDefiniton ]
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
                    children: [columnDefiniton].concat(_.map($.arrayify(value), function(v)
                    {
                        if (!_.isUndefined(metadata.subcolumn))
                        {
                            v = v[metadata.subcolumn];
                        }

                        return {
                            type: 'literal',
                            value: v
                        };
                    }))
                });
            });

            condition.metadata.customValues = [];
            $lineToggles.filter(':not(:checked)').each(function()
            {
                var $line = $(this).closest('.line');

                if (!$line.hasClass('autogenerated'))
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

            condition.children = children;
        });

        // fire it off
        blist.dataset.update({query: { filterCondition: $.extend(true, {}, rootCondition) }});
    };
})(jQuery);
