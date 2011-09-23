(function($)
{
    if (blist.sidebarHidden.moreViews &&
        blist.sidebarHidden.moreViews.views &&
        blist.sidebarHidden.moreViews.snapshots) { return; }

    var PAGE_SIZE = 20;

    var viewList;
    var snapshotList;

    $.live('#gridSidebar_viewList .deleteViewLink', 'click', function(e)
    {
        e.preventDefault();

        var $li = $(this).closest('li');
        var v = $li.data('view');
        if (confirm('Are you sure you want to delete ' + v.name + '?'))
        {
            var redirDS;
            var deletedCallback = function()
            {
                $li.remove();
                viewList.splice(_.indexOf(viewList, v), 1);
                if (!$.isBlank(blist.datasetPage))
                {
                    blist.datasetPage.$moreViewsTab.contentIndicator()
                        .setText(viewList.length);
                }

                if (!$.isBlank(redirDS)) { redirDS.redirectTo(); }
            };

            if (blist.dataset.id == v.id)
            {
                blist.dataset.getParentDataset(function(parDS)
                { if (!$.isBlank(parDS)) { redirDS = parDS; } });
            }
            v.remove(deletedCallback);
        }
    });

    $.live('#gridSidebar_snapshotList .deleteViewLink', 'click', function(e)
    {
        e.preventDefault();

        var $li = $(this).closest('li');
        var v = $li.data('view');
        if (confirm('Are you sure you want to delete ' +
            $.htmlEscape(v.name) + ' (snapshotted ' +
                new Date((v.publicationDate || 0) * 1000).format('F d, Y g:ia') + ')?'))
        {
            var redirDS;
            var deletedCallback = function()
            {
                $li.remove();
                snapshotList.splice(_.indexOf(snapshotList, v), 1);

                if (!$.isBlank(redirDS)) { redirDS.redirectTo(); }
            };

            if (blist.dataset.id == v.id)
            {
                blist.dataset.getPublishedDataset(function(pubDS)
                { if (!$.isBlank(pubDS)) { redirDS = pubDS; } });
            }
            v.remove(deletedCallback);
        }
    });

    var renderViews = function($section, list, options)
    {
        if (list.length < 1)
        {
            $section.addClass('noResults');
            return null;
        }

        var items = list;
        if (!$.isBlank(options.show) && options.show != 'all')
        {
            items = _.select(items, function(v) { return v.type == options.show; });
        }

        if (!$.isBlank(options.search))
        {
            items = _.select(items, function(v)
            {
                return v.name.toLowerCase().indexOf(options.search) >= 0 ||
                    v.owner.displayName.toLowerCase().indexOf(options.search) >= 0;
            });
        }

        var $ul = $section.find('.itemsContent ul.itemsList');
        $ul.empty();

        if (items.length < 1)
        {
            $section.addClass('emptySearch');
            return;
        }
        $section.removeClass('emptySearch');

        items = _.sortBy(items, function(v)
            {
                if (options.sort.startsWith('date'))
                {
                    return Math.max(v.viewLastModified, v.createdAt) *
                        (options.sort == 'dateDescending' ? -1 : 1);
                }
                else if (options.sort == 'alphaAscending')
                { return v.name.toLowerCase(); }
                else if (options.sort == 'popularity')
                {
                    var vc = v.viewCount || 0;
                    var len = 10;
                    while (vc.length < len) { vc = '0' + vc; }
                    return (v.owner.id == v.tableAuthor.id ? 'a' : 'z') +
                        vc + v.name.toLowerCase();
                }
                else if (options.sort == 'publicationDate')
                { return (v.publicationDate || 0) * -1; }
            });

        var rendered = 0;
        var remaining = items.length;
        var renderBlock = function(skipAnimation)
        {
            if (remaining <= 0) { return; }
            _.each(items.slice(rendered, rendered + PAGE_SIZE), function(v)
            {
                var $li = $.renderTemplate('viewItemContainer', {view: v, typeClass: options.typeClass}, {
                    '.viewIcon@title': function(a)
                    { return a.context.view.displayName.capitalize(); },
                    '.viewIcon@class+': function(a)
                    { return 'type' + a.context.view.styleClass; },
                    '.nameLink@href': 'view.url',
                    '.name': 'view.name!',
                    '.name@title': 'view.name',
                    '.pubDate': function(a)
                    {
                        return new Date((a.context.view.publicationDate || 0) * 1000).format('F d, Y g:ia');
                    },
                    '.authorLine .date': function(a)
                    {
                        return blist.util.humaneDate.getFromDate(
                            Math.max(a.context.view.viewLastModified || 0,
                                a.context.view.createdAt || 0) * 1000,
                            blist.util.humaneDate.DAY).capitalize();
                    },
                    '.authorLine .author': 'view.owner.displayName!',
                    '.description': 'view.description!',
                    '.deleteViewLink@class+': function(a)
                    {
                        return _.include(a.context.view.rights, 'delete_view') ?
                            '' : 'hide';
                    },
                    '.viewItem@class+': 'typeClass'
                });

                $li.data('view', v);

                if (v.id == blist.dataset.id)
                { $li.addClass('current'); }

                if (v.owner.id == v.tableAuthor.id)
                { $li.addClass('ownerItem'); }

                // Need to wait until this is visible so the height measures
                // correctly
                _.defer(function()
                    { $li.expander({ contentSelector: '.description' }); });

                $ul.append($li);
            });

            rendered += PAGE_SIZE;
            remaining -= PAGE_SIZE;
            var $moreLink = $section.find('.moreLink');
            if (remaining > 0)
            {
                $moreLink.removeClass('hide');
                if (remaining == 1)
                { $moreLink.text('See last view'); }
                else
                {
                    $moreLink.text('See next ' +
                        Math.min(remaining, PAGE_SIZE) + ' views');
                }
            }
            else
            { $moreLink.addClass('hide'); }

            if (!skipAnimation)
            {
                var $scrollC = $section.closest('.scrollContent');
                $scrollC.animate({
                    scrollTop: Math.min(
                        // either the height of the appended elements,
                        $section.outerHeight(true) - $scrollC.height(),
                        // or the height of the scroll container.
                        $scrollC.scrollTop() + $scrollC.height() -
                            $moreLink.outerHeight(true))
                }, 'slow');
            }
        };

        renderBlock(true);
        return renderBlock;
    };

    var defaultSorts = [{ text: 'Popularity', name: 'popularity' },
        { text: 'Most Recent', name: 'dateDescending' },
        { text: 'Oldest to Newest', name: 'dateAscending' },
        { text: 'A-Z', name: 'alphaAscending' }];

    var setupSection = function($section, list, defaultOptions)
    {
        var options = $.extend({show: 'all', sort: 'popularity', sortOptions: defaultSorts},
            defaultOptions);
        var $sortMenu = $section.find('.sortMenu');
        $sortMenu.menu({
            menuButtonContents: 'Sort by',
            menuButtonTitle: 'Sort by',
            contents: _.map(options.sortOptions, function(s)
                { return {text: s.text, href: '#' + s.name,
                    className: 'none' + (s.name == options.sort ? ' checked' : '')}; })
        });

        var renderBlock;
        $sortMenu.find('.menuDropdown a').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.closest('li').is('.checked')) { return; }

            $a.closest('.menuDropdown').find('.checked').removeClass('checked');
            $a.closest('li').addClass('checked');

            options.sort = $.hashHref($a.attr('href'));
            renderBlock = renderViews($section, list, options);
        });

        var $showMenu = $section.find('.showMenu');
        if (!$showMenu.hasClass('hide'))
        {
            $showMenu.menu({
                menuButtonContents: 'Show only',
                menuButtonTitle: 'Show only',
                contents: [
                    { text: 'All Views', className: 'none checked', href: '#all' },
                    { text: 'Charts', className: 'typeChart', href: '#chart',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'chart'; })},
                    { text: 'Maps', className: 'typeMap', href: '#map',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'map'; })},
                    { text: 'Calendars', className: 'typeCalendar', href: '#calendar',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'calendar'; })},
                    { text: 'Filtered Views', className: 'typeFilter', href: '#filter',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'filter'; })},
                    { text: 'Grouped Views', className: 'typeGrouped', href: '#grouped',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'grouped'; })},
                    { text: 'Forms', className: 'typeForm', href: '#form',
                        onlyIf: _.any(list,
                            function(v) { return v.type == 'form'; })}
                ]
            });

            $showMenu.find('.menuDropdown a').click(function(e)
            {
                e.preventDefault();
                var $a = $(this);
                if ($a.closest('li').is('.checked')) { return; }

                options.show = $.hashHref($a.attr('href'));

                var $old = $a.closest('.menuDropdown').find('.checked');
                $old.removeClass('checked')
                    .addClass('type' + $.hashHref($old.children('a').attr('href'))
                        .capitalize());
                $a.closest('li').addClass('checked')
                    .removeClass('type' + options.show.capitalize());

                renderBlock = renderViews($section, list, options);
            });
        }

        $section.find('.textPrompt')
            .example(function () { return $(this).attr('title'); });

        var $search = $section.find('.viewSearch');
        var $clearSearch = $section.find('.clearViewSearch');

        var doSearch = function()
        {
            var s = $search.val().toLowerCase();
            if ($search.is('.prompt')) { s = ''; }
            $clearSearch.toggle(!$.isBlank(s));

            options.search = s;
            renderBlock = renderViews($section, list, options);
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

        $section.find('.moreLink').click(function(e)
        {
            e.preventDefault();
            if (_.isFunction(renderBlock))
            { renderBlock(); }
        });

        renderBlock = renderViews($section, list, options);
    };



    var viewsConfig =
    {
        name: 'moreViews.viewList',
        priority: 1,
        title: 'Views',
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

                    blist.dataset.getRelatedViews(
                        function(v)
                        {
                            sidebarObj.finishProcessing();

                            viewList = v;

                            setupSection($s, viewList, {typeClass: 'view'});
                        });
                }
            }
        }]
    };

    if (!blist.sidebarHidden.moreViews ||
        !blist.sidebarHidden.moreViews.views)
    { $.gridSidebar.registerConfig(viewsConfig); }


    var snapshotsConfig =
    {
        name: 'moreViews.snapshotList',
        priority: 2,
        title: 'Dataset Snapshots',
        subtitle: 'View previously published versions of this data',
        sections: [{
            customContent: {
                template: 'itemsListBlock',
                directive: {
                    '.sortMenu@class+': 'hide',
                    '.showMenu@class+': 'hide',
                    '.emptyResult .type': '#{resultType}s'
                },
                data: {
                    resultType: 'dataset',
                    hide: 'hide'
                },
                callback: function($s, sidebarObj)
                {
                    sidebarObj.startProcessing();

                    blist.dataset.getSnapshotDatasets(
                        function(sd)
                        {
                            sidebarObj.finishProcessing();

                            snapshotList = sd;

                            setupSection($s, snapshotList, {typeClass: 'snapshot',
                                sort: 'publicationDate'});
                        });
                }
            }
        }]
    };

    if (!blist.sidebarHidden.moreViews ||
        !blist.sidebarHidden.moreViews.snapshots)
    { $.gridSidebar.registerConfig(snapshotsConfig); }

})(jQuery);
