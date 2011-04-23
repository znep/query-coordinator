// DO NOT BE CONFUSED!
// there are many things named %column% in this file.
//  columns are the real columns in the original dataset, id'ed by order of appearance.
//  columnSelectOptions are the columns munged around so that we can render them as
//      select option tags through $.tag.
//  sourceColumns are possible sources from which to create columns.
//      This means both real columns as well as composite or empty columns.
//  importColumns are the columns that will be submitted to the importer.
//      This means that the name, type, and composition method in importColumn
//      objects are going to be the final product. An importColumn can be composed
//      of zero, one, or more sourceColumns.

;(function($){

var importNS = blist.namespace.fetch('blist.import');

// globals
var scan,
    columns,
    locationGroups,
    columnSelectOptions,
    sourceColumns,
    $columnsList,
    $warningsList,
    $warningsSection,
    $sourceDropDown,
    $columnDropDown,
    $compositeColumnSourceDropDown,
    wizardCommand,
    isShown;

// structs
var importTypes = {
    text: 'text',
    number: 'number',
    money: 'number',
    percent: 'number',
    calendar_date: 'date',
    date: 'date',
    checkbox: 'checkbox'
};
var typesToText = {
    text: 'Text',
    number: 'Number',
    money: 'Money',
    percent: 'Percent',
    calendar_date: 'Date &amp; Time',
    date: 'Date &amp; Time (with Timezone)',
    checkbox: 'Checkbox'
};
var locationTypes = {
    street: 'text',
    city: 'text',
    state: 'text',
    zip: 'number',
    latitude: 'number',
    longitude: 'number'
};

// helpers

// mimics rails' options_for_select
var optionsForSelect = function(collection)
{
    return _.map(collection, function(column) {
        return { tagName: 'option',
                     value: column.value,
                     contents: $.htmlEscape(column.label),
                     'class': column['class'] } } );
};

// textize a list of columns
var textizeColumns = function(importColumns)
{
    if (importColumns.length === 0)
        return '';

    var result = 'Column';
    if (importColumns.length > 1) result += 's';

    result += ' ';
    result += $.arrayToSentence(_.map(importColumns, function(importColumn)
    {
        return $.tag({
            tagName: 'span',
            'class': 'columnName',
            contents: '<strong>&ldquo;' + $.htmlEscape(importColumn.name) + '&rdquo;</strong>'
        }, true);
    }), 'and', ',');

    result += (importColumns.length > 1) ? ' are ' : ' is ';

    return result;
};

// add a validation error
var addValidationError = function(importColumns, severity, message)
{
    importColumns = _.compact($.arrayify(importColumns));
    var $errorLine = $.tag({
        tagName: 'li',
        'class': ['validationError', severity],
        contents: [{
            tagName: 'span',
            'class': 'icon'
        }, {
            tagName: 'span',
            'class': 'message',
            contents: [ textizeColumns(importColumns), message ]
        }]
    });
    var validationError = {
        importColumns: importColumns,
        severity: severity,
        message: message,
        $dom: $errorLine
    };
    $errorLine.data('validationError', validationError);

    $warningsList.append($errorLine);

    return $errorLine;
};

// gets the columns that are currently used
var getUsedColumns = function()
{
    var usedColumns = [];
    $columnsList.children().each(function()
    {
        var $line = $(this);
        var importColumn = $line.data('importColumn');
        var column = $line.data('column');

        if (importColumn.dataType == 'location')
            usedColumns = usedColumns.concat(_.values(column));
        else if (column.type == 'composite')
            usedColumns = usedColumns.concat(_.filter(column.sources, function(source)
                { return source.type == 'column'; }));
        else
            usedColumns.push(column);
    });

    return _.uniq(usedColumns);
};

// update all column lines from DOM
var updateAll = function()
{
    $columnsList.children().each(function()
    {
        var $line = $(this);

        var column;
        var oldColumn = $line.data('column');

        var importColumn = {
            name: $line.find('.columnName').val(),
            dataType: $line.find('.columnTypeSelect').val()
        };

        // some of these can toggle between text and select.
        var findOptionValue = function(option)
        {
            var $selected = $line.find('.location' + $.capitalize(option) +
                'Line .uniform.radio:has(:checked) + *');
            if (!$selected.is(':input'))
                $selected = $selected.find(':input');

            return $selected.hasClass('prompt') ? '' : $selected.val(); // account for example
        };

        var getColumn = function(selectValue)
        {
            if ($.isBlank(selectValue))
                return null;

            var result = columns[parseInt(selectValue)];

            if (_.isUndefined(result))
                result = { type: 'static', value: selectValue };

            return result;
        };

        var columnSourceValue = $line.find('.columnSourceCell .columnSourceSelect').val();
        if (importColumn.dataType == 'location')
        {
            column = {
                name:       oldColumn.name,
                suggestion: oldColumn.suggestion,
                type:       oldColumn.type,
                street:     getColumn($line.find('.locationStreetColumn').val()),
                city:       getColumn(findOptionValue('city')),
                state:      getColumn(findOptionValue('state')),
                zip:        getColumn(findOptionValue('zip')),
                latitude:   getColumn($line.find('.locationLatitudeColumn').val()),
                longitude:  getColumn($line.find('.locationLongitudeColumn').val())
            };
            _.each(column, function(v, k)
            {
                if ($.isBlank(v))
                    delete column[k];
            });
            $line.find('.locationDetails')[isShown ? 'slideDown' : 'show']();
            $line.find('.compositeDetails')[isShown ? 'slideUp' : 'hide']();
            $line.find('.columnSourceSelect').closest('.uniform').hide();
            $line.find('.generalDetails').hide();
            $line.find('a.options').hide();
        }
        else if (columnSourceValue == 'composite')
        {
            column = { type: 'composite' };
            column.sources = $.makeArray($line.find('.sourceColumnsList').children().map(function()
            {
                var $sourceColumnLine = $(this);
                var sourceColumnValue = $sourceColumnLine.find('.compositeColumnSourceSelect').val();

                if (sourceColumnValue == '[static]')
                    return { type: 'static', value: $sourceColumnLine.find('.staticSourceText').val() };
                else
                    return columns[parseInt(sourceColumnValue)];
            }));

            $line.find('.locationDetails')[isShown ? 'slideUp' : 'hide']();
            $line.find('.compositeDetails')[isShown ? 'slideDown' : 'show']();
            $line.find('.columnSourceSelect').closest('.uniform').show();
            $line.find('a.options').show();
        }
        else
        {
            column = columns[parseInt(columnSourceValue)];

            $line.find('.locationDetails')[isShown ? 'slideUp' : 'hide']();
            $line.find('.compositeDetails')[isShown ? 'slideUp' : 'hide']();
            $line.find('.columnSourceSelect').closest('.uniform').show();
            $line.find('a.options').show();
        }

        importColumn.column = column;

        // transforms!
        if (importColumn.dataType != 'location')
        {
            importColumn.transforms = $.makeArray($line.find('.columnTransformsList').children().map(function()
            {
                var $transformLine = $(this);

                var result = {
                    type: $transformLine.find('.columnTransformOperation').val()
                };

                if (result.type == 'findReplace')
                {
                    result.options = {
                        find: $transformLine.find('.findText').val(),
                        replace: $transformLine.find('.replaceText').val(),
                        ignoreCase: $transformLine.find('.caseSensitive').is(':checked')
                    };
                }
                else if (result.type == 'customExpression')
                {
                    result.options = {
                        expression: $transformLine.find('.customExpression')
                    };
                }

                return result;
            }));
        }

        $line.data('column', column);
        $line.data('importColumn', importColumn);
    });

    validateAll();
};

// validate all columns
var validateAll = function()
{
    // clear the list
    $warningsList.empty();

    // keep track of names and columns for collision/gap detection
    var names = {};
    var usedColumns = getUsedColumns();
    var locationUsedColumns = [];

    $columnsList.children().each(function()
    {
        var $line = $(this);
        var column = $line.data('column');
        var importColumn = $line.data('importColumn');
        var importType = importTypes[importColumn.dataType];

        // if we don't have a column or importColumn, just bail.
        if (_.isUndefined(column) || _.isUndefined(importColumn))
            return;

        // track names seen
        if (_.isUndefined(names[importColumn.name]))
            names[importColumn.name] = [importColumn];
        else
            names[importColumn.name].push(importColumn);

        // validate data type (warning)
        if (importColumn.dataType == 'location')
        {
            // location requires special validation
            _.each(column, function(originalColumn, field)
            {
                // keep track that we've seen this column in a location field
                locationUsedColumns.push(originalColumn);

                // warn if the column is nonoptimally used
                if (!$.isBlank(originalColumn) && (originalColumn.suggestion != locationTypes[field]))
                {
                    addValidationError(importColumn, 'warning', 'set to import its <strong>' +
                        field + '</strong> from the source column <strong>' + $.htmlEscape(originalColumn.name) +
                        '</strong>, but our analysis shows that the source column is a ' + originalColumn.suggestion +
                        ' column, while ' + field + ' expects a column of type ' + locationTypes[field] +
                        '. Should you choose to proceed with these import settings, import ' +
                        'or geocoding errors are likely to occur.');
                }
            });
        }
        else if (column.type == 'composite')
        {
            // composite sources require special validation
            if (column.sources.length === 0)
            {
                addValidationError(importColumn, 'error', 'a composite column that will be created ' +
                    'out of multiple source columns, but you currently don\'t have it set to be ' +
                    'populated by anything. Please add some source columns or text.');
            }

            if (importType != 'text')
            {
                addValidationError(importColumn, 'warning', 'a composite column that will be created ' +
                    'out of multiple source columns, but it is currently set to import as <strong>' +
                    $.htmlEscape(importColumn.dataType) + '</strong>. Please be certain that combining ' +
                    'the columns you have specified will yield a valid ' + importColumn.dataType) + ' value,' +
                    'or else change the type to <strong>text</strong> to import safely.'
            }
        }
        else if (column.suggestion != importType)
        {
            // message should be different depending on whether they're gaining
            // or losing richness
            if (column.suggestion == 'text')
            {
                var invalidPercentage = Math.round(1000 *
                    (1 - (column.types[importTypes[importColumn.dataType]] / column.processed))) / 10;
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>' + typesToText[importColumn.dataType] + '</strong>, but ' +
                    'our analysis shows that <strong>Text</strong> is a better fit. Should you choose ' +
                    'to import as ' + typesToText[importColumn.dataType] + ', roughly <strong>' +
                    invalidPercentage + '%</strong> of your data will import incorrectly.');
            }
            else
            {
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>text</strong>, but our analysis indicates that the ' +
                    'column is likely a <strong>' + $.capitalize(column.suggestion) + '</strong> ' +
                    'column. You can import it as Text, but you will lose some features if you do ' +
                    'so. We strongly recommend that you import it as <strong>' +
                    $.capitalize(column.suggestion) + '</strong>');
            }
        }
    });

    // validate name collisions (error)
    _.each(names, function(columns, name)
    {
        if (columns.length > 1)
        {
            addValidationError(null, 'error', '<strong>' + $.capitalize($.wordify(columns.length)) +
                '</strong> of your columns are named &ldquo;' + $.htmlEscape(name) + '&rdquo;. Columns ' +
                'in a dataset cannot share the same name.');
        }
    });
    
    // validate name missing (error)
    var emptyNameColumns = _.select(names, function(columns, name) { return $.isBlank(name.trim()); });
    if (emptyNameColumns.length > 1)
    {
        addValidationError(null, 'error', '<strong>' + $.capitalize($.wordify(emptyNameColumns.length)) +
                '</strong> of your columns do not have names. Please give them names.');
    }
    else if (emptyNameColumns.length > 0)
    {
        addValidationError(null, 'error', '<strong>One</strong> of your columns does not have a name. ' +
                'Please give it a name.');
    }

    // validate missing columns (warning)
    var missingColumns = _.select(columns, function(column) { return !_.include(usedColumns, column); });
    _.each(missingColumns, function(column)
    {
        addValidationError(column, 'warning', 'in your source data file, but is not currently ' +
                'set to be imported into your dataset.');
    });

    // validate location type (warning)
    _.each(scan.summary.locations, function(location)
    {
        _.each(location, function(columnId, type)
        {
            var column = columns[columnId];

            if (_.include(missingColumns, column))
                return; // we already warned that this column is entirely missing anyway

            if (!_.include(locationUsedColumns, column))
            {
                addValidationError(column, 'warning', 'currently being imported as a plain column, ' +
                    'while our analysis indicates that it is best used as part of a location column. ' +
                    'If you wish to eventually create a map with this data, it will be necessary to ' +
                    'import it as part of a location column.');
            }
        });
    });

    // show the list if necessary
    if ($warningsList.children().length > 0)
        $warningsSection[isShown ? 'slideDown' : 'show']();
    else
        $warningsSection[isShown ? 'slideUp' : 'hide']();
};

// create a new toplevel column, optionally taking in an analysed
// column to pattern after
var newLine = function(column, overrides)
{
    // render template
    var $line = $.renderTemplate('columnsListLine', { index: _.uniqueId() }, {
        '.locationSourceToggle@name+': 'index'
    });
    $line.find('.textPrompt').example(function() { return $(this).attr('title'); });

    // add column dropdowns
    var $lineSourceDropDown = $sourceDropDown.clone();
    $line.find('.columnSourceCell').append($lineSourceDropDown);
    $line.find('.columnSourcePlaceholder').each(function()
    {
        var $this = $(this);
        var $dropDown = $columnDropDown.clone();
        $dropDown.addClass($this.attr('data-class'));
        $this.replaceWith($dropDown);
    });

    // populate fields if we have a column
    if (!$.isBlank(column))
    {
        // allow for overrides that don't blow away the original data
        var overridenColumn = $.extend({}, column, overrides);

        // populate standard things
        $line.find('.columnName').val(overridenColumn.name);
        $line.find('.columnTypeSelect').val(overridenColumn.suggestion)
            .trigger('change'); // jquery does not fire change for val()
        $lineSourceDropDown.val(overridenColumn.id)
            .trigger('change'); // same here

        // populate crazy things
        if (overridenColumn.suggestion == 'location')
        {
            _.each(overridenColumn, function(originalColumn, field)
            {
                $line.find('.location' + $.capitalize(field) + 'Column')
                    .val(originalColumn.id).trigger('change'); // and again here
            });
        }

        $line.data('column', column);
    }

    // styling
    $line.find('select, :radio').uniform();

    return $line;
};

// clear out all the columns
var emptyColumnsList = function()
{
    $columnsList.empty();
    updateAll();
};

// throw in all analysed columns, with location groups
var addDefaultColumns = function(flat)
{
    // keep track of what we haven't used
    var availableColumns = _.clone(columns);
    var compositeColumns = [];

    // don't run the composites scan if they want it flat
    if (flat !== true)
    {
        _.each(scan.summary.locations || [], function(location, i)
        {
            var compositeColumn = {};
            compositeColumn.name = 'Location ' + (i + 1);
            compositeColumn.suggestion = 'location';
            compositeColumn.type = 'location';

            _.each(location, function(columnId, field)
            {
                if (field == 'address')
                    field = 'street'; // workaround for how our location stuff works

                compositeColumn[field] = columns[columnId];
                availableColumns = _.without(availableColumns, columns[columnId]);
            });

            compositeColumns.push(compositeColumn);
        });
    }

    // now add the ones we haven't used as individual columns, plus our compositeColumns
    _.each(availableColumns.concat(compositeColumns), function(column)
    {
        $columnsList.append(newLine(column));
    });

    // update all our states
    updateAll();
};

// throw in all available columns just as text
var addAllColumnsAsText = function()
{
    _.each(columns, function(column)
    {
        $columnsList.append(newLine(column, { suggestion: 'text' }));
    });

    updateAll();
};


// config

importNS.paneConfig = {
    uniform: true,
    onInitialize: function($pane, paneConfig, state, command)
    {
        // update global vars
        scan = state.scan;
        isShown = false;
        wizardCommand = command;
        columns = scan.summary.columns;
        locationGroups = scan.summary.locations;
        $columnsList = $pane.find('.columnsList');
        $warningsList = $pane.find('.columnWarningsList');
        $warningsSection = $pane.find('.warningsSection');

        // give the columns id refs; type of column
        _.each(columns, function(column, i)
        {
            column.id = i;
            column.type = 'column';
        });

        // create an options hash for pure columns
        columnSelectOptions = [];
        _.each(columns || [], function(column, i)
        {
            columnSelectOptions.push({ value: i, label: column.name });
        });

        // create an options hash for column-like options
        sourceColumns = [];
        sourceColumns.push({ value: '', label: '(No Source Column)', 'class': 'special' });
        sourceColumns = sourceColumns.concat(columnSelectOptions);
        sourceColumns.push({ value: 'composite', label: '(Combine Multiple Columns...)', 'class': 'special' });

        // create a couple selects we can clone
        $sourceDropDown = $.tag({
            tagName: 'select',
            'class': 'columnSourceSelect',
            contents: optionsForSelect(sourceColumns)
        });
        $columnDropDown = $.tag({
            tagName: 'select',
            'class': 'columnSelect',
            contents: optionsForSelect([{ value: '', label: '(No Source Column)',
                                          'class': 'special' }].concat(columnSelectOptions))
        });
        $compositeColumnSourceDropDown = $.tag({
            tagName: 'select',
            'class': 'compositeColumnSourceSelect',
            contents: optionsForSelect(columnSelectOptions.concat([{
                value: '[static]', label: '(Insert static text...)', 'class': 'special' }]))
        });

        // throw in our default set of suggestions
        addDefaultColumns();

        // handle events
        $pane.delegate('.columnsList li input.columnName,' +
                       '.columnsList li select.columnTypeSelect,' +
                       '.columnsList li select.columnSourceSelect', 'change', updateAll);

        $pane.delegate('.columnsList li a.options', 'click', function(event)
        {
            event.preventDefault();

            $(this).closest('li').find('.generalDetails').slideToggle();
        });

        $pane.delegate('.columnActionCell a.remove', 'click', function(event)
        {
            event.preventDefault();

            $(this).closest('li').slideUp(function()
            {
                $(this).remove();
                updateAll();
            });
        });

        // load in the preset they specify
        $pane.find('.columnsPresetsButton').click(function(event)
        {
            event.preventDefault();

            var presetType = $pane.find('.columnsPresetsSelect').val();

            emptyColumnsList();
            if (presetType == 'alltext')
                addAllColumnsAsText();
            else if (presetType == 'suggestedFlat')
                addDefaultColumns(true);
            else if (presetType == 'suggested')
                addDefaultColumns();
        });

        // remove all columns
        $pane.find('.clearColumnsButton').click(function(event)
        {
            event.preventDefault();
            emptyColumnsList();
        });

        // add a new column line; try to figure out if we can be clever and suggest one
        // they haven't used yet
        $pane.find('.addColumnButton').click(function(event)
        {
            event.preventDefault();

            var usedColumns = getUsedColumns();
            var targetColumn = _.detect(columns, function(col) { return !_.include(usedColumns, col); });

            $columnsList.append(newLine(targetColumn));

            updateAll();
        });

        // add a new composite column source line
        $pane.delegate('.columnsList li .newSourceColumnButton', 'click', function(event)
        {
            event.preventDefault();

            var $line = $(this).closest('li');
            var $newColumnSourceLine = $.renderTemplate('sourceColumnsListLine');

            // swap in a real columns select for the fake one
            var $placeholder = $newColumnSourceLine.find('.compositeColumnSourcePlaceholder');
            var $dropDown = $compositeColumnSourceDropDown.clone();
            $dropDown.addClass($placeholder.attr('data-class'));
            $placeholder.replaceWith($dropDown);

            $line.find('.sourceColumnsList').append($newColumnSourceLine);
            $newColumnSourceLine.find('select').uniform();

            updateAll();
        });

        // show the static text line if necessary
        $pane.delegate('.columnsList li .compositeColumnSourceSelect', 'click', function(event)
        {
            var $this = $(this);
            var $columnSourceLine = $this.closest('li');

            $columnSourceLine.find('.staticSourceText').toggle($this.val() == '[static]');

            updateAll();
        });

        // add a new transformation line
        $pane.delegate('.columnsList li .newColumnTransformButton', 'click', function(event)
        {
            event.preventDefault();

            var $line = $(this).closest('li');
            var $newTransformLine = $.renderTemplate('columnTransformsListLine');

            $line.find('.columnTransformsList').append($newTransformLine);
            $newTransformLine.find('select, :checkbox').uniform();

            updateAll();
        });

        // show the appropriate additional details section
        $pane.delegate('.columnsList li .columnTransformOperation', 'change', function(event)
        {
            var $this = $(this);
            var $transformLine = $this.closest('li');

            $transformLine.find('.additionalTransformOptions').children()
                .hide()
                .filter('.' + $this.val() + 'Section').show();

            updateAll();
        });

        // remove a given transform or column source line
        $pane.delegate('.columnsList li .removeTransformLineButton,' +
                       '.columnsList li .removeSourceColumnLineButton', 'click', function(event)
        {
            event.preventDefault();
            $(this).closest('li').remove();

            updateAll();
        });

        // autoselect radio when editing associated option
        $pane.delegate('.optionGroup select, .optionGroup input', 'change', function(event)
        {
            var $this = $(this);
            if ($this.is('select'))
                $this = $this.closest('.uniform.selector');

            $this.prev('.uniform.radio').find('input').click();

            updateAll();
        });

        $columnsList.awesomereorder({
            uiDraggableDefaults: {
                handle: '.columnHandleCell'
            }
        });

        $('.importTypesMessageLink').click(function(event)
        {
            event.preventDefault();
            $('#importTypesMessage').jqmShow();
        });

        // we are now past the first init, so start animating things
        isShown = true;
    },
    onNext: function()
    {
        // confirm okayness
    }
};

})(jQuery);
