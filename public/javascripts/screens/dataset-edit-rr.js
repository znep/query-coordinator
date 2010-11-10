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
                    $sect.find('.fieldItem').draggable({
                        appendTo: $('.mainContainer'),
                        containment: $('.mainContainer'),
                        helper: 'clone',
                        opacity: 0.8,
                        revert: 'invalid'
                    });
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
        md.richRendererConfigs.fatRow = conf;
        blist.dataset.update({metadata: md});
    };


    // Hook up drop acceptance
    editRRNS.$renderArea.droppable({accept: '.fieldItem',
        drop: function(event, ui)
        {
            var $cont = $(this);
            var $line = $cont.find('.richColumn .richLine')
                .append(ui.draggable.clone().removeClass('ui-draggable'));
            renderCurrentRow();
            updateConfig();
        }});


    // Hook up rendering
    var config = ((blist.dataset.metadata || {}).richRendererConfigs ||
        {}).fatRow || {columns: [{rows: [{}]}]};
    editRRNS.richRenderer = editRRNS.$renderArea.richRenderer({
        config: config, defaultItem: '(Data for #{column.name})',
        view: blist.dataset });

    var renderCurrentLayout = function()
    {
        editRRNS.richRenderer.renderLayout();
        editRRNS.$renderArea.find('.richItem, .richLabel').addClass('fieldItem');
        editRRNS.$renderArea.find('.staticLabel:empty').addClass('defaultData')
            .text('(Static text)');
    };
    renderCurrentLayout();


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

})(jQuery);
