var editRRNS = blist.namespace.fetch('blist.editRR');

(function($) {
    // Resizing
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

    editRRNS.$container = $('#layoutContainer');
    editRRNS.$renderArea = editRRNS.$container.find('.renderArea');


    editRRNS.$dropIndicator = $.tag({tagName: 'span', 'class': 'dropIndicator'});

    // Handle placing an item during dragging
    var itemDragging = function(event, ui)
    {
        if ($.isBlank(editRRNS.$dropItem)) { return; }

        var contOffset = editRRNS.$dropItem.offset();
        var curX = ui.offset.left;
        var curY = ui.offset.top;

        editRRNS.$dropBeforeItem = null;
        var $fields = editRRNS.$dropItem.children('.fieldItem').each(function()
        {
            var $t = $(this);
            if (curX < $t.offset().left + $t.width() / 2)
            {
                editRRNS.$dropBeforeItem = $t;
                return false;
            }
        });

        editRRNS.$dropItem.append(editRRNS.$dropIndicator);

        if (!$.isBlank(editRRNS.$dropBeforeItem))
        {
            editRRNS.$dropIndicator.css('left',
                editRRNS.$dropBeforeItem.offset().left - contOffset.left - 1);
        }
        else
        {
            if ($fields.length < 1) { editRRNS.$dropIndicator.css('left', 0); }
            else
            {
                var $lastField = $fields.eq($fields.length - 1);
                editRRNS.$dropIndicator.css('left',
                    $lastField.offset().left - contOffset.left +
                        $lastField.outerWidth(true) - 1);
            }
        }
    };


    // Hook up actions for an item in the layout area
    var enableFieldItem = function($item)
    {
        $item.draggable({
            appendTo: $('.mainContainer'),
            containment: $('.mainContainer'),
            helper: 'clone',
            opacity: 0.8,
            revert: 'invalid',
            start: function() { $(this).addClass('itemDragging'); },
            stop: function() { $(this).removeClass('itemDragging'); },
            drag: itemDragging
        });
    };


    // Hook up drop acceptance
    var makeDroppable = function($row)
    {
        $row.droppable({accept: '.fieldItem',
            activeClass: 'inDrag',
            hoverClass: 'dragOver',
            over: function() { editRRNS.$dropItem = $(this); },
            out: function()
            {
                editRRNS.$dropItem = null;
                editRRNS.$dropIndicator.remove();
            },
            drop: function(event, ui)
            {
                editRRNS.$dropItem = null;
                editRRNS.$dropIndicator.remove();

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

                enableFieldItem($item);
                renderCurrentRow();
                updateConfig();
            }});
    };


    // Sidebar
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
                            '.columnLabel@title':
                                'Title for the #{column.name!} column',
                            '.columnData': '(Data for #{column.name!})',
                            '.columnData@data-tcId': 'column.tableColumnId',
                            '.columnData@title':
                                'Data for the #{column.name!} column',
                            '.columnData@class+': 'columnId#{column.id}'
                        }
                    }
                },
                data: cols,
                callback: function($sect)
                {
                    $sect.find('.fieldItem').each(function()
                        { enableFieldItem($(this)); });
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


    // Do row load and render
    var renderCurrentRow = function()
    {
        blist.dataset.getRows(editRRNS.navigation.currentPage(), 1, function(rows)
        {
            if (rows.length == 1)
            { editRRNS.richRenderer.renderRow(editRRNS.$renderArea, rows[0]); }
        });
    };


    // Pull and update the new config
    var updateConfig = function()
    {
        var conf = {columns: []};
        var processColumn = function($col, parConf)
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


    // Hook up rendering
    editRRNS.renderType = 'fatRow';

    var renderCurrentLayout = function()
    {
        editRRNS.richRenderer.renderLayout();
        editRRNS.$renderArea.find('.richItem, .richLabel').addClass('fieldItem');
        editRRNS.$renderArea.find('.staticLabel:empty').addClass('defaultData')
            .text('(Static text)');
        editRRNS.$renderArea.find('.fieldItem').each(function()
            { enableFieldItem($(this)); });
        editRRNS.$renderArea.find('.richLine').each(function()
            { makeDroppable($(this)); });
    };

    editRRNS.richRenderer = editRRNS.$renderArea.richRenderer({
        defaultItem: '(Data for #{column.name})',
        view: blist.dataset });

    var resetConfig = function()
    {
        var config = ((blist.dataset.metadata || {}).richRendererConfigs ||
            {})[editRRNS.renderType] || {columns: [{rows: [{}]}]};
        editRRNS.richRenderer.setConfig(config);
        renderCurrentLayout();
    };
    resetConfig();


    // Hook up navigation
    editRRNS.navigation = editRRNS.$container.find('.navigation')
        .bind('page_changed', renderCurrentRow)
        .navigation({pageSize: 1, view: blist.dataset});
    renderCurrentRow();


    // Unsaved view stuff
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
            renderCurrentLayout();
            renderCurrentRow();
        });
    });


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
        resetConfig();
        renderCurrentRow();
    });

})(jQuery);
