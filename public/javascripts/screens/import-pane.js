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

var importNS = blist.namespace.fetch('blist.importer');

// globals
var scan,
    columns,
    locationGroups,
    columnSelectOptions,
    sourceColumns,
    $pane,
    $columnsList,
    $warningsList,
    $warningsSection,
    $sourceDropDown,
    $columnDropDown,
    $compositeColumnSourceDropDown,
    wizardCommand,
    $headersTable,
    $headersCount,
    headersCount,
    nextButtonTip,
    isShown,
    submitError;

// structs
var importTypes = {
    text: 'text',
    email: 'text',
    url: 'text',
    number: 'number',
    money: 'money',
    percent: 'percent',
    calendar_date: 'date',
    date: 'date',
    checkbox: 'text'
};
var locationTypes = {
    address: 'text',
    city: 'text',
    state: 'text',
    zip: 'number',
    latitude: 'number',
    longitude: 'number'
};

// helpers

// get a title for a type
var typesToText = function(type)
{
    return blist.datatypes[type].title.replace('&', '&amp;');
};

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
            tagName: 'strong',
            'class': 'columnName',
            contents: '&ldquo;' + $.htmlEscape(importColumn.name) + '&rdquo;'
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

    $warningsList.append($errorLine);
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

        if (_.isUndefined(column))
            return; // this importColumn has no source column

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

var toggleSubsection = function($line, section)
{
    var $section = $line.find('> .detailsLine > .' + section);

    if ($section.is(':visible'))
        hideSubsection($line, section);
    else
        showSubsection($line, section);
};
var showSubsection = function($line, section)
{
    var $section = $line.find('> .detailsLine > .' + section);

    if (!$section.hasChildren())
    {
        // we haven't shown this section before; clone the template and example textboxes
        $section.append($.renderTemplate(section, undefined, undefined, true));
        $section.find('.textPrompt').example(function() { return $(this).attr('title'); });

        // give radios unique names so they don't conflict
        var id = _.uniqueId();
        var $radios = $section.find(':radio');
        $radios.each(function()
        {
            // make radios unique
            var $this = $(this);
            $this.attr('name', $this.attr('name') + id);
        });

        // only the first time,populate location stuff from model
        var column = $line.data('column');
        if (!_.isUndefined(column) && (column.suggestion == 'location'))
        {
            _.each(column, function(originalColumn, field)
            {
                $section.find('.location' + $.capitalize(field) + 'Column')
                    .val(originalColumn.id).trigger('change'); // and again here
            });
        }

        // uniform it
        $radios.add($section.find('select')).uniform();
    }

    $section[isShown ? 'slideDown' : 'show']();
};
var hideSubsection = function($line, section)
{
    var $section = $line.find('> .detailsLine > .' + section);
    $section[isShown ? 'slideUp' : 'hide']();
};

// update given column lines from DOM. if none are given, updates every line
var updateLines = function($elems)
{
    if (_.isUndefined($elems))
        $elems = $columnsList.children();

    $elems.each(function()
    {
        var $line = $(this);

        var column;
        var oldColumn = $line.data('column') || {};

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
                return undefined;

            var result = columns[parseInt(selectValue)];

            if (_.isUndefined(result))
                result = { type: 'static', value: selectValue };

            return result;
        };

        var columnSourceValue = $line.find('.columnSourceCell .columnSourceSelect').val();
        if (importColumn.dataType == 'location')
        {
            showSubsection($line, 'locationDetails');
            hideSubsection($line, 'compositeDetails');
            hideSubsection($line, 'generalDetails');
            $line.find('.mainLine .columnSourceSelect').closest('.uniform').hide();
            $line.find('.mainLine a.options').hide();

            column = {
                type:       'location',
                address:    getColumn($line.find('.locationAddressColumn').val()),
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
        }
        else if (columnSourceValue == 'composite')
        {
            hideSubsection($line, 'locationDetails');
            showSubsection($line, 'compositeDetails');
            $line.find('.mainLine .columnSourceSelect').closest('.uniform').show();
            $line.find('.mainLine a.options').show();

            column = { type: 'composite' };
            column.sources = $.makeArray($line.find('.sourceColumnsList').children().map(function()
            {
                var $sourceColumnLine = $(this);
                var sourceColumnValue = $sourceColumnLine.find('.compositeColumnSourceSelect').val();

                if (sourceColumnValue == '[static]')
                    return { type: 'static', value: $sourceColumnLine.find('.staticSourceText').val() };
                else
                    return getColumn(sourceColumnValue);
            }));
        }
        else
        {
            hideSubsection($line, 'locationDetails');
            hideSubsection($line, 'compositeDetails');
            $line.find('.mainLine .columnSourceSelect').closest('.uniform').show();
            $line.find('.mainLine a.options').show();

            column = getColumn(columnSourceValue);
        }

        importColumn.column = column;

        // transforms!
        if (importColumn.dataType != 'location') // locations don't support transforms
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
                        ignoreCase: !$transformLine.find('.caseSensitive').is(':checked'),
                        regex: $transformLine.find('.regex').is(':checked')
                    };
                }
                else if (result.type == 'customExpression')
                {
                    result.options = {
                        expression: $transformLine.find('.customExpression').val()
                    };
                }

                return result;
            }));
        }

        $line.data('column', column);
        $line.data('importColumn', importColumn);
    });
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

        // track names seen
        if (_.isUndefined(names[importColumn.name]))
            names[importColumn.name] = [importColumn];
        else
            names[importColumn.name].push(importColumn);

        // if we don't have a column, just bail. if we don't have an importColumn, we have serious issues.
        if (_.isUndefined(column))
            return;

        // validate data type (warning)
        if (importColumn.dataType == 'location')
        {
            // location requires special validation
            _.each(column, function(originalColumn, field)
            {
                // keep track that we've seen this column in a location field
                locationUsedColumns.push(originalColumn);

                // warn if the column is nonoptimally used
                if (!$.isBlank(originalColumn) && (originalColumn.type != 'static') &&
                    (originalColumn.suggestion != locationTypes[field]))
                {
                    addValidationError(importColumn, 'warning', 'set to import its <strong>' +
                        field + '</strong> from the source column <strong>' + $.htmlEscape(originalColumn.name) +
                        '</strong>, but our analysis shows that the source column is a ' + originalColumn.suggestion +
                        ' column, while ' + field + ' expects a column of type ' + locationTypes[field] +
                        '. Should you choose to proceed with these import settings, import ' +
                        'or geocoding errors are likely to occur.');
                }
            });

            // error if the column has lat but not long or vice versa
            if (!_.isUndefined(column.latitude) && _.isUndefined(column.longitude))
            {
                addValidationError(importColumn, 'error', 'set to import a <strong>longitude</strong> ' +
                    'but not a <strong>latitude</strong> column. Please specify the full lat/long pair.');
            }
            if (!_.isUndefined(column.longitude) && _.isUndefined(column.latitude))
            {
                addValidationError(importColumn, 'error', 'set to import a <strong>latitude</strong> ' +
                    'but not a <strong>longitude</strong> column. Please specify the full lat/long pair.');
            }
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
                    'the columns you have specified will yield a valid ' + importColumn.dataType + ' value,' +
                    'or else change the type to <strong>text</strong> to import safely.');
            }
        }
        else if (column.suggestion != importType)
        {
            // message should be different depending on whether they're gaining
            // or losing richness
            if (importType == 'text')
            {
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>Text</strong>, but our analysis indicates that the ' +
                    'column is likely a <strong>' + $.capitalize(column.suggestion) + '</strong> ' +
                    'column. You can import it as Text, but you will lose some features if you do ' +
                    'so. We strongly recommend that you import it as <strong>' +
                    $.capitalize(column.suggestion) + '</strong>');
            }
            else if (!_.isUndefined(column.types[importType]))
            {
                var invalidPercentage = Math.round(1000 *
                    (1 - (column.types[importType] / column.processed))) / 10.0;
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>' + typesToText(importColumn.dataType) + '</strong>, but ' +
                    'our analysis shows that <strong>' + $.capitalize(column.suggestion) + '</strong> is a better fit. ' +
                    'Should you choose to import as ' + typesToText(importColumn.dataType) + ', roughly ' +
                    '<strong>' + invalidPercentage + '%</strong> of your data will import incorrectly.');
            }
            else
            {
                addValidationError(importColumn, 'warning',
                    'set to import as <strong>' + typesToText(importColumn.dataType) + '</strong>, but ' +
                    'our analysis shows that <strong>' + $.capitalize(column.suggestion) + '</strong>' +
                    ' might be a better fit. Unless the column&rsquo;s data is formatted correctly as ' +
                    typesToText(importColumn.dataType) + ', data may import incorrectly.');
            }
        }
    });

    // validate name collisions (error)
    _.each(names, function(columns, name)
    {
        if ((columns.length > 1) && (name.trim() !== ''))
        {
            addValidationError(null, 'error', '<strong>' + $.capitalize($.wordify(columns.length)) +
                '</strong> of your columns are named &ldquo;' + $.htmlEscape(name) + '&rdquo;. Columns ' +
                'in a dataset cannot share the same name.');
        }
    });

    // validate name isn't "tags" (error)
    if (names.tags !== undefined)
    {
        // wow, dumbest error ever.
        addValidationError(null, 'error', '<strong>' + $.capitalize($.wordify(names.tags.length)) +
            '</strong> of your columns are named &ldquo;tags&rdquo;. Columns may not be named ' +
            '&ldquo;tags&rdquo;.');
    }
    
    // validate name missing (error)
    var emptyNameColumns = _.flatten(_.select(names, function(columns, name) { return $.isBlank(name.trim()); }));
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
    if (missingColumns.length > 0)
    {
        addValidationError(missingColumns, 'warning', 'in your source data file, but is not currently ' +
                'set to be imported into your dataset.');
    }

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

    var validated = ($warningsList.children().filter('.error').length == 0);

    // disable the button if necessary, but only after a defer in case
    // there are errors the moment the pane is loaded.
    _.defer(function()
    {
        var $nextButton = $('.wizardButtons .nextButton');
        if (!validated)
        {
            $nextButton.addClass('disabled');
            if ($.isBlank(nextButtonTip))
            {
                nextButtonTip = $nextButton.socrataTip({ message:
                    'You cannot proceed while there are import errors.', shrinkToFit: false });
            }
            else
            {
                nextButtonTip.enable();
            }
        }
        else
        {
            $nextButton.removeClass('disabled');
            if (!$.isBlank(nextButtonTip))
            {
                nextButtonTip.hide();
                nextButtonTip.disable();
            }
        }
    });

    return validated;
};

// create a new toplevel column, optionally taking in an analysed
// column to pattern after
var newLine = function(column, overrides)
{
    // render template
    var line = $.renderTemplate('columnsListLine', undefined, undefined, true);
    $columnsList.append(line);

    // grab that thing we just did
    var $line = $columnsList.children(':last');

    // populate fields if we have a column
    if (!$.isBlank(column))
    {
        // allow for overrides that don't blow away the original data
        var overridenColumn = $.extend({}, column, overrides);

        // populate standard things
        $line.find('.columnName').val(overridenColumn.name);
        $line.find('.columnTypeSelect').val(overridenColumn.suggestion);
        $line.find('.columnSourceCell select').val(overridenColumn.id);

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
    validateAll(); // go straight to validate; nothing to update.
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
                compositeColumn[field] = columns[columnId];
                availableColumns = _.without(availableColumns, columns[columnId]);
            });

            compositeColumns.push(compositeColumn);
        });
    }

    // now add the ones we haven't used as individual columns, plus our compositeColumns
    $.batchProcess(
        availableColumns.concat(compositeColumns),
        15,
        newLine,
        function(lines)
        {
            var $lines = _.reduce(
                _.rest(lines),
                function($linesSoFar, $line) { return $linesSoFar.add($line); },
                _.first(lines));
            updateLines($lines);
        },
        function()
        {
            validateAll();
            wireEvents();
            $columnsList.show();
            $pane.find('.columnsToolbar').show();
            $pane.find('.pendingColumnsMessage').hide();
        });
};

// throw in all available columns just as text
var addAllColumnsAsText = function()
{
    _.each(columns, function(column)
    {
        newLine(column, { suggestion: 'text' });
    });

    updateLines();
};

// set headers count text
var setHeadersCountText = function()
{
    var wordCount = (headersCount === 0) ? 'None' : $.capitalize($.wordify(headersCount));
    var phrase = (headersCount === 1) ? ' of your rows is a header.' : ' of your rows are headers.';
    $headersCount.text(wordCount + phrase);
};

// events
var eventsWired = false;
var wireEvents = function()
{
    // don't allow us to be set more than once
    if (eventsWired) return;
    eventsWired = true;

    $pane.delegate('.columnsList li input.columnName,' +
                   '.columnsList li select.columnTypeSelect,' +
                   '.columnsList li select.columnSourceSelect,' +
                   '.columnsList li input[type=text]' +
                   '.columnsList li .locationDetails .columnSelect', 'change', function()
    {
        updateLines($(this).closest('li.importColumn'));
        validateAll();
    });

    $pane.delegate('.columnsList li a.options', 'click', function(event)
    {
        event.preventDefault();

        toggleSubsection($(this).closest('li'), 'generalDetails');
    });

    $pane.delegate('.columnActionCell a.remove', 'click', function(event)
    {
        event.preventDefault();

        $(this).closest('li').slideUp(function()
        {
            $(this).remove();
            validateAll(); // just validate; we don't have to update when we remove
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

        $columnsList.trigger('awesomereorder-listupdated');
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

        var $newLine = newLine(targetColumn);
        $columnsList.trigger('awesomereorder-listupdated');
        updateLines($newLine);
        validateAll();
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

        updateLines($line.closest('li.importColumn'));
        validateAll();
    });

    // show the static text line if necessary
    $pane.delegate('.columnsList li .compositeColumnSourceSelect', 'change', function(event)
    {
        var $this = $(this);
        var $columnSourceLine = $this.closest('li');

        $columnSourceLine.find('.staticSourceText').toggle($this.val() == '[static]');

        updateLines($columnSourceLine.closest('li.importColumn'));
        validateAll();
    });

    // add a new transformation line
    $pane.delegate('.columnsList li .newColumnTransformButton', 'click', function(event)
    {
        event.preventDefault();

        var $line = $(this).closest('li');
        var $newTransformLine = $.renderTemplate('columnTransformsListLine');

        $line.find('.columnTransformsList').append($newTransformLine);
        $newTransformLine.find('select, :checkbox').uniform();

        updateLines($line.closest('li.importColumn'));
        validateAll();
    });

    // show the appropriate additional details section
    $pane.delegate('.columnsList li .columnTransformOperation', 'change', function(event)
    {
        var $this = $(this);
        var $transformLine = $this.closest('li');

        $transformLine.find('.additionalTransformOptions').children()
            .hide()
            .filter('.' + $this.val() + 'Section').show();

        updateLines($this.closest('li.importColumn'));
        validateAll();
    });

    // remove a given transform or column source line
    $pane.delegate('.columnsList li .removeTransformLineButton,' +
                   '.columnsList li .removeSourceColumnLineButton', 'click', function(event)
    {
        event.preventDefault();
        var $this = $(this);

        $this.closest('li').remove();
        updateLines($this.closest('li.importColumn'));
        validateAll();
    });

    // autoselect radio when editing associated option
    $pane.delegate('.optionGroup select, .optionGroup input', 'focus', function(event)
    {
        var $this = $(this);
        if ($this.is('select'))
            $this = $this.closest('.uniform.selector');

        var $input = $this.prev('.uniform.radio').find('input').click();
        $.uniform.update($this.closest('li').find(':radio'));

        updateLines($this.closest('li.importColumn'));
        validateAll();
    });

    // more/less header rows
    $pane.find('.lessRowsButton').click(function(event)
    {
        event.preventDefault();
        $headersTable.children('.header:last').removeClass('header');
        headersCount = Math.max(0, headersCount - 1);
        setHeadersCountText();
    });
    $pane.find('.moreRowsButton').click(function(event)
    {
        event.preventDefault();
        var $lastHeader = $headersTable.children('.header:last');
        (($lastHeader.length === 0) ? $headersTable.children(':first')
                                    : $lastHeader.next()).addClass('header');
        headersCount = Math.min(5, headersCount + 1);
        setHeadersCountText();
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
};

// config
importNS.importColumnsPaneConfig = {
    uniform: true,
    skipValidation: true,
    onInitialize: function($paneLocal, paneConfig, state, command)
    {
        // update global vars
        scan = state.scan;
        isShown = false;
        wizardCommand = command;
        columns = scan.summary.columns;
        locationGroups = scan.summary.locations;
        $pane = $paneLocal;
        $columnsList = $pane.find('.columnsList');
        $warningsList = $pane.find('.columnWarningsList');
        $warningsSection = $pane.find('.warningsSection');
        $headersTable = $pane.find('.headersTable tbody');
        $headersCount = $pane.find('.headersCount');
        headersCount = scan.summary.headers;

        // populate the dataset name field
        $pane.find('.headline .fileName').text($.htmlEscape(state.fileName));

        // give the columns id refs; type of column
        _.each(columns, function(column, i)
        {
            column.id = i;
            column.type = 'column';
        });

        // create an options hash for pure columns
        columnSelectOptions = _.map(columns || [], function(column, i)
        {
            return { value: i, label: column.name };
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

        // add dropdowns to main template
        $('#templates > .columnsListLine .columnSourceCell').empty().append($sourceDropDown);

        // clone locations template and replace dropdowns
        $('#templates > .locationDetails').remove();
        var $locationTemplate = $('#templates > .locationDetailsOriginal').clone();
        $locationTemplate.find('.columnSourcePlaceholder').each(function()
        {
            var $this = $(this);
            var $dropDown = $columnDropDown.clone();
            $this.replaceWith($dropDown);
            $dropDown.addClass($this.attr('data-class'));
        });
        $locationTemplate.removeClass().addClass('locationDetails').appendTo('#templates');

        // throw in our default set of suggestions
        addDefaultColumns();

        // render out the sample data for the header section
        _(Math.min(5, scan.summary.sample.length)).times(function(i)
        {
            $headersTable.append($.tag({
                tagName: 'tr',
                'class': { value: 'header', onlyIf: i < scan.summary.headers },
                contents: _.map(scan.summary.sample[i], function(cell)
                    {
                        return { tagName: 'td', contents: cell };
                    })
            }));
        });

        // populate the number
        setHeadersCountText();

        // we are now past the first init, so start animating things
        isShown = true;
    },
    onActivate: function($pane, paneConfig, state)
    {
        if (!$.isBlank(submitError))
        {
            $pane.find('.flash').text(submitError)
                                .removeClass('warning notice')
                                .addClass('error');
        }
        else
        {
            $pane.find('.flash').empty().removeClass('warning notice error');
        }
    },
    onNext: function($pane, state)
    {
        // just to be sure, process everything one last time.
        // browser dom events are finnicky
        updateLines();
        if (!validateAll())
        {
            return null; // prevent moving on
        }

        state.importer = {};
        state.importer.importColumns = $.makeArray($columnsList.children().map(function()
        {
            return $.extend(true, {}, $(this).data('importColumn'));
        }));
        state.importer.headersCount = headersCount;
        return 'importing';
    }
};

var handleColumn = function(column)
{
    if (column.type == 'column')
    {
        return 'col' + (column.id + 1);
    }
    else if (column.type == 'static')
    {
        return '"' + column.value.replace(/\"/g, '\\"') + '"';
    }
};

importNS.importingPaneConfig = {
    disableButtons: [ 'cancel', 'prev', 'next' ],
    onActivate: function($pane, paneConfig, state, command)
    {
        // don't do anything here if we land here twice somehow
        if (state.importingActivated)
            return;
        state.importingActivated = true;

        $pane.loadingSpinner({showInitially: true});

        // let's figure out what to send to the server
        var importer = state.importer;
        var blueprint = {
            skip: importer.headersCount
        };

        // the server expects something much like what importColumns already are
        blueprint.columns = _.map(importer.importColumns, function(importColumn)
        {
            return {
                name: importColumn.name,
                datatype: importColumn.dataType
            };
        });

        // translations are a bit more complex
        var translation = '[' + _.map(importer.importColumns, function(importColumn)
        {
            var column = importColumn.column;
            var result;

            // deal with the column values
            if (_.isUndefined(column))
            {
                result = '""';
            }
            else if (column.type == 'column')
            {
                result = handleColumn(column);
            }
            else if (column.type == 'location')
            {
                var addressPart = _.map(_.compact(
                        [ column.address, column.city, column.state, column.zip ]), handleColumn).join(' + ", " + ');

                var latLongPart;
                if (!_.isUndefined(column.latitude) && !_.isUndefined(column.longitude))
                {
                    // yeah. this sucks. use a syntax highlighter.
                    latLongPart = '"(" + ' + handleColumn(column.latitude) + ' + ", " + ' +
                        handleColumn(column.longitude) + ' + ")"';
                }

                result = _.compact([addressPart, latLongPart]).join(' + ", " + ');
            }
            else if (column.type == 'composite')
            {
                result = _.map(column.sources, handleColumn).join(' + ');
            }

            // deal with transforms
            _.each(importColumn.transforms || [], function(transform)
            {
                if (transform.type == 'findReplace')
                {
                    var regexExpr = transform.options.find;
                    if (!transform.options.regex)
                        regexExpr = regexExpr.replace(/(\\|\^|\$|\?|\*|\+|\.|\(|\)|\{|\})/g,
                            function(match) { return '\\' + match; });

                    result = '(' + result + ').replace(/' + regexExpr + '/g' +
                        (!!transform.options.ignoreCase ? 'i' : '') + ', "' + transform.options.replace + '")';
                }
                else if (transform.type == 'customExpression')
                {
                    result = '(function(value){return ' + transform.options.expression + ';})(' + result + ')';
                }
                else
                {
                    result = transform.type + '(' + result + ')';
                }
            });

            return result;
        }).join() + ']';

        // fire it all off. note that data is a form-encoded payload, not json.
        $pane.find('.importStatus').empty();

        $.socrataServer.makeRequest({
            type: 'post',
            url: '/api/imports2.json',
            contentType: 'application/x-www-form-urlencoded',
            data: {
                name: state.fileName, 
                blueprint: JSON.stringify(blueprint),
                translation: translation,
                fileId: state.scan.fileId
            },
            success: function(response)
            {
                state.submittedView = new Dataset(response);
                command.next($.subKeyDefined(state.submittedView, 'metadata.warnings') ?
                    'importWarnings' : 'metadata');
            },
            error: function(request)
            {
                setTimeout(function()
                {
                    submitError = (request.status == 500) ?
                                   'An unknown error has occurred. Please try again in a bit.' :
                                   JSON.parse(request.responseText).message;
                    command.prev();
                }, 2000);
            },
            pending: function(response)
            {
                if ($.subKeyDefined(response, 'details.progress'))
                  $pane.find('.importStatus').text(response.details.progress + ' rows imported so far.');
            }
        });
    }
};

importNS.importWarningsPaneConfig = {
    onActivate: function($pane, paneConfig, state, command)
    {
        // pull off warnings and update the dataset to remove them
        var warnings = state.submittedView.metadata.warnings;
        var cleanedMetadata = $.extend({}, state.submittedView.metadata);
        delete cleanedMetadata.warnings;
        state.submittedView.update({ metadata: cleanedMetadata });
        // don't worry about saving; that will happen when the user hits next on the metadata

        var $importWarningsList = $pane.find('.importWarningsList');
        _.each(warnings, function(warning)
        {
            $importWarningsList.append($.tag({
                tagName: 'li',
                contents: $.htmlEscape(warning)
            }));
        });

        state.hadWarnings = true; // so that the metadata pane knows to go back by 2
    },
    onNext: 'metadata',
    onPrev: function($pane, state)
    {
        state.submittedView.remove();
        return 2; // go back two since we've imported.
    }
}

})(jQuery);
