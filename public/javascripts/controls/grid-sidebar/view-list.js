(function($)
{
    if (blist.sidebarHidden.savedViews) { return; }

    var $sections = {};
    var views = {};

    var renderViews = function(views, $section, sort)
    {
        $section.removeClass('loading');
        if (views.length < 1)
        {
            $section.addClass('noResults');
            return;
        }

        sort = sort || 'dateDescending';
        var sorted = _.sortBy(views, function(v)
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
                { return blist.dataset.getTypeName(a.context).capitalize(); },
                '.viewIcon@class+': function(a)
                { return 'type' + blist.dataset.getDisplayType(a.context); },
                '.name': 'name',
                '.name@title': 'name',
                '.name@href': function(a)
                { return $.generateViewUrl(a.context); },
                '.authorLine .date': function(a)
                {
                    return blist.util.humaneDate.getFromDate(
                        Math.max(a.context.viewLastModified,
                            a.context.createdAt) * 1000,
                        blist.util.humaneDate.DAY).capitalize();
                },
                '.authorLine .author': 'owner.displayName',
                '.description': 'description',
                '.deleteViewLink@class+': function(a)
                {
                    return blist.currentUserId != a.context.owner.id ? 'hide' : '';
                }
            });
            if (v.id == blist.display.view.id)
            { $li.addClass('current'); }
            $li.attr('data-search',
                (v.name + ' ' + v.owner.displayName).toLowerCase());

            $li.expander({ contentSelector: '.description' });

            $li.find('.deleteViewLink:not(.hide)').click(function(e)
            {
                e.preventDefault();
                if (confirm('Are you sure you want to delete ' +
                    $.htmlEscape(v.name) + '?'))
                {
                    var deletedCallback = function()
                    {
                        $li.remove();
                        views.splice(_.indexOf(views, v), 1);
                        if (blist.display.view.id == v.id &&
                            !$.isBlank(blist.parentViewId))
                        {
                            blist.util.navigation
                                .redirectToView(blist.parentViewId);
                        }
                    };

                    $.ajax({url: '/views/' + v.id + '.json',
                        type: 'DELETE',
                        success: deletedCallback});
                }
            });

            $ul.append($li);
        });
    };

    var setupSection = function(views, $section)
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
            renderViews(views, $section, href.slice(href.indexOf('#') + 1));
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

        renderViews(views, $section);
    };



    var filterConfig =
    {
        name: 'filter.savedFilters',
        priority: 10,
        title: 'Saved Views',
        subtitle: 'See existing public filters and grouped views on this dataset',
        sections: [{
            customContent: {
                template: 'itemsListBlock',
                directive: {
                    '.emptyResult .type': '#{resultType}s'
                },
                data: {
                    resultType: 'view'
                },
                callback: function($s)
                {
                    $sections['filter'] = $s;
                    if (!$.isBlank(views['filter']))
                    { setupSection(views['filter'], $sections['filter']); }
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(filterConfig);


    var vizConfig =
    {
        name: 'visualize.savedVisualizations',
        priority: 10,
        title: 'Saved Views',
        subtitle: 'See existing public maps, charts and calendars on this dataset',
        sections: [{
            customContent: {
                template: 'itemsListBlock',
                directive: {
                    '.emptyResult .type': '#{resultType}s'
                },
                data: {
                    resultType: 'view'
                },
                callback: function($s)
                {
                    $sections['viz'] = $s;
                    if (!$.isBlank(views['viz']))
                    { setupSection(views['viz'], $sections['viz']); }
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(vizConfig);


    var formConfig =
    {
        name: 'embed.savedForms',
        priority: 10,
        title: 'Saved Views',
        subtitle: 'See existing forms on this dataset',
        sections: [{
            customContent: {
                template: 'itemsListBlock',
                directive: {
                    '.emptyResult .type': '#{resultType}s'
                },
                data: {
                    resultType: 'view'
                },
                callback: function($s)
                {
                    $sections['form'] = $s;
                    if (!$.isBlank(views['form']))
                    { setupSection(views['form'], $sections['form']); }
                }
            }
        }]
    };

    $.gridSidebar.registerConfig(formConfig);

    // Document ready; load data
    $(function()
    {
        _.defer(function()
        {
            $.Tache.Get({ url: '/views.json', data: { method: 'getByTableId',
                    tableId: blist.display.view.tableId }, cache: false,
                dataType: 'json', contentType: 'application/json',
                success: function(v)
                {
                    views['filter'] = _.select(v, function(v)
                    {
                        return _.include(['Filter', 'Grouped'],
                            blist.dataset.getDisplayType(v));
                    });

                    if (!$.isBlank($sections['filter']))
                    { setupSection(views['filter'], $sections['filter']); }


                    views['viz'] = _.select(v, function(v)
                    {
                        return _.include(['Visualization', 'Calendar', 'Map'],
                            blist.dataset.getDisplayType(v));
                    });

                    if (!$.isBlank($sections['viz']))
                    { setupSection(views['viz'], $sections['viz']); }


                    views['form'] = _.select(v, function(v)
                    { return 'Form' == blist.dataset.getDisplayType(v); });

                    if (!$.isBlank($sections['form']))
                    { setupSection(views['form'], $sections['form']); }
                }});
        });
    });

})(jQuery);
