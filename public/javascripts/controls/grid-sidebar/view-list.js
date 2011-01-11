(function($)
{
    if (blist.sidebarHidden.savedViews) { return; }

    var PAGE_SIZE = 20;

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

    var renderBlock;
    var $moreLink;
    var $scrollContainer;

    var currentSort = 'dateDescending';
    var currentSearch;

    var renderViews = function()
    {
        if (viewList.length < 1)
        {
            $section.addClass('noResults');
            return;
        }

        var items = viewList;
        if (!$.isBlank(currentSearch))
        {
            items = _.select(items, function(v)
            {
                return v.name.toLowerCase().indexOf(currentSearch) >= 0 ||
                    v.owner.displayName.toLowerCase().indexOf(currentSearch) >= 0;
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
                if (currentSort.startsWith('date'))
                {
                    return Math.max(v.viewLastModified, v.createdAt) *
                        (currentSort == 'dateDescending' ? -1 : 1);
                }
                else if (currentSort == 'alphaAscending')
                { return v.name.toLowerCase(); }
            });

        var rendered = 0;
        var remaining = items.length;
        renderBlock = function(skipAnimation)
        {
            if (remaining <= 0) { return; }
            _.each(items.slice(rendered, rendered + PAGE_SIZE), function(v)
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
                        return _.include(a.context.rights, 'delete_view') ?
                            '' : 'hide';
                    }
                });

                $li.data('view', v);

                if (v.id == blist.dataset.id)
                { $li.addClass('current'); }

                // Need to wait until this is visible so the height measures
                // correctly
                _.defer(function()
                    { $li.expander({ contentSelector: '.description' }); });

                $ul.append($li);
            });

            rendered += PAGE_SIZE;
            remaining -= PAGE_SIZE;
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
                $scrollContainer.animate({
                    scrollTop: Math.min(
                        // either the height of the appended elements,
                        $section.outerHeight(true) - $scrollContainer.height(),
                        // or the height of the scroll container.
                        $scrollContainer.scrollTop() + $scrollContainer.height() -
                            $moreLink.outerHeight(true))
                }, 'slow');
            }
        };

        renderBlock(true);
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
            currentSort = href.slice(href.indexOf('#') + 1)
            renderViews();
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

            currentSearch = s;
            renderViews();
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
                    $scrollContainer = $section.closest('.scrollContent');

                    $moreLink = $section.find('.moreLink');
                    $moreLink.click(function(e)
                    {
                        e.preventDefault();
                        if (_.isFunction(renderBlock))
                        { renderBlock(); }
                    });

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
