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
                            '.columnData@class+': 'columnId#{column.id}'
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

// Handle placing an item during dragging
editRRNS.itemDragging = function(event, ui)
{
    if ($.isBlank(editRRNS.$dropItem)) { return; }

    var contOffset = editRRNS.$dropItem.offset();
    var curX = ui.offset.left;
    var curY = ui.offset.top;

    // We need to find the best drop position across multiple lines, so use a
    // DOM node between each item to figure out possible positions, and group
    // them into lines based on the top position.
    var lines = [];
    var addDropSpot = function($item)
    {
        var dropOff = editRRNS.$dropFinder.offset();
        if (lines.length < 1 || lines[lines.length - 1].top < dropOff.top)
        { lines.push({top: dropOff.top, items: []}); }
        lines[lines.length - 1].items.push({left: dropOff.left, beforeItem: $item});
    };

    var $fields = editRRNS.$dropItem.children('.fieldItem').each(function()
    {
        var $t = $(this);
        $t.before(editRRNS.$dropFinder);
        addDropSpot($t);
    });

    // Then find the last position
    editRRNS.$dropItem.append(editRRNS.$dropFinder);
    addDropSpot();

    // Now look for the first line from the bottom where the top of the line
    // is above the drop item.  That is the line we are in.
    var foundLine = lines[0];
    for (var i = lines.length - 1; i >= 0; i--)
    {
        if (lines[i].top < curY)
        {
            foundLine = lines[i];
            break;
        }
    }

    // Now that we have the line, check each drop spot in the line, and just
    // find the closest.  That is now our position for the cursor, and the
    // item we want to insert before.
    var minDist = $(window).width();
    var foundLeft;
    editRRNS.$dropBeforeItem = null;
    _.each(foundLine.items, function(o)
    {
        var d = Math.abs(curX - o.left);
        if (d < minDist)
        {
            minDist = d;
            editRRNS.$dropBeforeItem = o.beforeItem;
            foundLeft = o.left;
        }
    });

    editRRNS.$dropItem.append(editRRNS.$dropIndicator);
    var rowOff = editRRNS.$dropItem.offset();
    editRRNS.$dropIndicator.css('top', foundLine.top - rowOff.top);
    editRRNS.$dropIndicator.css('left', foundLeft - rowOff.left - 1);
};


// Hook up actions for an item in the layout area
editRRNS.enableFieldItem = function($item)
{
    if ($item.hasClass('staticLabel'))
    { $item.attr('title', 'Label with fixed text'); }
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

    $item.draggable({
        appendTo: $('.mainContainer'),
        containment: $('.mainContainer'),
        cursorAt: {top: 5, left: 5},
        helper: 'clone',
        opacity: 0.8,
        revert: 'invalid',
        start: function() { $(this).addClass('itemDragging'); },
        stop: function() { $(this).removeClass('itemDragging'); },
        drag: editRRNS.itemDragging
    });
};


// Hook up drop acceptance
editRRNS.makeDroppable = function($row)
{
    $row.droppable({accept: '.fieldItem',
        activeClass: 'inDrag',
        hoverClass: 'dragOver',
        tolerance: 'pointer',
        over: function() { editRRNS.$dropItem = $(this); },
        out: function()
        {
            editRRNS.$dropItem = null;
            editRRNS.$dropIndicator.remove();
            editRRNS.$dropFinder.remove();
        },
        drop: function(event, ui)
        {
            editRRNS.$dropItem = null;
            editRRNS.$dropIndicator.remove();
            editRRNS.$dropFinder.remove();

            var $cont = $(this);
            var $item = ui.draggable;
            if ($item.closest('.renderArea').length < 1)
            { $item = $item.clone().removeClass('ui-draggable itemDragging'); }

            if ($.isBlank(editRRNS.$dropBeforeItem))
            { $cont.append($item); }
            else
            {
                editRRNS.$dropBeforeItem.before($item);
                editRRNS.$dropBeforeItem = null;
            }

            editRRNS.enableFieldItem($item);
            editRRNS.renderCurrentRow();
            editRRNS.updateConfig();
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
    var conf = {columns: []};
    var processColumn;
    processColumn = function($col, parConf)
    {
        var c = {rows: []};
        $col.children('.richLine').each(function()
        {
            var r = {};
            var $r = $(this);
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

    editRRNS.$renderArea.children('.richColumn').each(function()
    { processColumn($(this), conf); });

    var md = $.extend(true, {richRendererConfigs: {}}, blist.dataset.metadata);
    md.richRendererConfigs[editRRNS.renderType] = conf;
    blist.dataset.update({metadata: md});
};

editRRNS.renderCurrentLayout = function()
{
    editRRNS.richRenderer.renderLayout();
    editRRNS.$renderArea.find('.richItem, .richLabel').addClass('fieldItem');
    editRRNS.$renderArea.find('.staticLabel:empty').addClass('defaultData')
        .text('(Static text)');
    editRRNS.$renderArea.find('.fieldItem').each(function()
        { editRRNS.enableFieldItem($(this)); });
    editRRNS.$renderArea.find('.richLine').each(function()
        { editRRNS.makeDroppable($(this)); });
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
    editRRNS.renderType = 'fatRow';

    editRRNS.richRenderer = editRRNS.$renderArea.richRenderer({
        defaultItem: '(Data for #{column.name})',
        view: blist.dataset });

    editRRNS.resetConfig();


    // Hook up navigation
    editRRNS.navigation = editRRNS.$container.find('.navigation')
        .bind('page_changed', editRRNS.renderCurrentRow)
        .navigation({pageSize: 1, view: blist.dataset});
    editRRNS.renderCurrentRow();

    // Handle switching types
    $('#renderTypeOptions').pillButtons();
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
            editRRNS.renderCurrentLayout();
            editRRNS.renderCurrentRow();
        });
    });
};



(function($) {
    editRRNS.$container = $('#layoutContainer');
    editRRNS.$renderArea = editRRNS.$container.find('.renderArea');

    editRRNS.$dropIndicator = $.tag({tagName: 'span', 'class': 'dropIndicator'});
    editRRNS.$dropFinder = $.tag({tagName: 'span', 'class': 'dropFinder'});

    editRRNS.initResizing();

    editRRNS.initSidebar();

    editRRNS.initLayout();

    editRRNS.initSaving();
})(jQuery);
