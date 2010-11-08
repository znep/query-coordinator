var editRRNS = blist.namespace.fetch('blist.editRR');

(function($) {
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
                            '.columnName': 'column.name!',
                            '.columnName@title':
                                'Title for the #{column.name!} column',
                            '.columnData': '(Data for #{column.name!})',
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

    editRRNS.$container = $('#layoutContainer');

    // Init and wire sidebar
    editRRNS.sidebar = $('#gridSidebar').gridSidebar({
        dataGrid: editRRNS.$container,
        setSidebarTop: false
    });

    editRRNS.sidebar.show('palette');

    var renderCurrentRow = function()
    {
        blist.dataset.getRows(editRRNS.navigation.currentPage(), 1, function(rows)
        {
            if (rows.length == 1)
            { editRRNS.richRenderer.renderRow(
                editRRNS.$container.find('.richColumn'), rows[0]); }
        });
    };

    editRRNS.$container.droppable({accept: '.fieldItem',
        drop: function(event, ui)
        {
            var $cont = $(this);
            var $line = $cont.find('.richColumn .richLine')
                .append(ui.draggable.clone().removeClass('ui-draggable'));
            renderCurrentRow();
        }});

    editRRNS.richRenderer = editRRNS.$container.richRenderer({
        defaultItem: '(Data for #{column.name})',
        view: blist.dataset });

    editRRNS.navigation = editRRNS.$container.find('.navigation')
        .bind('page_changed', renderCurrentRow)
        .navigation({pageSize: 1, view: blist.dataset});
    renderCurrentRow();

})(jQuery);
