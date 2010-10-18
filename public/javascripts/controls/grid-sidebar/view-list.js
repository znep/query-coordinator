(function($)
{
    if (blist.sidebarHidden.savedViews) { return; }

    var $section;
    var viewList;

    $.live('#gridSidebar_moreViews .deleteViewLink', 'click', function(e)
    {
        e.preventDefault();

        var $li = $(this).closest('li');
        var v = $li.data('view');
        if (confirm('Are you sure you want to delete ' +
            $.htmlEscape(v.name) + '?'))
        {
            var deletedCallback = function()
            {
                $li.remove();
                viewList.splice(_.indexOf(viewList, v), 1);
                if (blist.dataset.id == v.id)
                {
                    blist.dataset.getParentDataset(function(parDS)
                    {
                        if (!$.isBlank(parDS)) { parDS.redirectTo(); }
                    });
                }
            };

            $.ajax({url: '/views/' + v.id + '.json',
                type: 'DELETE',
                success: deletedCallback});
        }
    });

    var renderViews = function(sort)
    {
        if (viewList.length < 1)
        {
            $section.addClass('noResults');
            return;
        }

        sort = sort || 'dateDescending';
        var sorted = _.sortBy(viewList, function(v)
            {
                if (sort.startsWith('date'))
                {
                    return Math.max(v.viewLastModified, v.createdAt) *
                        (sort == 'dateDescending' ? -1 : 1);
                }
                else if (sort == 'alphaAscending')
                { return v.name.toLowerCase(); }
            });

        var $ul = $section.find('.itemsContent ul.itemsList');
        $ul.empty();
        _.each(sorted, function(v)
        {
            var $li = $.renderTemplate('viewItemContainer', v, {
                '.viewIcon@title': function(a)
                { return a.context.displayName.capitalize(); },
                '.viewIcon@class+': function(a)
                { return 'type' + a.context.styleClass; },
                '.name': 'name',
                '.name@title': 'name',
                '.name@href': 'url',
                '.authorLine .date': function(a)
                {
                    return blist.util.humaneDate.getFromDate(
                        Math.max(a.context.viewLastModified || 0,
                            a.context.createdAt || 0) * 1000,
                        blist.util.humaneDate.DAY).capitalize();
                },
                '.authorLine .author': 'owner.displayName',
                '.description': 'description',
                '.deleteViewLink@class+': function(a)
                {
                    return _.include(a.context.rights, 'delete_view') ? '' : 'hide';
                }
            });

            $li.data('view', v);

            if (v.id == blist.dataset.id)
            { $li.addClass('current'); }
            $li.attr('data-search',
                (v.name + ' ' + v.owner.displayName).toLowerCase());

            $li.expander({ contentSelector: '.description' });

            $ul.append($li);
        });
    };

    var setupSection = function()
    {
        var $menu = $section.find('.sortMenu');
        $menu.menu({
            menuButtonContents: 'Sort by',
            menuButtonTitle: 'Sort by',
            contents: [
                { text: 'Most Recent', className: 'none checked',
                    href: '#dateDescending' },
                { text: 'Oldest to Newest', className: 'none',
                    href: '#dateAscending' },
                { text: 'A-Z', className: 'none', href: '#alphaAscending' }
            ]
        });

        $menu.find('.menuDropdown a').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.closest('li').is('.checked')) { return; }

            $a.closest('.menuDropdown').find('.checked').removeClass('checked');
            $a.closest('li').addClass('checked');

            var href = $a.attr('href');
            renderViews(href.slice(href.indexOf('#') + 1));
        });

        $section.find('.textPrompt')
            .example(function () { return $(this).attr('title'); });

        var $search = $section.find('.viewSearch');
        var $clearSearch = $section.find('.clearViewSearch');

        var doSearch = function()
        {
            var s = $search.val().toLowerCase();
            if ($search.is('.prompt')) { s = ''; }
            $clearSearch.toggle(!$.isBlank(s));

            $section.find('.itemsList li').each(function()
            {
                var $li = $(this);
                $li.toggleClass('hide', $li.attr('data-search').indexOf(s) < 0);
            });

            $section.find('.emptyResult').toggle(
                $section.find('.itemsList li:visible').length < 1);
        };

        $clearSearch.click(function(e)
        {
            e.preventDefault();
            $search.val('');
            $search.focus().blur();
            doSearch();
        });

        $search.blur(function() { _.defer(doSearch); })
            .closest('form').submit(function(e)
            {
                e.preventDefault();
                _.defer(doSearch);
            });

        renderViews();
    };



    var allConfig =
    {
        name: 'moreViews',
        priority: 1,
        title: 'More Views',
        subtitle: 'See existing filters, maps, charts and other views on this dataset',
        sections: [{
            customContent: {
                template: 'itemsListBlock',
                directive: {
                    '.emptyResult .type': '#{resultType}s'
                },
                data: {
                    resultType: 'view'
                },
                callback: function($s, sidebarObj)
                {
                    sidebarObj.startProcessing();
                    $section = $s;

                    blist.dataset.getRelatedViews(
                        function(v)
                        {
                            sidebarObj.finishProcessing();

                            viewList = v;

                            setupSection();
                        });
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(allConfig);

})(jQuery);
