var editRRNS = blist.namespace.fetch('blist.editRR');

// ------------ Resizing -------------
editRRNS.initResizing = function()
{
    var adjustSizes = function()
    {
        // match page height
        var $content = $('#layoutContainer');
        var $contentBox = $('.contentBox');
        var $innerWrapper = $('.siteInnerWrapper');
        $content.height($(window).height() -
            $('#siteHeader').outerHeight(false) -
            ($innerWrapper.outerHeight(true) - $innerWrapper.height()) -
            $('.contentBox .header').outerHeight(true) -
            ($contentBox.outerHeight(true) - $contentBox.height()) -
            ($content.outerHeight(true) - $content.height()));

        editRRNS.setColSizes();
    };
    adjustSizes();
    $(window).resize(adjustSizes);
};


// --------------- Sidebar ---------------
editRRNS.initSidebar = function()
{
    var sortFunc = function(c)
    {
        // Sort all the visible columns first, so start the sort string
        // with 'a'; then sort by position.  For hidden columns, start
        // with 'z' to sort them at the end; then just sort
        // alphabetically
        if (!c.hidden)
        { return 'a' + ('000' + c.position).slice(-3); }
        return 'z' + c.name;
    };
    var cols = _.sortBy(blist.dataset.realColumns, sortFunc);

    var paletteConfig = {
        name: 'palette',
        title: 'Add Fields',
        subtitle: 'Choose fields to add to your layout',
        sections: [{
            title: 'Fields',
            customContent: {
                template: 'fieldPalette',
                directive: {
                    'li.columnItem': {
                        'column<-': {
                            '.columnLabel': 'column.name!',
                            '.columnLabel@data-tcId': 'column.tableColumnId',
                            '.columnData': '(Data for #{column.name!})',
                            '.columnData@data-tcId': 'column.tableColumnId',
                            '.columnData@class+':
                                'columnId#{column.id} #{column.renderTypeName}'
                        }
                    }
                },
                data: cols,
                callback: function($sect)
                {
                    $sect.find('.fieldItem').each(function()
                        { editRRNS.enableFieldItem($(this)); });
                }
            }
        }]
    };
    $.gridSidebar.registerConfig(paletteConfig);

    // Init and wire sidebar
    editRRNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: editRRNS.$container,
        setSidebarTop: false
    });

    editRRNS.sidebar.show('palette');
};



// ---------- Drag / Drop -------------

// Handle placing a field during dragging
editRRNS.itemDragging = function(ui, primaryPos, linePos)
{
    if ($.isBlank(editRRNS.$dropCont)) { return; }

    // We need to find the best drop position across multiple lines, so use a
    // DOM node between each item to figure out possible positions, and group
    // them into lines based on the top position.
    var lines = [];
    var addDropSpot = function($item)
    {
        var dropOff = editRRNS.$dropFinder.offset();
        if (lines.length < 1 || lines[lines.length - 1].pos < dropOff[linePos])
        { lines.push({pos: dropOff[linePos], items: []}); }
        lines[lines.length - 1].items.push({pos: dropOff[primaryPos],
            beforeItem: $item});
    };

    var $fields = editRRNS.$dropCont.children('.ui-draggable').each(function()
    {
        var $t = $(this);
        $t.before(editRRNS.$dropFinder);
        addDropSpot($t);
    });

    // Then find the last position
    editRRNS.$dropCont.append(editRRNS.$dropFinder);
    addDropSpot();
    editRRNS.$dropFinder.remove();

    // Now look for the first line from the bottom where the top of the line
    // is above the drop item.  That is the line we are in.
    var foundLine = lines[0];
    for (var i = lines.length - 1; i >= 0; i--)
    {
        if (lines[i].pos < ui.offset[linePos])
        {
            foundLine = lines[i];
            break;
        }
    }

    // Now that we have the line, check each drop spot in the line, and just
    // find the closest.  That is now our position for the cursor, and the
    // item we want to insert before.
    var minDist = 100000; // Hopefully they won't be more than this many pixels away
    var foundPos;
    editRRNS.$dropBefore = null;
    _.each(foundLine.items, function(o)
    {
        var d = Math.abs(ui.offset[primaryPos] - o.pos);
        if (d < minDist)
        {
            minDist = d;
            editRRNS.$dropBefore = o.beforeItem;
            foundPos = o.pos;
        }
    });

    editRRNS.$dropCont.append(editRRNS.$dropIndicator);
    var contOffset = editRRNS.$dropCont.offset();
    editRRNS.$dropIndicator.css(linePos, foundLine.pos - contOffset[linePos]);
    editRRNS.$dropIndicator.css(primaryPos, foundPos - contOffset[primaryPos]);
};


// Hook up actions for an item in the layout area
editRRNS.enableFieldItem = function($item)
{
    if ($item.hasClass('staticLabel'))
    { $item.attr('title', 'Label with fixed text (double-click to edit)'); }
    else
    {
        var col = blist.dataset.columnForTCID($item.data('tcId'));
        if ($item.hasClass('columnLabel'))
        {
            $item.attr('title', 'Title for the ' + $.htmlEscape(col.name) +
                    ' column');
        }
        else if ($item.hasClass('columnData'))
        {
            $item.attr('title', 'Data for the ' + $.htmlEscape(col.name) +
                    ' column');
        }
    }

    editRRNS.makeDraggable($item, 'field', false, null, null, function(e, ui)
    {
        editRRNS.itemDragging(ui, 'left', 'top');
    });
};


editRRNS.makeDraggable = function($item, itemType, handle,
    startHandler, stopHandler, dragHandler, setWidth)
{
    $item.draggable({
        appendTo: $('.mainContainer'),
        cursorAt: {top: 5, left: 15},
        handle: handle,
        helper: 'clone',
        opacity: 0.8,
        revert: 'invalid',
        start: function(e, ui)
        {
            var $t = $(this);
            if (setWidth) { ui.helper.width($t.width()); }
            $t.addClass('itemDragging');
            editRRNS.$trashButton.find('.itemType').text(itemType.capitalize());
            if (_.isFunction(startHandler)) { startHandler(e, ui); }
        },
        stop: function(e, ui)
        {
            $(this).removeClass('itemDragging');
            editRRNS.$dropCont = null;
            editRRNS.$dropIndicator.remove();
            if (_.isFunction(stopHandler)) { stopHandler(e, ui); }
        },
        drag: dragHandler
    });
};

// Hook up drop acceptance
editRRNS.makeDroppable = function($item, selector, dropped, isTrash)
{
    $item.droppable({accept: selector,
        activeClass: 'inDrag',
        hoverClass: 'dragOver',
        tolerance: 'pointer',
        over: function()
        {
            var $t = $(this);
            // Defer this, since when dragging from one item to another, this
            // over may fire just before the out of the previous, in which
            // case the dropCont is cleared
            if (!isTrash) { _.defer(function() { editRRNS.$dropCont = $t; }); }
        },
        out: function()
        {
            editRRNS.$dropCont = null;
            editRRNS.$dropIndicator.remove();
        },
        drop: function(event, ui)
        {
            editRRNS.$dropCont = null;
            editRRNS.$dropIndicator.remove();

            var $cont = $(this);
            var $item = ui.draggable;

            if (isTrash)
            {
                _.defer(function()
                {
                    $item.remove();
                    editRRNS.setColSizes();
                    editRRNS.updateConfig();
                });
            }
            else
            {
                if ($item.closest('.renderArea').length < 1)
                {
                    $item = $item.clone().removeClass('ui-draggable itemDragging')
                        .addClass('inLayout');
                }

                if ($.isBlank(editRRNS.$dropBefore))
                { $cont.append($item); }
                else
                {
                    if ($item.index(editRRNS.$dropBefore) >= 0) { return; }
                    editRRNS.$dropBefore.before($item);
                }

                if (_.isFunction(dropped)) { dropped($item); }
                editRRNS.renderCurrentRow();
                editRRNS.updateConfig();
            }
            editRRNS.$dropBefore = null;
        }});
};


// ------------- Layout -----------------

// Do row load and render
editRRNS.renderCurrentRow = function()
{
    blist.dataset.getRows(editRRNS.navigation.currentPage(), 1, function(rows)
    {
        if (rows.length == 1)
        { editRRNS.richRenderer.renderRow(editRRNS.$renderArea, rows[0]); }
    });
};

// Pull and update the new config
editRRNS.updateConfig = function()
{
    var getStyles = function($item)
    {
        var s = $item.data('rr-styles') || {};
        _.each(['width', 'height'], function(p)
        {
            if (!$.isBlank($item.data('rr-' + p)))
            { s[p] = $item.data('rr-' + p); }
        });

        return _.isEmpty(s) ? null : s;
    };

    var setColWidths = function($cols)
    {
        // Assume they are all siblings, so just grab the parent from the first
        var parW = $cols.parent().width();
        $cols.each(function()
        {
            var $c = $(this);
            if ($.isBlank($c.data('rr-width')) || $c.data('rr-width').endsWith('%'))
            {
                $c.data('rr-width',
                    Math.floor(100 * $c.outerWidth(true) / parW) + '%');
            }
        });
    };

    var conf = {columns: []};
    var processColumn;
    processColumn = function($col, parConf)
    {
        var c = {rows: []};
        var s = getStyles($col);
        if (!$.isBlank(s)) { c.styles = s; }
        $col.children('.richLine').each(function()
        {
            var r = {};
            var $r = $(this);
            s = getStyles($r);
            if (!$.isBlank(s)) { r.styles = s; }
            if ($r.children('.richColumn').length > 0)
            {
                r.columns = [];
                $r.children('.richColumn').each(function()
                { processColumn($(this), r); });
            }
            else
            {
                r.fields = [];
                $r.children('.fieldItem').each(function()
                {
                    var $f = $(this);
                    var f = {};
                    s = getStyles($f);
                    if (!$.isBlank(s)) { f.styles = s; }
                    if ($f.hasClass('columnData'))
                    {
                        f.type = 'columnData';
                        f.tableColumnId = $f.data('tcId');
                    }
                    else if ($f.hasClass('columnLabel'))
                    {
                        f.type = 'columnLabel';
                        f.tableColumnId = $f.data('tcId');
                    }
                    else if ($f.hasClass('staticLabel'))
                    {
                        f.type = 'label';
                        if (!$f.hasClass('defaultData'))
                        { f.text = $f.text(); }
                    }
                    r.fields.push(f);
                });
            }
            c.rows.push(r);
        });
        parConf.columns.push(c);
    };

    var $topCols = editRRNS.$renderArea.children('.richColumn');
    setColWidths($topCols);
    $topCols.each(function() { processColumn($(this), conf); });

    // Check if there are actually any fields
    var hasFields;
    hasFields = function(cols)
    { return _.any(cols || [], function(c)
            { return _.any(c.rows || [], function(r)
                {
                    return hasFields(r.columns) ||
                        (r.fields || []).length > 0;
                });
            });
    };

    var md = $.extend(true, {richRendererConfigs: {}}, blist.dataset.metadata);
    if (hasFields(conf.columns))
    { md.richRendererConfigs[editRRNS.renderType] = conf; }
    else
    { delete md.richRendererConfigs[editRRNS.renderType]; }
    blist.dataset.update({metadata: md});
};

editRRNS.renderCurrentLayout = function()
{
    editRRNS.richRenderer.renderLayout();
    editRRNS.setColSizes();

    editRRNS.setUpColumns(editRRNS.$renderArea.children('.richColumn'));
};

editRRNS.setUpRows = function($rows)
{
    $rows.each(function()
        {
            var $row = $(this);
            $row.prepend($.tag({tagName: 'a', href: '#Drag', title: 'Move row',
                'class': ['dragHandle', 'rowDrag']}));

            $row.hover(function() { $(this).parent().removeClass('hover'); },
                function() { $(this).parent().addClass('hover'); });

            editRRNS.makeDroppable($row, '.fieldItem',
                function($item) { editRRNS.enableFieldItem($item); });
            editRRNS.makeDraggable($row, 'row', '.rowDrag', null, null,
                function(e, ui)
                {
                    editRRNS.itemDragging(ui, 'top', 'left');
                }, true);
        });
};

editRRNS.setUpColumns = function($col)
{
    // Set up fields
    $col.find('.richItem, .richLabel')
        .addClass('fieldItem inLayout');
    $col.find('.staticLabel:empty').addClass('defaultData')
        .text('(Static text)');
    $col.find('.fieldItem').each(function()
        { editRRNS.enableFieldItem($(this)); });

    // Set up rows
    editRRNS.setUpRows($col.find('.richLine'))

    // Set up columns
    $col.find('.richColumn').andSelf().each(function()
    {
        var $c = $(this);
        $c.prepend($.tag({tagName: 'a', href: '#Drag', title: 'Move column',
            'class': ['dragHandle', 'columnDrag']}));
        $c.prepend($.tag({tagName: 'a', href: '#Add_Row',
            'class': ['add', 'addRow'], title: 'Add a row to this column',
            contents: {tagName: 'span', 'class': 'icon'}}));

        $c.hover(function() { $(this).addClass('hover'); },
            function() { $(this).removeClass('hover'); });

        editRRNS.makeDroppable($c, '.richLine');
        // When dragging a column, enlarge the main area just a bit, since
        // columns are forced-width, and might not allow room for the dropfinder
        // at the right edge
        editRRNS.makeDraggable($c, 'column', '.columnDrag',
            function()
            { editRRNS.$renderArea.width(editRRNS.$renderArea.width() + 5); },
            function() { editRRNS.$renderArea.css('width', 'auto'); },
            function(e, ui) { editRRNS.itemDragging(ui, 'left', 'top'); });
    });
};

editRRNS.setColSizes = function()
{
    // Need to adjust sizes for all columns to make them fit
    var $fixedCols = $();
    var $freeCols = $();
    $('.renderArea > .richColumn').each(function()
    {
        var $c = $(this);
        if ($.isBlank($c.data('rr-width')) || $c.data('rr-width').endsWith('%'))
        { $freeCols = $freeCols.add($c); }
        else
        { $fixedCols = $fixedCols.add($c); }
    });

    // First calculate what the percents currently add up to, and give a
    // reasonable default to any column without a percent
    var newPercent = Math.floor(100 / Math.max(1, $freeCols.length - 1));
    var totalPercent = 0;
    $freeCols.each(function()
    {
        var $c = $(this);
        if ($.isBlank($c.data('rr-width')))
        { $c.data('rr-width', newPercent + '%'); }
        totalPercent += parseInt($c.data('rr-width'));
    });

    var totalW = $('.renderArea').width();
    // Need to tweak columns with specified widths for borders & padding
    $fixedCols.each(function() { totalW -= $(this).outerWidth(true); });

    // Now that we know how much remaining space we have, set each of the
    // variable columns; and adjust their percent width so they all add
    // up to 100
    $freeCols.each(function()
    {
        var $c = $(this);
        var np = Math.floor(parseInt($c.data('rr-width')) / totalPercent * 100);
        $c.data('rr-width', np + '%');
        $c.width(np / 100 * totalW - ($c.outerWidth(true) - $c.width()));
    });
};

editRRNS.addTopLevelColumn = function()
{
    var $newCol = $.tag({tagName: 'div', 'class': 'richColumn',
            contents: {tagName: 'div', 'class': 'richLine'}});
    editRRNS.$renderArea.append($newCol);

    editRRNS.setColSizes();

    editRRNS.updateConfig();
    editRRNS.setUpColumns($newCol);
};

editRRNS.resetConfig = function()
{
    var config = ((blist.dataset.metadata || {}).richRendererConfigs ||
        {})[editRRNS.renderType] || {columns: [{rows: [{}]}]};
    editRRNS.richRenderer.setConfig(config);
    editRRNS.renderCurrentLayout();
};

editRRNS.initLayout = function()
{
    // Hook up rendering
    editRRNS.renderType = $.urlParam(window.location.href,
            'defaultRender') || 'fatRow';
    if (editRRNS.renderType == 'richList') { editRRNS.renderType = 'fatRow'; }

    editRRNS.richRenderer = editRRNS.$renderArea.richRenderer({
        defaultItem: '(Data for #{column.name})',
        view: blist.dataset });

    editRRNS.resetConfig();


    // Hook up navigation
    editRRNS.navigation = editRRNS.$container.find('.navigation')
        .bind('page_changed', editRRNS.renderCurrentRow)
        .navigation({pageSize: 1, view: blist.dataset});
    editRRNS.$trashButton = editRRNS.$container.find('.navigation .removeItem');
    editRRNS.makeDroppable(editRRNS.$trashButton,
        '.fieldItem.inLayout, .richLine, .richColumn', null, true);

    editRRNS.$container.find('a.clearLayout').click(function(e)
    {
        e.preventDefault();
        editRRNS.$renderArea.empty();
        editRRNS.addTopLevelColumn();
    });


    editRRNS.renderCurrentRow();

    editRRNS.makeDroppable($('.renderArea'), '.richColumn');

    // Handle switching types
    $('#renderTypeOptions').pillButtons();
    $('#renderTypeOptions li a').removeClass('active');
    $('#renderTypeOptions li .' + editRRNS.renderType.toLowerCase())
        .addClass('active');
    $('#renderTypeOptions a').click(function(e)
    {
        e.preventDefault();
        var rt = $.urlParam($(this).attr('href'), 'defaultRender');
        if (rt == 'richList') { rt = 'fatRow'; }

        $('#renderTypeOptions li a').removeClass('active');
        $('#renderTypeOptions li .' + rt.toLowerCase()).addClass('active');

        editRRNS.$container.removeClass('fatRowRenderType pageRenderType')
            .addClass(rt + 'RenderType');

        editRRNS.renderType = rt;
        editRRNS.resetConfig();
        editRRNS.renderCurrentRow();
    });

    // Edit static text
    var finishEdit = function($input, doSave)
    {
        editRRNS.$staticEditor = null;

        var $label = $input.closest('.staticLabel');
        var t = $label.data('origText');
        var newText;
        if (doSave) { newText = t = $input.value(); }

        if ($.isBlank(t))
        {
            $label.addClass('defaultData');
            t = '(Static text)';
        }
        else { $label.removeClass('defaultData'); }
        $label.removeClass('inEdit');
        $label.empty().text(t);
        $label.draggable('enable');

        if (doSave && newText != $label.data('origText'))
        { editRRNS.updateConfig(); }
    };

    $.live('.renderArea .staticLabel', 'dblclick', function(e)
    {
        var $t = $(this);
        if ($t.hasClass('inEdit')) { return; }

        var t = '';
        if (!$t.hasClass('defaultData')) { t = $t.text(); }
        $t.data('origText', t);
        $t.draggable('disable');
        $t.addClass('inEdit');

        $t.empty().append($.tag({tagName: 'input', type: 'text',
            'class': 'staticEditor'}));
        var $i = $t.find('input');
        $i.value(t);
        $i.focus().select();

        editRRNS.$staticEditor = $i;
    });
    $.live('.renderArea .staticLabel input', 'keypress', function(e)
    {
        if (e.keyCode == 27) { finishEdit($(this)); }
        else if (e.keyCode == 13) { finishEdit($(this), true); }
    });

    $(document).mousedown(function(e)
    {
        if (!$.isBlank(editRRNS.$staticEditor) &&
            editRRNS.$staticEditor.index(e.target) < 0)
        { finishEdit(editRRNS.$staticEditor, true); }
    });

    // Hook up rows & columns
    $.live('.renderArea .addRow', 'click ', function(e)
    {
        e.preventDefault();
        var $newRow = $.tag({tagName: 'div', 'class': 'richLine'});
        $(this).closest('.richColumn').append($newRow);
        editRRNS.setUpRows($newRow);
        editRRNS.updateConfig();
    });

    $('#layoutContainer .addColumn').click(function(e)
    {
        e.preventDefault();
        editRRNS.addTopLevelColumn();
    });
};


// -------------- Unsaved View -----------
editRRNS.initSaving = function()
{
    blist.dataset.bind('set_temporary',
        function() { $('body').addClass('unsavedView'); });
    blist.dataset.bind('clear_temporary',
        function() { $('body').removeClass('unsavedView'); });

    blist.datasetControls.unsavedViewPrompt();

    $('.unsavedLine a.save').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if ($a.is('.disabled')) { return; }

        $a.addClass('disabled');
        $('.unsavedLine .loadingIcon').removeClass('hide');

        blist.dataset.save(function()
        {
            $('.unsavedLine .loadingIcon').addClass('hide');
            $a.removeClass('disabled');
        });
    });

    $('.unsavedLine a.revert').click(function(e)
    {
        e.preventDefault();
        blist.dataset.reload(function()
        {
            editRRNS.resetConfig();
            editRRNS.renderCurrentLayout();
            editRRNS.renderCurrentRow();
        });
    });
};



(function($) {
    editRRNS.$container = $('#layoutContainer');
    editRRNS.$renderArea = editRRNS.$container.find('.renderArea');

    editRRNS.$dropIndicator = $.tag({tagName: 'span', 'class': 'dropIndicator'});
    editRRNS.$dropFinder = $.tag({tagName: 'span', 'class': 'dropFinder',
        contents: '.'});

    editRRNS.initResizing();

    editRRNS.initSidebar();

    editRRNS.initLayout();

    editRRNS.initSaving();
})(jQuery);
