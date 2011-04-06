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
var columns,
    locationGroups,
    $columnsList,
    $warningsList,
    $warningsSection,
    wizardCommand;

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

        if (importColumn.type == 'location')
            usedColumns = usedColumns.concat(_.values(column));
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
        var importColumn = {
            name: $line.find('.columnName').val(),
            type: $line.find('.columnTypeSelect').val()
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

        if (importColumn.type == 'location')
        {
            column = {
                street:    getColumn($line.find('.locationStreetColumn').val()),
                city:      getColumn(findOptionValue('city')),
                state:     getColumn(findOptionValue('state')),
                zip:       getColumn(findOptionValue('zip')),
                latitude:  getColumn($line.find('.locationLatitudeColumn').val()),
                longitude: getColumn($line.find('.locationLongitudeColumn').val())
            };
            _.each(column, function(v, k)
            {
                if ($.isBlank(v))
                    delete column[k];
            });
            $line.find('.locationDetails').slideDown();  // slideToggle doesn't take a boolean like toggle =(
            $line.find('.columnSourceSelect').closest('.uniform').hide();
        }
        else
        {
            column = columns[parseInt($line.find('.columnSourceCell').val())];
            $line.find('.locationDetails').slideUp();
            $line.find('.columnSourceSelect').closest('.uniform').show();
        }

        importColumn.column = column;

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

    $columnsList.children().each(function()
    {
        var $line = $(this);
        var column = $line.data('column');
        var importColumn = $line.data('importColumn');
        var importType = importTypes[importColumn.type];

        // if we don't have a column or importColumn, just bail.
        if (_.isUndefined(column) || _.isUndefined(importColumn))
            return;

        // track names seen
        if (_.isUndefined(names[importColumn.name]))
            names[importColumn.name] = [importColumn];
        else
            names[importColumn.name].push(importColumn);

        // validate data type (warning)
        if (importColumn.type == 'location')
        {
            // location requires special validation
            _.each(column, function(originalColumn, field)
            {
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
        else if (column.suggestion != importType)
        {
            // message should be different depending on whether they're gaining
            // or losing richness
            if (column.suggestion == 'text')
            {
                var invalidPercentage = Math.round(1000 *
                    (1 - (column.types[importTypes[importColumn.type]] / column.processed))) / 10;
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>' + typesToText[importColumn.type] + '</strong>, but ' +
                    'our analysis shows that <strong>Text</strong> is a better fit. Should you choose ' +
                    'to import as ' + typesToText[importColumn.type] + ', roughly <strong>' +
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

    // validate location type (warning)
    

    // validate missing columns (warning)
    var missingColumns = _.select(columns, function(column) { return !_.include(usedColumns, column); });
    _.each(missingColumns, function(column)
    {
        addValidationError(column, 'warning', 'is in your source data file, but is not currently ' +
                'set to be imported into your dataset.');
    });

    // show the list if necessary
    if ($warningsList.children().length > 0)
    {
        $warningsSection.show();
        wizardCommand.updateHeight();
    }
    else
        $warningsSection.slideUp();
};


// config

importNS.paneConfig = {
    uniform: true,
    onInitialize: function($pane, paneConfig, state, command)
    {
        // vars
        wizardCommand = command;
        columns = state.scan.summary.columns;
        locationGroups = state.scan.summary.locations;
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
        var columnSelectOptions = [];
        _.each(columns || [], function(column, i)
        {
            columnSelectOptions.push({ value: i, label: column.name });
        });

        // create an options hash for column-like options
        var sourceColumns = [];
        sourceColumns.push({ value: '', label: '(No Source Column)', 'class': 'special' });
        sourceColumns = sourceColumns.concat(columnSelectOptions);
        sourceColumns.push({ value: 'composite', label: '(Combine Multiple Columns...)', 'class': 'special' });

        // create a couple selects we can clone
        var $sourceDropDown = $.tag({
            tagName: 'select',
            'class': 'columnSourceSelect',
            contents: optionsForSelect(sourceColumns)
        });
        var $columnDropDown = $.tag({
            tagName: 'select',
            'class': 'columnSelect',
            contents: optionsForSelect([{ value: '', label: '(No Source Column)',
                                          'class': 'special' }].concat(columnSelectOptions))
        });

        // create a new toplevel column, optionally taking in an analysed
        // column to pattern after
        var newLine = function(column)
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
                // populate standard things
                $line.find('.columnName').val(column.name);
                $line.find('.columnTypeSelect').val(column.suggestion)
                    .trigger('change'); // jquery does not fire change for val()
                $lineSourceDropDown.val(column.id)
                    .trigger('change'); // same here

                // populate crazy things
                if (column.suggestion == 'location')
                {
                    _.each(column, function(originalColumn, field)
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

        // throw in all analysed columns, with location groups
        var addDefaultColumns = function()
        {
            // keep track of what we haven't used
            var availableColumns = _.clone(columns);
            var compositeColumns = [];

            _.each(state.scan.summary.locations || [], function(location, i)
            {
                var compositeColumn = {};
                compositeColumn.name = 'Location ' + (i + 1);
                compositeColumn.suggestion = 'location';

                _.each(location, function(columnId, field)
                {
                    if (field == 'address')
                        field = 'street'; // workaround for how our location stuff works

                    compositeColumn[field] = columns[columnId];
                    availableColumns = _.without(availableColumns, columns[columnId]);
                });

                compositeColumns.push(compositeColumn);
            });

            // now add the ones we haven't used as individual columns, plus our compositeColumns
            _.each(availableColumns.concat(compositeColumns), function(column)
            {
                $columnsList.append(newLine(column));
            });

            // update all our states
            updateAll();
        };
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

        var emptyColumnsList = function()
        {
            $columnsList.empty();
            updateAll();
        };

        $pane.find('.clearColumnsButton').click(function(event)
        {
            event.preventDefault();
            emptyColumnsList();
        });

        $pane.find('.addColumnButton').click(function(event)
        {
            event.preventDefault();

            var usedColumns = getUsedColumns();
            var targetColumn = _.detect(columns, function(col) { return !_.include(usedColumns, col); });

            $columnsList.append(newLine(targetColumn));

            updateAll();
        });

        // autoselect radio when editing associated option
        $pane.find('.optionGroup select, .optionGroup input', 'change', function(event)
        {
            var $this = $(this);
            if ($this.is('select'))
                $this = $this.closest('.uniform.selector');

            $this.prev('.uniform.radio').find('input').click();
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
    },
    onNext: function()
    {
        // confirm okayness
    }
};

})(jQuery);
