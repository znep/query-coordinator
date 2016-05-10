var editRRNS = blist.namespace.fetch('blist.editRR');

// ------------ Resizing -------------
editRRNS.adjustSizes = function()
{
    // match page height
    var $content = editRRNS.$container;
    var $contentBox = $('.contentBox');
    var $innerWrapper = $('.siteInnerWrapper');
    $content.height($(window).height() -
        $('#siteHeader').outerHeight(false) -
        ($innerWrapper.outerHeight(true) - $innerWrapper.height()) -
        $('.contentBox .header').outerHeight(true) -
        ($contentBox.outerHeight(true) - $contentBox.height()) -
        ($content.outerHeight(true) - $content.height()));

    editRRNS.$renderArea.height($content.height() -
            editRRNS.$previewContainer.outerHeight(true) - (editRRNS.$renderArea.outerHeight(true) -
                editRRNS.$renderArea.height()));
    editRRNS.$previewContainer.find('.previewArea').height(Math.max(0,
                editRRNS.$previewContainer.height() -
                editRRNS.$previewContainer
                    .children('h2').outerHeight(true)));

    _.defer(function() { editRRNS.adjustColDisplay(editRRNS.$renderArea); });
};

editRRNS.initResizing = function()
{
    editRRNS.adjustSizes();
    // Need defer here and above for adjustColDisplay because sidebar defers
    // adjusting the width of the main area; so we need to defer beyond that
    $(window).resize(function()
            { _.defer(function() { editRRNS.adjustSizes(); }); });
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

    $.Control.extend('pane_layoutPalette', {
        getTitle: function()
        { return 'Add Fields'; },

        getSubtitle: function()
        {
            return 'Choose fields to add to your layout and then drag and drop ' +
                'them to the canvas where you would like them';
        },

        _getSections: function()
        {
            var cols = _.sortBy(this.settings.view.realColumns, sortFunc);
            return [
            {
                title: 'Static',
                customContent: {
                    template: 'staticPalette',
                    callback: function($sect)
                    {
                        $sect.find('.fieldItem').each(function()
                            { editRRNS.enableFieldItem($(this), true); });
                    }
                }
            },
            {
                title: 'Labels',
                customContent: {
                    template: 'labelPalette',
                    directive: {
                        'li.columnItem': {
                            'column<-': {
                                '.columnLabel': 'column.name!',
                                '.columnLabel@data-tcid': 'column.tableColumnId'
                            }
                        }
                    },
                    data: cols,
                    callback: function($sect)
                    {
                        $sect.find('.fieldItem').each(function()
                            { editRRNS.enableFieldItem($(this), true); });
                    }
                }
            },
            {
                title: 'Fields',
                customContent: {
                    template: 'fieldPalette',
                    directive: {
                        'li.columnItem': {
                            'column<-': {
                                '.columnData': '(#{column.name!})',
                                '.columnData@data-tcid': 'column.tableColumnId',
                                '.columnData@class+':
                                    'columnId#{column.id} #{column.renderTypeName}'
                            }
                        }
                    },
                    data: cols,
                    callback: function($sect)
                    {
                        $sect.find('.fieldItem').each(function()
                            { editRRNS.enableFieldItem($(this), true); });
                    }
                }
            }];
        }
    }, {name: 'palette'}, 'controlPane');
    $.gridSidebar.registerConfig('palette', 'pane_layoutPalette');

    // Init and wire sidebar
    editRRNS.sidebar = $('#gridSidebar').gridSidebar({
        resizeNeighbor: editRRNS.$container,
        setSidebarTop: false,
        view: blist.dataset
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
    editRRNS.$dropIndicator.css(linePos, foundLine.pos - contOffset[linePos])
        .css(primaryPos, foundPos - contOffset[primaryPos]);

    // Size the drop indicator to fit the most appropriate item
    var $refItem = editRRNS.$dropBefore ||
        editRRNS.$dropCont.children('.ui-droppable:last');
    var dim = primaryPos == 'left' ? 'height' : 'width';
    var refSize = $refItem.length > 0 ?
        $refItem['outer' + dim.capitalize()](true) : editRRNS.$dropCont[dim]();
    editRRNS.$dropIndicator[dim](refSize)
        .css(primaryPos == 'left' ? 'width' : 'height', '');
};


// Hook up actions for an item in the layout area
editRRNS.enableFieldItem = function($item, dragOnly)
{
    if ($item.hasClass('ui-draggable')) { return; }

    if (!dragOnly)
    {
        $item.removeClass('fieldItem')
            .wrap($.tag({tagName: 'div', 'class': ['fieldItem', 'clearfix']}));
    }

    var $fieldItem = $item.closest('.fieldItem');
    _.each(['width', 'height'], function(p)
    {
        if (($item.data('rr-' + p) || '').endsWith('%'))
        {
            $fieldItem.css(p, $item.data('rr-' + p));
            $item.css(p, '100%');
        }
    });

    if ($item.hasClass('staticLabel'))
    { $item.attr('title', 'Label with fixed text (double-click to edit)'); }
    else
    {
        var col = blist.dataset.columnForTCID($item.data('tcid'));
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

    editRRNS.makeDraggable($fieldItem, false, null, null, function(e, ui)
    {
        editRRNS.itemDragging(ui, 'left', 'top');
    });

    if (!dragOnly)
    {
        // http://bugs.jqueryui.com/ticket/5025  We can't hook up resizable
        // on children before parents, so defer this until the column
        // has finished hooking up the same thing
        editRRNS.addControls($fieldItem, true);
        _.defer(function() { editRRNS.makeResizable($fieldItem); });
    }

    editRRNS.addHoverStates($fieldItem, 'fieldItem');
};


editRRNS.makeDraggable = function($item, handle,
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
            editRRNS.inDrag = true;
            var $t = $(this);
            if (setWidth) { ui.helper.width($t.width()); }
            $t.addClass('itemDragging');
            if (_.isFunction(startHandler)) { startHandler(e, ui); }
        },
        stop: function(e, ui)
        {
            editRRNS.inDrag = false;
            $(this).removeClass('itemDragging');
            editRRNS.$dropCont = null;
            editRRNS.$dropIndicator.remove();
            if (_.isFunction(stopHandler)) { stopHandler(e, ui); }
        },
        drag: dragHandler
    });
};

// Hook up drop acceptance
editRRNS.makeDroppable = function($item, selector, restrictToChildren, dropped, preDrop)
{
    $item.droppable({accept: restrictToChildren ? function($draggable)
        {
            // Only accept items that are at the same level as the item
            // being dragged
            return $draggable.is(selector) &&
                $item.siblings().andSelf().children().index($draggable) >= 0;
        } : selector,
        activeClass: 'inDrag',
        hoverClass: 'dragOver',
        tolerance: 'pointer',
        over: function()
        {
            var $t = $(this);
            // Defer this, since when dragging from one item to another, this
            // over may fire just before the out of the previous, in which
            // case the dropCont is cleared
            _.defer(function() { editRRNS.$dropCont = $t; });
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

            if ($item.closest('.renderArea').length < 1)
            {
                $item = $item.clone().removeClass('ui-draggable itemDragging');
            }

            if (_.isFunction(preDrop)) { preDrop($item); }

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
            editRRNS.$dropBefore = null;
        }});
};

editRRNS.setAbsoluteSize = function($item, prop, value)
{
    $item.data('rr-' + prop, parseFloat((value /
        parseInt($item.css('font-size'))).toFixed(3)) + 'em');
    if ($item.hasClass('richColumn') && prop == 'width')
    {
        $item.data('rr-width-locked', true);
        editRRNS.setColSizes($item.parent());
    }
};

editRRNS.getRelativeSize = function($item, prop)
{
    var $par = $item.parent().closest('.richColumn, .richLine, .richRendererContainer');
    var parS = $par['render' + prop.capitalize()]() - 3;
    return Math.floor(100 * $item['outer' + prop.capitalize()](true) / parS);
};

editRRNS.setRelativeSize = function($item, prop)
{
    $item.data('rr-' + prop, editRRNS.getRelativeSize($item, prop) + '%');
    if ($item.hasClass('richColumn') && prop == 'width')
    {
        $item.data('rr-width-locked', true);
        editRRNS.setColSizes($item.parent());
    }
};

editRRNS.addControls = function($item, hasResize)
{
    if ($item.children('.controlIndicators').length > 0) { return; }

    $item.prepend($.tag({tagName: 'div', 'class': 'controlIndicators',
        contents: {tagName: 'div', 'class': ['settings', 'menu'], href: '#Settings',
            title: 'Settings'}}));

    var $richItem = $item;
    if ($richItem.hasClass('fieldItem')) { $richItem = $item.find('.richItem, .richLabel'); }

    $item.children('.controlIndicators').find('.settings').menu({
            contents: [
                { text: 'Remove', className: 'remove', href: '#Remove',
                    onlyIf: !$item.hasClass('renderArea') },
                { divider: true},
                { text: 'Reset Width', className: 'widthClear', href: '#Clear_Width',
                    onlyIf: hasResize === true },
                { text: 'Use Absolute Width', className: 'widthAbsolute', href: '#Absolute_Width',
                    onlyIf: hasResize === true },
                { text: 'Use Relative Width', className: 'widthRelative', href: '#Relative_Width',
                    onlyIf: hasResize === true },
                { divider: true},
                { text: 'Reset Height', className: 'heightClear', href: '#Clear_Height',
                    onlyIf: hasResize === true },
                { divider: true },
                { text: 'Add Column', className: 'addColumn add', href: '#AddColumn',
                    onlyIf: $item.hasClass('richLine') || $item.hasClass('renderArea') },
                { text: 'Add Row', href: '#AddRow', className: 'add addRow',
                    onlyIf: $item.hasClass('richColumn') }
            ],
            menuButtonClass: 'settingsMenuButton options',
            menuButtonContents: '',
            parentContainer: editRRNS.$renderArea,
            onOpen: function($menuC)
            {
                // Double defer because we need to happen after any other onClose (below)
                _.defer(function() { _.defer(function()
                {
                    $menuC.closest('.hover').addClass('directMenuOpen');
                    $menuC.parents('.hover, .richLine, .richColumn, .renderArea, #layoutContainer')
                        .addClass('menuOpen');
                }); });

                $menuC.find('.menuEntry').filter('.widthClear, .widthAbsolute, .widthRelative')
                    .toggleClass('hide', $.isBlank($richItem.data('rr-width')));
                $menuC.find('.menuEntry.heightClear').toggleClass('hide',
                    $.isBlank($richItem.data('rr-height')));

                var widthRelative = ($richItem.data('rr-width') || '').endsWith('%');
                $menuC.find('.menuEntry.widthRelative').toggleClass('checked', widthRelative);
                $menuC.find('.menuEntry.widthAbsolute').toggleClass('checked', !widthRelative);

                $menuC.find('.menuEntry.addColumn').toggleClass('hide',
                    !($item.hasClass('acceptsColumns') || $item.hasClass('renderArea')));
            },
            onClose: function($menuC)
            {
                // Need to defer this so that menu doesn't get confused about
                // closing itself, at least on Chrome
                _.defer(function()
                {
                    $menuC.parents('.menuOpen').removeClass('menuOpen');
                    $menuC.closest('.directMenuOpen').removeClass('directMenuOpen');
                });
            }
        })
    .find('.menuDropdown a').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if ($a.parent().hasClass('checked')) { return; }

        var action = $.hashHref($a.attr('href')).split('_');
        var prop = (action[1] || '').toLowerCase();
        var madeChange = false;
        switch (action[0])
        {
            case 'Remove':
                var $par = $item.parent();
                $item.remove();
                editRRNS.setColSizes($par);
                if ($par.hasClass('richLine'))
                {
                    $par.toggleClass('acceptsColumns',
                        $par.children('.fieldItem').length < 1);
                }
                madeChange = true;
                break;
            case 'Clear':
                if (prop == 'width' && $richItem.hasClass('richColumn'))
                {
                    var $sibs = $richItem.siblings('.richColumn');
                    var newS = Math.floor(100 / ($sibs.length + 1));

                    var sizeDiff = editRRNS.getRelativeSize($richItem, prop) - newS;
                    var relSibs = [];
                    $sibs.each(function()
                    {
                        var $s = $(this);
                        if (($s.data('rr-' + prop) || '').endsWith('%'))
                        { relSibs.push($s); }
                    });
                    var distAmt = Math.floor(sizeDiff / (relSibs.length || 1));
                    _.each(relSibs, function($s)
                    {
                        $s.data('rr-' + prop, (parseInt($s.data('rr-' + prop)) + distAmt) + '%');
                    });

                    $richItem.data('rr-' + prop, newS + '%');
                    editRRNS.setColSizes($richItem.parent());
                }
                else
                {
                    $richItem.data('rr-' + prop, '').css(prop, 'auto');
                }
                madeChange = true;
                break;
            case 'Absolute':
                editRRNS.setAbsoluteSize($richItem, prop, $richItem[prop]());
                madeChange = true;
                break;
            case 'Relative':
                editRRNS.setRelativeSize($richItem, prop);
                if ($item.hasClass('fieldItem'))
                {
                    $item.css(prop, $richItem.data('rr-' + prop));
                    $richItem.css(prop, '100%');
                }
                madeChange = true;
                break;
            case 'AddColumn':
                editRRNS.addColumn($item);
                break;
            case 'AddRow':
                editRRNS.addRow($item);
                break;
            default:
                $.debug('Missing handler for menu action ' + action.join('_'));
                break;
        }
        if (madeChange) { editRRNS.updateConfig(); }
    });
};

editRRNS.makeResizable = function($item, handles)
{
    handles = handles || 'e, s, se';
    var handlesArr = handles.split(', ');
    // Put indicators at the front so that all child content is underneath
    // so that hovering over children works properly
    $item.children('.controlIndicators').prepend($.tag(
        _.map(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'], function(dir)
        {
            return {tagName: 'span', 'class': ['resizeIndicator', 'resize' + dir.toUpperCase(),
                {value: 'enabled', onlyIf: _.include(handlesArr, dir)}]};
        }).concat([{tagName: 'span', 'class': ['resizeSize', 'hide']}])
        ));
    $item.resizable({
        handles: handles,
        minHeight: 15, minWidth: 15,
        helper: 'richResizable ' + ($item.hasClass('richColumn') ?
            'richColumn' : 'fieldItem'),
        alsoResize: $item.children('.controlIndicators'),
        start: function(event, ui)
        {
            // Force all menus to close
            $(document).trigger('click.menu');
            var $t = $(this).css('position', '').css('top', '').css('left', '');
            var $cont = $t.parent().closest('.richColumn, .renderArea');
            var offT = $t.offset();
            var offCont = $cont.offset();
            $t.resizable('option', 'maxWidth', $cont.renderWidth() -
                (offT.left - offCont.left) - ($t.outerWidth(true) - $t.width()));
            $t.find('.controlIndicators .resizeSize').removeClass('hide');
            editRRNS.inResize = true;
        },
        stop: function(event, ui)
        {
            editRRNS.inResize = false;
            var $t = $(this).css('position', '').css('top', '').css('left', '');
            $t.children('.controlIndicators').css('height', '').css('width', '');
            $t.find('.controlIndicators .resizeSize').addClass('hide');
            if ($t.hasClass('fieldItem'))
            {
                var $par = $t;
                $t = $t.children('.richItem, .richLabel');
                $t.height($par.height()).width($par.width());
                $par.css('height', '').css('width', '');
            }

            if ((ui.size.height - ui.originalSize.height) != 0)
            {
                editRRNS.setAbsoluteSize($t, 'height', ui.size.height);
            }
            if ((ui.size.width - ui.originalSize.width) != 0)
            {
                var curW = $t.data('rr-width');
                if (!$.isBlank(curW) && curW.endsWith('%') ||
                    $.isBlank(curW) && $t.hasClass('richColumn'))
                {
                    editRRNS.setRelativeSize($t, 'width');
                }
                else
                {
                    editRRNS.setAbsoluteSize($t, 'width', (ui.size.width -
                                ($t.outerWidth(true) - $t.width())));
                }
            }
            editRRNS.updateConfig();
        },
        resize: function(event, ui)
        {
            var sizes = $.extend(true, {}, ui.size);
            var $t = $(this);

            var $ri = $t;
            if ($ri.hasClass('fieldItem')) { $ri = $t.find('.richItem, .richLabel'); }
            _.each(['width', 'height'], function(prop)
            {
                if (($ri.data('rr-' + prop) || '').endsWith('%'))
                {
                    var $par = $ri.parent().closest('.richColumn, .richLine, .richRendererContainer');
                    var parS = $par['render' + prop.capitalize()]() - 3;
                    sizes[prop] = Math.floor(100 * sizes[prop] / parS) + '%';
                }
                else
                { sizes[prop] += 'px'; }
            });

            $t.find('.controlIndicators .resizeSize').text(sizes.width + ' x ' + sizes.height);
        }
    });
};


// ------------- Layout -----------------

// Do row load and render
editRRNS.renderCurrentRow = function()
{
    editRRNS.$secondPreview.hide();
    var isPage = editRRNS.renderType == 'page';
    var pageSize = isPage ? 1 : 2;
    blist.dataset.getRows(editRRNS.navigation.currentPage(), pageSize,
        function(rows)
        {
            _.each(rows, function(r)
            {
                if (r.index == editRRNS.navigation.currentPage())
                {
                    editRRNS.richRenderer.renderRow(editRRNS.$renderArea, r, true);
                    editRRNS.previewRenderer.renderRow(editRRNS.$previewArea, r, isPage);
                }
                else
                {
                    editRRNS.$secondPreview.empty().append(
                        editRRNS.$previewArea.children().clone());
                    editRRNS.previewRenderer.renderRow(editRRNS.$secondPreview, r, isPage);
                    editRRNS.$secondPreview.show();
                }
            });
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
            if (!_.isUndefined($item.data('rr-' + p)))
            { s[p] = $item.data('rr-' + p); }
        });

        return _.isEmpty(s) ? null : s;
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
                var fields = [];
                $r.children('.fieldItem').each(function()
                {
                    var $f = $(this).children('.richItem, .richLabel');
                    var f = {};
                    s = getStyles($f);
                    if (!$.isBlank(s)) { f.styles = s; }
                    if ($f.hasClass('columnData'))
                    {
                        f.type = 'columnData';
                        f.tableColumnId = $f.data('tcid');
                    }
                    else if ($f.hasClass('columnLabel'))
                    {
                        f.type = 'columnLabel';
                        f.tableColumnId = $f.data('tcid');
                    }
                    else if ($f.hasClass('staticLabel'))
                    {
                        f.type = 'label';
                        if (!$f.hasClass('defaultData'))
                        { f.text = $f.text(); }
                    }
                    fields.push(f);
                });
                if (fields.length > 0) { r.fields = fields; }
            }
            c.rows.push(r);
        });

        // Trim empty last row
        if (_.isEmpty(_.last(c.rows))) { c.rows = c.rows.slice(0, -1); }

        parConf.columns.push(c);
    };

    var $topCols = editRRNS.$renderArea.children('.richColumn');
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

    editRRNS.resetConfig(true);
    editRRNS.renderCurrentRow();
};

editRRNS.renderCurrentLayout = function(previewOnly)
{
    if (!previewOnly) { editRRNS.richRenderer.renderLayout(); }
    editRRNS.previewRenderer.renderLayout();

    if (editRRNS.$renderArea.children('.controlIndicators').length < 1)
    {
        editRRNS.addControls(editRRNS.$renderArea);
    }

    editRRNS.setUpColumns(editRRNS.$renderArea.children('.richColumn'));

    editRRNS.adjustColDisplay(editRRNS.$renderArea);
};

editRRNS.isDirectTarget = function(par, target, childContClass)
{
    // Figure out if something is considered a direct hover -- basically,
    // when you are in a row in a column or column in a row, then it is no longer
    // directly hovering in the item
    var $closest = $(target).closest('.' + childContClass);
    return !$.isBlank(target) && (target == par ||
        ($.contains(par, target) &&
            ($closest.length < 1 || !$.contains(par, $closest[0]) ||
             $(par).hasClass('ui-resizable-resizing'))));
};

editRRNS.addHoverStates = function($item, selfClass, childContClass)
{
    var hoverHandle = function(item, target)
    {
        var $item = $(item);
        if (editRRNS.inDrag || $.isBlank(target))
        {
            $item.removeClass('directHover hover');
            return;
        }

        // hovering is controlled by whether or not you have moused into
        // a sub-item of the same type you are in (column inside a column,
        // row in a row)
        var $closestSelf = $(target).closest('.' + selfClass);
        var isSelfResizing = $item.hasClass('ui-resizable-resizing');
        var isOtherResizing = editRRNS.inResize && !isSelfResizing;
        $item
            .toggleClass('hover', (item == target || ($.contains(item, target) &&
                ($closestSelf.length < 1 || $closestSelf[0] == item ||
                    isSelfResizing))) && !isOtherResizing)
            .toggleClass('directHover',
                editRRNS.isDirectTarget(item, target, childContClass) &&
                !isOtherResizing);
    };

    $item.mouseover(function(e) { hoverHandle(this, e.target); })
        .mouseout(function(e) { hoverHandle(this, e.relatedTarget); });
};

editRRNS.setUpRows = function($rows)
{
    $rows.each(function()
        {
            var $row = $(this);
            if ($row.hasClass('ui-draggable')) { return; }

            editRRNS.addControls($row);

            $row.addClass('clearfix')
                .children('.controlIndicators').append($.tag(
                {tagName: 'a', href: '#Drag', title: 'Move row',
                    'class': ['dragHandle', 'rowDrag']}));

            // We only accept columns in a row if there are no field items,
            // and we are less than four columns deep -- more than that,
            // and Rails has problems with the nesting level
            $row.toggleClass('acceptsColumns',
                $row.children('.fieldItem').length < 1 &&
                $row.parents('.richColumn').length < 4);

            editRRNS.addHoverStates($row, 'richLine', 'richColumn');

            editRRNS.makeDroppable($row, function($draggable)
                {
                    // Rows are special: they accept fields if there are
                    // already fields; and columns if there are columns;
                    // or both if the row is empty.  But rows only accept
                    // columns from the same level
                    return ($draggable.hasClass('fieldItem') &&
                            $row.children('.richColumn').length < 1) ||
                        ($draggable.hasClass('richColumn') &&
                            $row.children('.fieldItem').length < 1 &&
                            $row.siblings().andSelf().children()
                                .index($draggable) >= 0);
                }, false, // Pass false so it uses our custom function
                function($item)
                {
                    if ($item.hasClass('fieldItem'))
                    {
                        $row.removeClass('acceptsColumns');
                        editRRNS.enableFieldItem($item);
                    }
                    if ($row.data('preDropChildCount') < 1 && $row.nextAll('.richLine').length < 1)
                    { editRRNS.addRow($row.closest('.richColumn')); }
                },
                function($item)
                {
                    // Right before drop, see how many items we have
                    $row.data('preDropChildCount', $row.children('.fieldItem, .richColumn').length);
                });
            editRRNS.makeDraggable($row, '> .controlIndicators .rowDrag', null, null,
                function(e, ui)
                {
                    editRRNS.itemDragging(ui, 'top', 'left');
                }, true);
        });
};

editRRNS.setUpColumns = function($col)
{
    // Set up fields
    $col.find('.richLine > .richItem, .richLine > .richLabel')
        .addClass('fieldItem');
    $col.find('.staticLabel:empty').addClass('defaultData')
        .text('(Static text)');
    $col.find('.fieldItem').each(function()
        { editRRNS.enableFieldItem($(this)); });

    // Set up rows
    editRRNS.setUpRows($col.find('.richLine'));

    // Set up columns
    $col.find('.richColumn').andSelf().each(function()
    {
        var $c = $(this);
        if ($c.hasClass('ui-draggable')) { return; }

        editRRNS.addControls($c, true);

        $c.children('.controlIndicators').prepend($.tag(
            {tagName: 'a', href: '#Drag', title: 'Move column',
                'class': ['dragHandle', 'columnDrag']}));

        editRRNS.addHoverStates($c, 'richColumn', 'richLine');

        editRRNS.makeDroppable($c, '.richLine', true);
        // When dragging a column, enlarge the main area just a bit, since
        // columns are forced-width, and might not allow room for the dropfinder
        // at the right edge
        editRRNS.makeDraggable($c, '> .controlIndicators .columnDrag',
            function()
            { editRRNS.$renderArea.width(editRRNS.$renderArea.width() + 5); },
            function() { editRRNS.$renderArea.css('width', 'auto'); },
            function(e, ui) { editRRNS.itemDragging(ui, 'left', 'top'); });

        editRRNS.makeResizable($c, 'e');
    });
};

editRRNS.adjustColDisplay = function($parent)
{
    var totalW = $parent.renderWidth() - 3;
    $parent.children('.richColumn').each(function()
    {
        var $c = $(this);
        if ($.isBlank($c.data('rr-width')) || $c.data('rr-width').endsWith('%'))
        {
            $c.width(parseInt($c.data('rr-width') || 100) / 100 * totalW -
                ($c.outerWidth(true) - $c.width()));
        }
    })
    // Now recurse on all the lines to find ones that have columns
    .children('.richLine').each(function()
    {
        var $l = $(this);
        if ($l.children('.richColumn').length > 0)
        { editRRNS.adjustColDisplay($l); }
    });
};

editRRNS.setColSizes = function($parent)
{
    // Need to adjust sizes for all columns to make them fit
    var $fixedCols = $();
    var $freeCols = $();
    $parent.children('.richColumn').each(function()
    {
        var $c = $(this);
        if ($.isBlank($c.data('rr-width')) ||
            ($c.data('rr-width').endsWith('%') && !$c.data('rr-width-locked')))
        { $freeCols = $freeCols.add($c); }
        else
        {
            $fixedCols = $fixedCols.add($c);
            $c.removeData('rr-width-locked');
        }
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

    // -3 to account for drop shadow on hover
    var totalW = $parent.renderWidth() - 3;
    var availW = totalW;
    // Need to tweak columns with specified widths for borders & padding
    $fixedCols.each(function() { availW -= $(this).outerWidth(true); });

    // Now that we know how much remaining space we have, set each of the
    // variable columns; and then set their width to the real portion of
    // the div
    $freeCols.each(function()
    {
        var $c = $(this);
        var np = Math.floor(parseInt($c.data('rr-width')) / totalPercent * 100);
        $c.width(np / 100 * availW - ($c.outerWidth(true) - $c.width()));
        $c.data('rr-width', Math.floor(np * availW / totalW) + '%');
    });

    // Now recurse on all the lines to find ones that have columns
    $fixedCols.add($freeCols).children('.richLine').each(function()
    {
        var $l = $(this);
        if ($l.children('.richColumn').length > 0) { editRRNS.setColSizes($l); }
    });
};

editRRNS.addColumn = function($parent)
{
    var $newCol = $.tag({tagName: 'div', 'class': 'richColumn',
            contents: {tagName: 'div', 'class': 'richLine'}});
    $parent.append($newCol);

    editRRNS.setColSizes($parent);

    editRRNS.updateConfig();
    editRRNS.setUpColumns($newCol);
};

editRRNS.addRow = function($parent)
{
    var $newRow = $.tag({tagName: 'div', 'class': 'richLine'});
    $parent.append($newRow);
    editRRNS.setUpRows($newRow);
    editRRNS.updateConfig();
};

editRRNS.resetConfig = function(previewOnly)
{
    var config = ((blist.dataset.metadata || {}).richRendererConfigs ||
        {})[editRRNS.renderType];
    var hasConfig = !$.isBlank(config);
    config = config || {columns: [{rows: [{}]}]};
    if (!previewOnly)
    {
        var rrConfig = $.extend(true, {}, config);
        // Add in blank row at the end of each column
        var processCol = function(c)
        {
            _.each(c.rows || [], function(r) { _.each(r.columns || [], processCol); });
            if (!_.isEmpty(_.last(c.rows || []))) { c.rows.push({}); }
        };
        _.each(rrConfig.columns, processCol);
        editRRNS.richRenderer.setConfig(rrConfig);
        editRRNS.$clearLayout.toggleClass('hide', !hasConfig);
    }
    editRRNS.previewRenderer.setConfig(config);
    editRRNS.renderCurrentLayout(previewOnly);
};

editRRNS.initLayout = function()
{
    // Hook up rendering
    editRRNS.renderType = $.urlParam(window.location.href,
            'defaultRender') || 'fatRow';
    if (editRRNS.renderType == 'richList') { editRRNS.renderType = 'fatRow'; }

    editRRNS.richRenderer = editRRNS.$renderArea.richRenderer({
        defaultItem: '(#{column.name})',
        view: blist.dataset });
    editRRNS.$previewContainer.resizable({handles: 'n',
            maxHeight: editRRNS.$container.height() * 0.8, minHeight: 30,
            stop: function()
            {
                editRRNS.$previewContainer.css('top', '').css('left', '').css('width', '');
                editRRNS.adjustSizes();
            }});
    editRRNS.previewRenderer = editRRNS.$previewArea
        .richRenderer({ view: blist.dataset });


    // Hook up navigation
    editRRNS.navigation = editRRNS.$container.find('.navigation')
        .bind('page_changed', editRRNS.renderCurrentRow)
        .navigation({pageSize: 1, view: blist.dataset});

    editRRNS.$clearLayout = $('.header a.clearLayout').click(function(e)
    {
        e.preventDefault();
        editRRNS.$renderArea.empty();
        editRRNS.addColumn(editRRNS.$renderArea);
    });


    editRRNS.resetConfig();

    editRRNS.renderCurrentRow();

    editRRNS.makeDroppable(editRRNS.$renderArea, '.richColumn', true);

    // Handle switching types
    $('#renderTypeOptions').pillButtons();
    $('#renderTypeOptions li a').removeClass('active');
    var $initA = $('#renderTypeOptions li .' + editRRNS.renderType.toLowerCase())
        .addClass('active');
    $('.header h1 .displayName').text($initA.data('displayName'));
    $('#renderTypeOptions a').click(function(e)
    {
        e.preventDefault();
        var rt = $.urlParam($(this).attr('href'), 'defaultRender');
        if (rt == 'richList') { rt = 'fatRow'; }

        $('#renderTypeOptions li a').removeClass('active');
        var $a = $('#renderTypeOptions li .' + rt.toLowerCase()).addClass('active');

        $('.header h1 .displayName').text($a.data('displayName'));

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
        $label.siblings('.controlIndicators').removeClass('hide');

        if (doSave && newText != $label.data('origText'))
        { editRRNS.updateConfig(); }
    };

    $.live('.renderArea .fieldItem', 'dblclick', function(e)
    {
        var $t = $(this).children('.staticLabel');
        if ($t.length < 1 || $t.hasClass('inEdit')) { return; }

        var t = '';
        if (!$t.hasClass('defaultData')) { t = $t.text(); }
        $t.data('origText', t);
        $t.draggable('disable');
        $t.addClass('inEdit');
        $t.siblings('.controlIndicators').addClass('hide');

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

    editRRNS.addHoverStates(editRRNS.$renderArea, 'richLine', 'richColumn');
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
        blist.dataset.reload(false, function()
        {
            editRRNS.resetConfig();
            editRRNS.renderCurrentRow();
        });
    });
};



(function($) {
    editRRNS.$container = $('#layoutContainer');
    editRRNS.$renderArea = editRRNS.$container.find('.renderArea');
    editRRNS.$previewContainer = editRRNS.$container.find('.previewContainer');
    editRRNS.$previewArea = editRRNS.$previewContainer
        .find('.previewArea .row:first');
    editRRNS.$secondPreview = editRRNS.$previewContainer
        .find('.previewArea .row:last');

    editRRNS.$dropIndicator = $.tag({tagName: 'span', 'class': 'dropIndicator'});
    editRRNS.$dropFinder = $.tag({tagName: 'span', 'class': 'dropFinder',
        contents: '.'});

    editRRNS.initResizing();

    editRRNS.initSidebar();

    editRRNS.initLayout();

    editRRNS.initSaving();
})(jQuery);
