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
            ($contentBox.outerHeight(true) - $contentBox.height()));
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
                            '.columnData': '(Data for #{column.name!})'
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
        dataGrid: $('#layoutContainer'),
        setSidebarTop: false
    });

    editRRNS.sidebar.show('palette');

    $('#layoutContainer').droppable({accept: '.fieldItem',
        drop: function(event, ui)
        {
            var $cont = $(this);
            $cont.find('.richColumn .richLine')
                .append(ui.draggable.clone().removeClass('ui-draggable'));
        }});

})(jQuery);
