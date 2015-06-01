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
var t = function(str, props) { return $.t('screens.import_pane.' + str, props); };

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
    submitError,
    $featureCount,
    $layerCount,
    referenceSystem,
    featureCount,
    $layersList,
    layers;

// used for reducing selectable types down to import types
var importTypes = {
    text: 'text',
    email: 'text',
    url: 'text',
    number: 'number',
    money: 'money',
    percent: 'percent',
    calendar_date: 'calendar_date',
    date: 'date',
    checkbox: 'text',
    location: 'text',
    html: 'text',
    star: 'number',
    flag: 'text',
    dataset_link: 'text'
};
var locationTypes = {
    address: 'text',
    city: 'text',
    state: 'text',
    zip: 'number',
    latitude: 'number',
    longitude: 'number'
};
var forbiddenTypes = [
    'document', 'document_obsolete',
    'photo', 'photo_obsolete',
    'nested_table'
];

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

        if ($.isBlank(column))
            return; // this importColumn has no source column

        if ((importColumn.dataType == 'location') && (column.type == 'location'))
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

        // only the first time, populate location stuff from model
        var locationOptionSelector = '.locationTypeToggle.multipleColumns';;
        var column = $line.data('column');
        var dsColumn = $line.data('dsColumn');
        if ((!$.isBlank(column) && (column.suggestion == 'location')) ||     // go into location if we are suggesting it
            (!$.isBlank(dsColumn) && (dsColumn.dataTypeName == 'location'))) // or if we absolutely know we need it
        {
            if ($.isBlank(column) || (column.type == 'location'))
            {
                _.each(column, function(originalColumn, field)
                {
                    $section.find('.location' + $.capitalize(field) + 'Column')
                        .val(originalColumn.id).trigger('change'); // and again here
                });
            }
            else
            {
                $section.find('.locationSingleColumn').val(column.id).trigger('change');
                locationOptionSelector = '.locationTypeToggle.singleColumn';
            }
        }

        // if we have an option to select, go select it manually; otherwise events
        // get too tangled
        $section.find(locationOptionSelector)
            .click()
            .closest('.toggleSection').siblings('.toggleSection')
                .next().hide();

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
    {
        $elems = $columnsList.children();
    }

    $elems.each(function()
    {
        var $line = $(this);

        var column;
        var oldColumn = $line.data('column') || {};
        var dsColumn = $line.data('dsColumn');

        var importColumn;
        if (_.isUndefined(dsColumn))
        {
            importColumn = {
                name: $line.find('.columnName').val(),
                dataType: $line.find('.columnTypeSelect').val()
            };
        }
        else
        {
            importColumn = {
                name: dsColumn.name,
                dataType: dsColumn.dataTypeName
            };
        }

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
            showSubsection($line, 'locationDetails');
            hideSubsection($line, 'compositeDetails');
            hideSubsection($line, 'generalDetails');
            $line.find('.mainLine .columnSourceSelect').closest('.uniform').hide();
            $line.find('.mainLine a.options').hide();

            if ($line.find('.locationDetails .locationTypeToggle.multipleColumns').is(':checked'))
            {
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
            else
            {
                column = getColumn($line.find('.locationSingleColumn').val());
            }
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

var updateLayerLines = function($elems)
{
    if (_.isUndefined($elems))
    {
        $elems = $layersList.children();
    }

    $elems.each(function()
    {
        var $line = $(this);

        var oldLayer = $line.data('layer');
        var importLayer = {
            layerId: oldLayer.layerId,
            name: $line.find('.layerName').val()
        };

        var replacingUid = $line.find('.layerReplaceDropdown').val();
        if (!$.isBlank(replacingUid))
        {
            importLayer.replacingUid = replacingUid;
        }

        $line.data('importLayer', importLayer);
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
        var dsColumn = $line.data('dsColumn');

        // track names seen
        if (_.isUndefined(names[importColumn.name]))
            names[importColumn.name] = [importColumn];
        else
            names[importColumn.name].push(importColumn);

        // if we don't have a column, just bail. if we don't have an importColumn, we have serious issues.
        if ($.isBlank(column) || (column.type == 'static'))
            return;

        // validate data type
        if ((importColumn.dataType == 'location') && (column.type == 'location'))
        {
            // composite location requires special validation
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
                    'the columns you have specified will yield a valid ' + importColumn.dataType + '.');
            }
        }
        else if (!_.isUndefined(dsColumn))
        {
            // location and composite are still special, but otherwise if we're
            // reimporting then the comparison is a bit different.
            var dsImportType = importTypes[dsColumn.dataTypeName];
            if ((column.suggestion != dsImportType) &&
                (dsImportType != 'text'))
            {
                // warn about type mismatch, but only about upconvert, not downconvert
                var invalidPercentage = Math.round(1000 *
                    (1 - (column.types[dsImportType] / column.processed))) / 10.0;

                if (_.isNaN(invalidPercentage))
                {
                    addValidationError(importColumn, 'warning',
                        'a <strong>' + $.capitalize(typesToText(dsColumn.dataTypeName)) + '</strong>, but our ' +
                        'analysis indicates that the source column you are trying to import into it is ' +
                        'of type <strong>' + $.capitalize(column.suggestion) + '</strong>. If you run into ' +
                        'problems with the import, please ensure that the source data is formatted correctly as ' +
                        '<strong>' + $.capitalize(dsColumn.dataTypeName) + '</strong>.');
                }
                else
                {
                    addValidationError(importColumn, 'warning',
                        'a <strong>' + $.capitalize(typesToText(dsColumn.dataTypeName)) + '</strong>, but our ' +
                        'analysis indicates that the source column you are trying to import into it is ' +
                        'of type <strong>' + $.capitalize(column.suggestion) + '</strong>. Should you ' +
                        'choose to import that column, roughly <strong>' + invalidPercentage + '%</strong> ' +
                        'of your data will likely import incorrectly.');
                }
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
            '</strong> of your columns ' + (names.tags.length == 1 ? 'is' : 'are') +
            ' named &ldquo;tags&rdquo;. Columns may not be named &ldquo;tags&rdquo;.');
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
        var overriddenColumn = $.extend({}, column, overrides);

        // populate standard things
        $line.find('.columnName').val(overriddenColumn.name);
        $line.find('.columnTypeSelect').val(overriddenColumn.suggestion);
        $line.find('.columnSourceCell select').val(overriddenColumn.id);

        $line.data('column', column);
    }

    // styling
    $line.find('select, :radio').uniform();

    return $line;
};

var newLayerLine = function(layer)
{
    // render template
    var line = $.renderTemplate('layersListLine', undefined, undefined, true);
    $layersList.append(line);
    // grab that thing we just did
    var $line = $layersList.children(':last');

    // populate fields if we have a column
    if (!$.isBlank(layer))
    {
        // populate standard things
        var $layerName = $line.find('.layerName');
        $layerName
            .attr('id', 'layerName_' + layer.id)
            .example(function ()
            {
                return $(this).attr('title');
            })
            .rules('add',
            {
                messages:
                {
                    required: 'You must enter a name for this layer.'
                }
            });

        if (layer.name)
        {
            $layerName.val(layer.name).removeClass("prompt");
        }

        var layerReferenceSystemId = 'layerReferenceSystem_' + layer.id;
        var $layerReferenceSystemCell = $line.find('.layerReferenceSystemCell');

        if (layer.referenceSystem)
        {
            $layerReferenceSystemCell.text(layer.referenceSystem);
        }
        else
        {
            $layerReferenceSystemCell.text("(no reference system detected)");
        }

        $line.data('layer', layer);
    }
};

var newReimportLine = function(column)
{
    var dsColumn = column[0];
    var scanColumn = column[1];

    var $line = $.renderTemplate('columnsListLine', dsColumn, {
        '.columnDestinationCell': 'name!',
        '.columnTypeCell': 'dataType.title'
    });
    $columnsList.append($line);

    $line.data('dsColumn', dsColumn);
    if (_.include(forbiddenTypes, dsColumn.dataTypeName))
    {
        $line.find('.columnSourceCell')
            .empty()
            .append($.tag({ tagName: 'div', 'class': 'forbiddenColumnType',
                            contents: 'This column cannot be imported into.' }));
        $line.find('.columnActionCell').hide();
    }
    else if (!$.isBlank(scanColumn))
    {
        $line.find('.columnSourceCell select').val(scanColumn.id);
        $line.data('column', scanColumn);
    }

    $line.find('select, :radio').uniform();

    return $line;
};

// clear out all the columns
var emptyColumnsList = function()
{
    $columnsList.empty();
    validateAll(); // go straight to validate; nothing to update.
};

var _updateRawLines = function(lines)
{
    var $lines = _.reduce(
        _.rest(lines),
        function($linesSoFar, $line) { return $linesSoFar.add($line); },
        _.first(lines));
    updateLines($lines);
};

var _finalizeAddColumns = function()
{
    validateAll();
    wireEvents();
    $columnsList.show();
    $pane.find('.columnsToolbar').show();
    $pane.find('.pendingColumnsMessage').hide();
};

var setAsideCompositeColumns = function(availableColumns, compositeColumns)
{
    // achtung! we have to return availableColumns because we mutate it out-of-place!
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

    return availableColumns;
};

// throw in all analysed columns, with location groups
var addDefaultColumns = function(flat, duplicateComposites)
{
    // keep track of what we haven't used
    var availableColumns = _.clone(columns);
    var compositeColumns = [];

    // don't run the composites scan if they want it flat
    if (flat !== true)
    {
        if (duplicateComposites === true)
        {
            setAsideCompositeColumns(availableColumns, compositeColumns);
        }
        else
        {
            availableColumns = setAsideCompositeColumns(availableColumns, compositeColumns);
        }
    }

    // now add the ones we haven't used as individual columns, plus our compositeColumns
    $.batchProcess(
        availableColumns.concat(compositeColumns), 15, newLine,
        _updateRawLines, _finalizeAddColumns);
};

// TODO: Also factor in forbidden columns!
var addGuessedDatasetColumns = function()
{
    // attempt to reconstruct the correct setting if at all possible

    var scanColumns = _.clone(columns);
    var scanLocations = scan.summary.locations || [];

    var ds = blist.importer.dataset;
    var dsColumns = ds.visibleColumns;

    var resultColumns;

    // if we have exactly the same number of columns, just 1:1 map.
    // what's the worst that could happen? (a lot)
    if (scanColumns.length === dsColumns.length)
    {
        resultColumns = _.zip(dsColumns, scanColumns);
    }
    // see if we have a matching once we deal a bit with location
    // columns.
    else if ((scanLocations.length > 0) && (ds.columnsForType('location')))
    {
        var availableColumns = _.clone(columns);
        var compositeColumns = [];
        availableColumns = setAsideCompositeColumns(availableColumns, compositeColumns);

        var potentialResultColumns = availableColumns.concat(compositeColumns);
        if (potentialResultColumns.length !== dsColumns.length)
        {
            // no? okay. maybe they imported the locations *and* kept the originals?
            potentialResultColumns = _.clone(columns).concat(compositeColumns);
        }

        // see if either of the above worked
        if (potentialResultColumns.length == dsColumns.length)
        {
            resultColumns = _.zip(dsColumns, potentialResultColumns);
        }
    }

    // okay, we're in trouble. do our best to match heuristically and
    // hope the user notices if things have gone wrong.
    if ($.isBlank(resultColumns))
    {
        var scanIdx = 0;
        var guessedColumns = _.map(dsColumns, function(dsColumn, dsIdx)
        {
            // if we have more scan than ds columns, be more tolerant of
            // skipping; vice versa

            if (scanColumns.length > dsColumns.length)
            {
                // if the while loop continues, we are skipping a scanColumn.
                while ((scanColumns.length - scanIdx) > (dsColumns.length - dsIdx))
                {
                    var scanColumn = scanColumns[scanIdx];
                    scanIdx++;

                    // if the type is a complete mismatch, then we probably
                    // don't want to do this.
                    if (importTypes[dsColumn.dataTypeName] != importTypes[scanColumn.suggestion])
                    {
                        continue;
                    }

                    // otherwise apply more heuristics. haven't thought of any yet
                    // that don't involve recursive backtracking, so otherwise just accept
                    return scanColumn;
                }

                // we've hit crunch time since we've fallen out of that loop.
                // submit what we have.
                return scanColumns[scanIdx++];
            }
            else
            {
                var scanColumn = scanColumns[scanIdx];
                if ($.isBlank(scanColumn))
                {
                    return null;
                }

                if ((scanColumns.length - scanIdx) >= (dsColumns.length - dsIdx))
                {
                    // if we're in crunch time we have no choice
                    scanIdx++;
                    return scanColumn;
                }

                // next see if column header name analysis might help. do a
                // rough levenshtein with a ~50% difference allowance
                if (dsColumn.name.heuristicDistance(scanColumn.name) < (dsColumn.name.length * 0.5))
                {
                    scanIdx++;
                    return scanColumn;
                }

                // next see if we have an exact column type match, and that match
                // isn't text. if so, maybe we can accept this result.
                if ((dsColumn.dataTypeName === scanColumn.suggestion) &&
                    (dsColumn.dataTypeName != 'text'))
                {
                    scanIdx++;
                    return scanColumn;
                }

                // otherwise we're not too sure about this. let's punt on the
                // match and try a later one.
                return null;
            }
        });
        resultColumns = _.zip(dsColumns, guessedColumns);
    }

    $.batchProcess(resultColumns, 15, newReimportLine, _updateRawLines, _finalizeAddColumns);
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
    var prefix;
    if (headersCount === 0)
    { trans_key = 'no_headers'; }
    else if (headersCount === 1)
    { trans_key = 'one_header'; }
    else
    { trans_key = 'many_headers'; }
    $headersCount.text(t(trans_key, { num: $.capitalize($.wordify(headersCount)) }));
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
                   '.columnsList li input[type=text],' +
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
        else if (presetType == 'suggestedPlusDiscrete')
            addDefaultColumns(false, true);

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

    // choose appropriate location import section
    $pane.delegate('.columnsList li .locationDetails .locationTypeToggle', 'change', function(event)
    {
        var $section = $(this).closest('.toggleSection');

        $section.siblings('.toggleSection')
                .next()[isShown ? 'slideUp' : 'hide']();
        $section.next()[isShown ? 'slideDown' : 'show']();
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

    if (_.isFunction($columnsList.awesomereorder))
    {
        // awesomeReorder is simply not included on the append/replace page
        $columnsList.awesomereorder({
            uiDraggableDefaults: {
                handle: '.importHandleCell'
            }
        });
    }

    $('.importTypesMessageLink').click(function(event)
    {
        event.preventDefault();
        $('#importTypesMessage').jqmShow();
    });
};

// config
importNS.uploadFilePaneConfig = {
    disableButtons: [ 'next' ],
    onInitialize: function($pane, config, state, command)
    {
        // update text
        var isBlist = state.type == 'blist';
        $pane.find('.headline').text(t('headline_' + (isBlist ? 'import' : 'upload')));
        $pane.find('.uploadFileFormats').addClass(state.type);

        // uploader
        // Only the #scan and #create methods are available on NBE as of now.
        var uploadEndpoint = '/imports2.txt?method=';
        if (state.type == 'blist')
        {
            uploadEndpoint += 'scan&nbe=' + !!blist.feature_flags.default_imports_to_nbe;
        }
        else if (state.type == 'shapefile')
        {
            uploadEndpoint += 'scanShape';
        }
        else
        {
            // if we're dealing with an existing blobby view, we have to do something
            // different from if we're doing a new one
            if ((state.operation == 'replace') && !_.isUndefined(blist.importer.dataset))
            {
                uploadEndpoint = '/views/' + blist.importer.dataset.id + '.txt?method=replaceBlob';
            }
            else
            {
                uploadEndpoint += 'blob';
            }
        }

        var $uploadThrobber = $pane.find('.uploadThrobber');
        var $uploadFileErrorHelp = $pane.find('.uploadFileErrorHelp');
        var uploader = blist.fileUploader({
            element: $pane.find('.uploadFileButtonWrapper')[0],
            action: uploadEndpoint,
            multiple: false,
            onSubmit: function(id, fileName)
            {
                var ext = (fileName.indexOf('.') >= 0) ? fileName.replace(/.*\./, '') : '';
                if (state.type == 'blobby') {
                    // We'll accept any type for a blob.
                }
                else if (state.type == 'shapefile')
                {
                    if (!(ext && /^(zip|kml|kmz)$/i.test(ext)))
                    {
                        // Only accept ZIP and KML for shapefile.
                        $pane.find('.uploadFileName')
                            .val(t('filetype_error_shapefile'))
                            .addClass('error');
                        return false;
                    }
                }
                else if (!(ext && /^(tsv|csv|xls|xlsx)$/i.test(ext)))
                {
                    // For all other state.type, accept only data files.
                    $pane.find('.uploadFileName')
                        .val(t('filetype_error_blist'))
                        .addClass('error');
                    return false;
                }
                state.fileName = fileName; // save this off since the imports service needs it later

                $pane.find('.uploadFileName')
                    .val(fileName)
                    .removeClass('error');

                $uploadThrobber.slideDown()
                               .find('.text').text(t('uploading') + '...');
                $uploadFileErrorHelp.slideUp();
            },
            onProgress: function(id, fileName, loaded, total)
            {
                if (loaded < total)
                    $uploadThrobber.find('.text').text(t('uploading') + ' (' +
                                                       (Math.round(loaded / total * 1000) / 10) + '% of ' +
                                                       uploader._formatSize(total) + ')...');
                else
                    $uploadThrobber.find('.text').text(t('analyzing'));
            },
            onComplete: function(id, fileName, response)
            {
                if ($.isBlank(response) || _.isEmpty(response) || (response.error == true))
                {
                    $uploadThrobber.slideUp();
                    $uploadFileErrorHelp.slideDown();
                    $pane.find('.uploadFileName')
                        .val(t('problem_' + ((state.type == 'blobby' || state.type == 'shapefile') ? 'uploading' : 'importing')))
                        .addClass('error');
                    return false;
                }

                state.fileObj = uploader._handler._files[id];

                // if it happens too fast it's bewildering
                setTimeout(function()
                {
                    $uploadThrobber.slideUp();
                    $uploadFileErrorHelp.slideUp();
                    $pane.find('.uploadFileName').val(t('no_file_selected'));
                    if (state.type == 'blobby')
                    {
                        state.submittedView = new Dataset(response);
                        command.next(state.afterUpload || 'metadata');
                    }
                    else
                    {
                        state.scan = response;
                        command.next(state.afterUpload);
                    }
                }, 1000);
            }
        });
    }
};
importNS.crossloadFilePaneConfig = {
    disableButtons: [ 'next' ],
    onInitialize: function($pane, config, state, command)
    {
        $pane.find('.crossloadUrlButton').click(function(event)
        {
            event.preventDefault();

            var $this = $(this);
            var $uploadThrobber = $pane.find('.uploadThrobber');
            if ($this.hasClass('disabled')) { return; }

            if (command.valid())
            {
                $this.addClass('disabled');
                $uploadThrobber.slideDown().find('.text').text(t('downloading'));

                var targetUrl = $pane.find('.crossloadUrl').val().trim();
                $.socrataServer.makeRequest({
                    type: 'post', contentType: 'application/x-www-form-urlencoded',
                    url: '/api/imports2?method=scanUrl',
                    data: { url: targetUrl },
                    pending: function(response)
                    {
                        if ($.subKeyDefined(response, 'details.progress'))
                        {
                            $uploadThrobber.find('.text').text(response.details.progress);
                        }
                    },
                    allComplete: function()
                    {
                        $this.removeClass('disabled');
                        $uploadThrobber.slideUp();
                    },
                    success: function(response)
                    {
                        state.scan = response;
                        state.fileName = targetUrl.match(/\/([^\?\/]*)(\?.*)?$/i)[1] || 'your file';
                        command.next('importColumns');
                    },
                    error: function(xhr)
                    {
                        var msg = t('unknown_error');
                        try
                        {
                            msg = JSON.parse(xhr.responseText).message + '.';
                        }
                        catch(ex)
                        {
                            msg = '';
                        }

                        $pane.find('.flash').addClass('error').text(msg + ' ' + t('assure_accessible'));
                    }
                });
            }
        });
    }
};

////////////////////////////////////////////////////
// shared helpers between import + append/replace

var prepareColumnsAndUI = function($paneLocal, paneConfig, state, command)
{
    // update global vars
    scan = state.scan;
    scan.summary.sample = scan.summary.sample || [];
    isShown = false;
    wizardCommand = command;
    columns = scan.summary.columns || [];
    locationGroups = scan.summary.locations || [];
    $pane = $paneLocal;
    $columnsList = $pane.find('.columnsList');
    $warningsList = $pane.find('.columnWarningsList');
    $warningsSection = $pane.find('.warningsSection');
    $headersTable = $pane.find('.headersTable tbody');
    $headersCount = $pane.find('.headersCount');
    headersCount = scan.summary.headers + 1;

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
    sourceColumns.push({ value: '', label: t('no_source_column'), 'class': 'special' });
    sourceColumns = sourceColumns.concat(columnSelectOptions);
    sourceColumns.push({ value: 'composite', label: t('combine_multiple_cols'), 'class': 'special' });

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

    // render out the sample data for the header section
    _(Math.min(5, scan.summary.sample.length)).times(function(i)
    {
        $headersTable.append($.tag({
            tagName: 'tr',
            'class': { value: 'header', onlyIf: i < scan.summary.headers },
            contents: _.map(scan.summary.sample[i], function(cell)
                {
                    return { tagName: 'td', contents: $.htmlEscape(cell) };
                })
        }));
    });

    // populate the header rows number
    setHeadersCountText();
    // and set the header rows ui
    $headersTable.children(':lt(' + headersCount + ')').addClass('header');

    // we are now past the first init, so start animating things
    isShown = true;
};

var columnsPaneActivated = function($pane)
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
};

var columnsPaneDeactivated = function($pane)
{
    submitError = null;
};

var setUpImportingPaneState = function(state)
{
    state.importer = {};
    state.importer.importColumns = $.makeArray($columnsList.children().map(function()
    {
        return $.extend(true, {}, $(this).data('importColumn'));
    }));
    state.importer.headersCount = headersCount;
};

/////////////////
// pane config

importNS.appendReplaceColumnsPaneConfig = {
    uniform: true,
    skipValidation: true,
    onInitialize: function($paneLocal, paneConfig, state, command)
    {
        prepareColumnsAndUI($paneLocal, paneConfig, state, command);

        // add just the real dataset's columns
        addGuessedDatasetColumns();
    },
    onActivate: columnsPaneActivated,
    onNext: function($pane, state)
    {
        // as with import, double check here
        updateLines();
        if (!validateAll())
        {
            return null;
        }

        setUpImportingPaneState(state);
        return 'importing';
    },
    onPrev: columnsPaneDeactivated
};

importNS.importColumnsPaneConfig = {
    uniform: true,
    skipValidation: true,
    onInitialize: function($paneLocal, paneConfig, state, command)
    {
        prepareColumnsAndUI($paneLocal, paneConfig, state);

        if (columns.length === 0)
        {
            _finalizeAddColumns()
            return; // nothin to do!
        }

        // throw in our default set of suggestions
        addDefaultColumns();
    },
    onActivate: columnsPaneActivated,
    onNext: function($pane, state)
    {
        // just to be sure, process everything one last time.
        // browser dom events are finnicky
        updateLines();
        if (!validateAll())
        {
            return null; // prevent moving on
        }

        state.operation = 'import';
        setUpImportingPaneState(state);
        return 'importing';
    },
    onPrev: columnsPaneDeactivated
};

importNS.importShapefilePaneConfig = {
    uniform: true,
    onInitialize: function($paneLocal, paneConfig, state, command)
    {
        // update global vars
        scan = state.scan;
        isShown = false;
        wizardCommand = command;
        layers = scan.summary.layers
        $pane = $paneLocal;
        $layersList = $pane.find('.layersList');
        $featureCount = $pane.find('.featureCount');
        $layerCount = $pane.find('.layerCount');
        featureCount = scan.summary.totalFeatureCount;
        layerCount = scan.summary.layers.length;

        // populate the dataset name field
        $pane.find('.headline .fileName').text($.htmlEscape(state.fileName));

        // populate the summary data
        $featureCount.text(featureCount);
        $layerCount.text(layerCount);

        _.each(layers, function(layer, i)
        {
            layer.id = i
            layer.type = 'layer';

            newLayerLine(layer);
        });

        $pane.delegate('.layersList li input', 'change', function()
        {
            updateLayerLines($(this).closest('li.importLayer'));
        });

        $layersList.awesomereorder({
            uiDraggableDefaults: {
                handle: '.importHandleCell'
            }
        });

        $layersList.show();
        $pane.find('.pendingLayersMessage').hide();

        // we are now past the first init, so start animating things
        isShown = true;

        // if we're replacing layers, let the user choose how they line up
        if (!_.isUndefined(blist.importer.dataset))
        {
            blist.importer.dataset.getChildOptionsForType('table', function(children)
            {
                var options = _.map(children, function(child)
                {
                    return $.tag({ tagName: 'option', value: child.id,
                                   contents: child.name }, true);
                }).join('');

                $layersList.children('li').each(function(index)
                {
                    $(this).find('.layerReplaceDropdown')
                        .attr('id', 'layerReplaceSelect_' + index)
                        .append(options)
                        .prop('selectedIndex', index + 1);
                }).on('change', 'select.layerReplaceDropdown', function(event)
                {
                    // make sure they don't select the same layer twice
                    var $t = $(event.target),
                        uid = $t.val();
                    if (!$.isBlank(uid))
                    {
                        $t.closest('li').siblings('li').each(function()
                        {
                            var $select = $(this).find('select.layerReplaceDropdown');
                            if ($select.val() == uid)
                            {
                                $select.prop('selectedIndex', 0);
                                $.uniform.update('select.layerReplaceDropdown');
                            }
                        });
                    }
                });

                $.uniform.update('select.layerReplaceDropdown');
                $pane.addClass('childViewsLoaded');
            });
        }
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
        updateLayerLines();

        state.importer = {}
        state.importer.importLayers = $.makeArray($layersList.children().map(function()
        {
            return $.extend(true, {}, $(this).data('importLayer'));
        }));
        state.operation = !_.isUndefined(blist.importer.dataset) ? 'replaceShapefile' : 'shapefile';
        return 'importing';
    },
    onPrev: columnsPaneDeactivated
};

// helper for importing pane (parsing columns)
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
        submitError = null;

        $pane.loadingSpinner({showInitially: true});

        // let's figure out what to send to the server
        var importer, blueprint, translation;
        importer = state.importer;
        if (state.type == 'shapefile')
        {
            blueprint = {};

            blueprint.layers = _.map(importer.importLayers, function(importLayer)
            {
                return {
                    layerId: importLayer.layerId,
                    name: importLayer.name,
                    referenceSystem: importLayer.referenceSystem,
                    replacingUid: importLayer.replacingUid
                }
            });
        }
        else
        {
            blueprint = {
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
            translation = '[' + _.map(importer.importColumns, function(importColumn)
            {
                var column = importColumn.column;
                var result;

                // deal with the column values
                if ($.isBlank(column) || (column.type == 'static'))
                {
                    result = '""';
                }
                else if (column.type == 'column')
                {
                    result = handleColumn(column);
                }
                else if (column.type == 'location')
                {
                    // we're using js to build a js expression that will build a json blob.
                    // BWAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH
                    result = [];
                    result.push('JSON.stringify({');
                    if (!_.isUndefined(column.latitude) && !_.isUndefined(column.longitude))
                    {
                      result.push('latitude:' + handleColumn(column.latitude) + ',');
                      result.push('longitude:' + handleColumn(column.longitude) + ',');
                    }
                    result.push(	'human_address:{');
                    if (!_.isUndefined(column.address))
                      result.push(	'address:' + handleColumn(column.address) + ',');
                    if (!_.isUndefined(column.city))
                      result.push(	'city:' + handleColumn(column.city) + ',');
                    if (!_.isUndefined(column.state))
                      result.push(	'state:' + handleColumn(column.state) + ',');
                    if (!_.isUndefined(column.zip))
                      result.push(	'zip:' + handleColumn(column.zip));
                    result.push('}})');
                    return result.join('');
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
                            regexExpr = regexExpr.replace(/(\\|\^|\$|\?|\*|\+|\.|\(|\)|\{|\}|\|)/g,
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
        }

        // fire it all off. note that data is a form-encoded payload, not json.
        $pane.find('.importStatus').empty();

        var dataPayload = {
            name: state.fileName,
            translation: translation,
            fileId: state.scan.fileId
        };

        if ((state.operation == 'import') || (state.type == 'shapefile'))
        {
            dataPayload.blueprint = JSON.stringify(blueprint);
        }

        var isReimport = _.include(['append', 'replace', 'replaceShapefile'], state.operation);
        if (isReimport)
        {
            $.extend(dataPayload, {
                viewUid: blist.importer.dataset.id,
                skip: blueprint.skip
            });
        }

        var urlParams = { nbe: !!blist.feature_flags.default_imports_to_nbe };
        if (state.operation != 'import') {
          urlParams.method = state.operation;
        }

        // Delta Importer implementation requires Web Workers.
        var useDI2 = _.isFunction(Worker)
            && blist.feature_flags.default_imports_to_nbe == 'delta-importer';

        if (useDI2) {
          var promiseQueue = [];

          if (isReimport) {
            dataset = blist.importer.dataset;
          } else {

            // Before we can DI2, we must create the view...
            promiseQueue.push(function() {
              return $.socrataServer.makeRequestWithPromise({
                type: 'post',
                url: '/views?nbe=true',
                data: JSON.stringify({ name: state.fileName })
              })
            });

            // ...and we must add the columns to that view.
            promiseQueue.push(function(dataset, statusMsg, xhr) {
              // Adding the name to the file object for funsies.
              dataset.name = state.fileName;

              var deferred = $.Deferred();
              $.serialPromiser(_.map(blueprint.columns, function(column, index) {
                var colSpec = {};
                colSpec.name = column.name;
                colSpec.dataTypeName = column.datatype;
                colSpec.position = index + 1; // REMOVE: This doesn't work.

                return function() {
                  return $.socrataServer.makeRequestWithPromise({
                    type: 'post',
                    url: '/views/' + dataset.id + '/columns?nbe=true',
                    data: JSON.stringify(colSpec)
                  }).then(function(columnData) {
                    // Adding column data to local object in order to save visibility later.
                    dataset.columns.push(columnData);
                  });
                };
              })).then(function() {
                deferred.resolve(dataset);
              }).fail(function() {
                deferred.reject();
              });
              return deferred.promise();
            });
          }

          promiseQueue.push(function(dataset) {
            // A dataset should be passed in. If not, then this should
            // be an append, and the DS should be in blist.importer.
            dataset = dataset || blist.importer.dataset;

            // Bcuz core importer thinks skip:1 means 'header at line 0',
            // but delta importer thinks skip:1 means 'header at line 1'.
            // Sigh.
            blueprint.skip -= 1;

            var ext = state.fileName.match(/\.(\w+)$/)[1];
            var operation;
            if (state.operation == 'import') {
              operation = 'replace';
            } else {
              operation = state.operation;
            }

            return $.dataSync.upload(state.fileObj, {
              datasetId: dataset.id,
              blueprint: blueprint,
              action: operation,
              fileType: ext,
              onComplete: function(p) {
                state.submittedView = new Dataset(dataset);
                var nextState;
                if ($.subKeyDefined(state.submittedView, 'metadata.warnings')) {
                  nextState = 'importWarnings';
                } else {
                  if (isReimport) {
                    nextState = 'finish';
                  } else {
                    nextState = 'metadata'
                  }
                }
                command.next(nextState);
              },
              onError: function(errObj) {
                setTimeout(function() {
                  if ($.deepGet(errObj, 'details', 'response', 'status') === 500) {
                    submitError = t('unknown_error') + '. ' + t('try_again');
                  } else {
                    // TODO: Build a way to parse the error messages.
                    submitError = 'blargh'; // JSON.parse(request.responseText).message;
                  }

                  command.prev();
                }, 2000);
              },
              //onProgress: function(p) { console.log('progress', p); }
              onProgress: function(p) {
                console.info('progress', p);
                var message = t('bytes_imported', { num: p.bytes_uploaded });
                $pane.find('.importStatus').text(message);
              }
            });
          });
          $.serialPromiser(promiseQueue);
        } else {
          $.socrataServer.makeRequest({
              type: 'post',
              url: '/api/imports2.json?' + $.toParam(urlParams),
              contentType: 'application/x-www-form-urlencoded',
              data: dataPayload,
              success: function(response)
              {
                  state.submittedView = new Dataset(response);
                  command.next($.subKeyDefined(state.submittedView, 'metadata.warnings') ?
                      'importWarnings' : (isReimport ? 'finish' : 'metadata'));
              },
              error: function(request)
              {
                  setTimeout(function()
                  {
                      submitError = (request.status == 500) ?
                                     (t('unknown_error') + '. ' + t('try_again')) :
                                     JSON.parse(request.responseText).message;
                      command.prev();
                  }, 2000);
              },
              pending: function(response)
              {
                  if ($.subKeyDefined(response, 'details.progress'))
                  {
                      var message = t('rows_imported', { num: response.details.progress });
                      if ($.subKeyDefined(response, 'details.layer'))
                          message = t('layer') + '  ' + response.details.layer + ": " + message;
                      $pane.find('.importStatus').text(message);
                  }
              }
          });
        }
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
    onNext: function($pane, state)
    {
        return ((state.operation == 'append') || (state.operation == 'replace')) ?
            'finish' : 'metadata';
    },
    onPrev: function($pane, state)
    {
        if ((state.operation != 'append') && (state.operation != 'replace'))
        {
            state.submittedView.remove();
        }
        return 2; // go back two since we've imported.
    }
}

})(jQuery);
