;(function($)
{
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
    var defaultSubcolumn = {
        phone: 'phone_type',
        'location': 'human_address',
        url: 'description'
    };

/////////////////////////////////////
// UTIL

    // check to make sure we can render the thing; make minor corrections if possible
    var fsckLegacy = function(rootCondition)
    {
        var compatible = true;
        var nestTypes = ['AND', 'OR'];

        // we can handle anything at the top level (AND or OR)
        _.each(rootCondition.children, function(condition, i)
        {
            // we can handle a nested OR only...
            if (condition.type == 'AND')
            {
                // ...unless it's a guidedFilter-generated between, in which case fix it
                var checkBetween = fsckLegacy_checkBetween(condition);
                if (_.isObject(checkBetween))
                {
                    rootCondition[i] = {
                        type: 'operator',
                        value: 'OR',
                        children: [ checkBetween ] };
                }
                else
                {
                    return compatible = (compatible && checkBetween);
                }
            }
            else if (condition.type == 'OR')
            {
                // we can't handle a double-nest...
                if (_.any(condition.children, function(subcondition)
                        { return _.include(nestTypes, subcondition.value); }))
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
                    children: condition
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
                child.metadata = {
                    columnId: findConditionComponent(condition, 'columnId'),
                    operator: child.children[0].value
                };
                var subcolumn = findConditionComponent(condition, 'subcolumn');
                if (subcolumn)
                {
                    children.metadata.subcolumn = subcolumn;
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
                    type: 'operaton',
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

        if (component == 'columnId')
        {
            _.each(child.children, function(subchild)
            {
                if (!_.isUndefined(subchild.columnId))
                {
                    return subchild.columnId;
                }
            });
            return false; // well, we didn't find anything.
        }
        else if (component == 'subcolumn')
        {
            _.each(child.children, function(subchild)
            {
                if (subchild.type == 'column')
                {
                    return subchild.value; // for some reason value is subcolumn name
                }
            });
            return false;
        }
        else if (component == 'value')
        {
            var value;
            _.each(child.children, function(subchild)
            {
                if (subchild.type == 'literal')
                {
                    value = subchild.value;
                }
            });
            return value;
        }
        else
        {
            throw 'unrecognized component type requested.';
        }
    };

    var getEditorComponentValue = function($editor)
    {
        var value = $editor.data('unifiedFilter-editor').currentValue();
        if (_.isArray(value))
        {
            // theoretically they've only filled one subcolumn, so just compact it
            value = _.compact(value)[0];
        }
        return value;
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

        // wire events
        $pane.find('.advancedLine a').click(function(event)
        {
            event.preventDefault();
            var isAdvanced = $(this).hasClass('advancedOnLink');
            $pane.toggleClass('advanced', isAdvanced);
            rootCondition.metadata.advanced = isAdvanced;
        });

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
            '.@class+': function() { return (metadata.expanded === false) ? 'collapsed' : 'expanded'; },
            '.columnName': 'column.name!',
            '.subcolumnName': 'metadata.subcolumn',
            '.operator': 'metadata.operator',
            '.@class+': 'metadata.subcolumn'
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

        // dump in values
        if (metadata.multiSelect === false)
        {
            // add in "no filter" line; it's a radioline
            addFilterLine(noFilterValue, column, condition, $filter);
        }

        if (metadata.operator == 'blank?')
        {
            // special case these since they have no actual values
            addFilterLine({ item: 'is blank', count: column.cachedContents.null }, column, condition, $filter, false, true);
            addFilterLine({ item: 'is not blank', count: column.cachedContents.not_null }, column, condition, $filter, false, true);
        }
        else
        {
            // autogen values
            var usedValues = [];
            _.each(condition.children, function(child, i)
            {
                var value = findConditionComponent(condition, 'value', i);
                addFilterLine({ item: value }, column, condition, $filter, true);
                usedValues.push(value);
            });
            if (!_.isUndefined(column.cachedContents) && !_.isUndefined(column.cachedContents.top))
            {
                // TODO: This only handles EQUALS filters
                
                var topCount = Math.min(metadata.includeAuto || 0, column.cachedContents.length);

                // save off the item values to compare with later
                usedValues = usedValues.concat(_.pluck(column.cachedContents.top.slice(0, topCount), 'item'));

                // iter through originals with count
                _(topCount).times(function(i)
                {
                    if (!_.contains(usedValues, column.cachedContents.top[i].item))
                    {
                        addFilterLine($.extend({}, column.cachedContents.top[i], { autogenerated: true }),
                                      column, condition, $filter);
                    }
                });
            }
            // custom values
            if (_.isArray(metadata.customValues))
            {
                _.each(metadata.customValues, function(value)
                {
                    // don't render dupes
                    if (!_.contains(usedValues, value))
                    {
                        addFilterLine({ item: value }, column, condition, $filter);
                    }
                });
            }
            // freeform line
            addFilterLine('freeform', column, condition, $filter);
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
    };

    // add a single filter item to a condition
    var addFilterLine = function(valueObj, column, condition, $filter, selected, textOnly)
    {
        var metadata = condition.metadata || {};

        // add elems
        var $line = $.tag({
            tagName: 'div',
            'class': 'line'
        });

        var inputId = 'unifiedFilterInput_' + _.uniqueId();
        $line.append($.tag({
                tagName: 'input',
                type: (metadata.multiSelect === false) ? 'radio' : 'checkbox',
                checked: selected,
                id: inputId,
                name: 'true',
                'class': 'filterLineToggle'
        }));
        $line.find(':radio, :checkbox').uniform();

        if (valueObj == 'freeform')
        {
            // dump in the appropriate number of editors
            _((metadata.operator == 'BETWEEN') ? 2 : 1).times(function(i)
            {
                if (i > 0)
                {
                    $line.find('.filterValueEditor:first').after($.tag({
                            tagName: 'span',
                            contents: 'and'
                    }));
                }

                $line.append($.tag({
                        tagName: 'div',
                        'class': 'filterValueEditor'
                }));
            });
            $line.find('.filterValueEditor').each(function()
            {
                var $this = $(this);
                $this.data('unifiedFilter-editor',
                    $this.blistEditor({ row: null, column: column }));
            });

            // events
            $line.find(':checkbox, :radio').bind('change click', _.throttle(function(event)
            {
                parseFilters();
                event.stopPropagation(); // if we don't stop, editor steals focus back
            }, 0));
            $line.find('.filterValueEditor input').bind('focus', function()
            {
                if ($line.nextAll().length === 0)
                {
                    // this is the last freeform line and the user just selected it; spawn new
                    addFilterLine('freeform', column, condition, $filter);
                }
            });
            $line.find('.filterValueEditor').bind('edit_end', function()
            {
                var $this = $(this);
                var $lineToggle = $line.find(':checkbox, :radio');

                if ($(document.activeElement).parents().index($this) < 0)
                {
                    // edit_end was called but we're actually elsewhere.
                    return;
                }

                if ($.isBlank(getEditorComponentValue($this)))
                {
                    var $nextLine = $this.closest('.line').next('.line');
                    if ($nextLine.is(':last-child'))
                    {
                        $nextLine.remove();
                    }
                    $lineToggle.removeAttr('checked');
                    $.uniform.update($lineToggle);
                }
                else
                {
                    $lineToggle.attr('checked', true);
                    $.uniform.update($lineToggle);
                    parseFilters();
                }

                $this.blur();
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
                contents: _.map($.arrayify(valueObj.item), function(valueObjPart)
                {
                    return (textOnly === false) ? valueobjPart : column.renderType.renderer(valueObjPart, column);
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
            if (valueObj.autogenerated === true)
            {
                $line.addClass('autogenerated');
            }

            // data
            $line.data('unifiedFilter-value', valueObj.item);
        }

        // events
        $line.find(':checkbox, :radio').bind('change click', _.throttle(parseFilters, 0));

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
            var columns = blist.dataset.columnsForType();
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
        newCondition.metadata.operator = defaultOperator[column.renderTypeName] || 'EQUALS';

        if (newCondition.metadata.operator == 'between?')
        {
            // if we got a 'between?' value back on the filter, run some heuristics to determine
            // if equals is appropriate (eg low-cardinality); use between otherwise.
            // 5 is a somewhat arbitrary heuristic constant here
            if ((column.cachedContents.top.length < 20) ||
                (_.select(column.cachedContents.top, function(v) { return v.count > 1; }).length > 5))
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
        renderQueryFilters();
        hookUpSidebarActions();
    };

    var configName = 'filter.unifiedFilter';
    var config = {
        name: configName,
        priority: 1,
        title: 'Filter',
        subtitle: 'Filter the rows of this dataset based on their contents.',
        noReset: true,
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
                        value: value.replace(' ', '_').toUpperCase(),
                        children: columnDefiniton
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
                    children: [columnDefiniton].concat(_.map($.arrayify(value), function(v)
                    {
                        if (!_.isUndefined(column.subColumnTypes))
                        {
                            var vOld = v;
                            v = new Array();
                            _(column.subColumnTypes.length).times(function() { v.push(null); });
                            vTemp[_.indexOf(column.subColumnTypes, metadata.subcolumn)] = vOld;
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
