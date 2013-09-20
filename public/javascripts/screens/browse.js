$(function()
{
    var $browse = $('.browseSection');
    var spinner = blist.mainSpinner || $browse.loadingSpinner({ showInitially: true });

    // alias this method so external scripts can get at it
    var getDS = blist.browse.getDS = function($item)
    {
        var id = $item.closest('tr').attr('data-viewId');
        if (!(blist.browse.datasets[id] instanceof Dataset))
        { blist.browse.datasets[id] = new Dataset(blist.browse.datasets[id]); }
        return blist.browse.datasets[id];
    };

    var opts = {};
    if (!$.isBlank(window.location.search))
    {
        _.each(window.location.search.slice(1).split('&'), function(p)
        {
            var s = p.split('=');

            s[0] = unescape(s[0]);

            if (/\[\]$/.test(s[0]))
            {
                if ($.isBlank(opts[s[0]]))
                {
                    opts[s[0]] = [];
                }

                opts[s[0]].push(s[1])
            }
            else
            {
                opts[s[0]] = s[1];
            }
        });
    }

    var doBrowse = function(newOpts)
    {
        // Reset page
        delete newOpts.page;
        // set utf8
        newOpts.utf8 = '%E2%9C%93';
        // Pull real URL from JS
        window.location = blist.browse.baseURL + '?' +
            _.map(newOpts, function(v, k)
            {
                if (_.isArray(v))
                {
                    return _.map(v, function(subvalue)
                    {
                        return k + '=' + subvalue;
                    }).join('&');
                }

                return k + '=' + v;
            }).join('&');
    };

    $browse.find('select').uniform();
    $browse.find('select.hide').each(function()
    {
        var $t = $(this);
        $t.removeClass('hide');
        $t.closest('.uniform').addClass('hide');
    });

    var $sortType = $browse.find('select.sortType');
    var $sortPeriod = $browse.find('select.sortPeriod');
    var showHideSortPeriod = function()
    {
        _.defer(function()
        {
            $sortPeriod.closest('.uniform').toggleClass('hide',
                !$sortType.find('option:selected').hasClass('timePeriod'));
        });
    };
    $sortType.change(showHideSortPeriod)
        .keypress(showHideSortPeriod).click(showHideSortPeriod);

    var doSort = function()
    {
        _.defer(function()
        {
            var newOpts = $.extend({}, opts);
            newOpts.sortBy = $sortType.val();
            if ($sortPeriod.is(':visible'))
            { newOpts.sortPeriod = $sortPeriod.val(); }
            else
            { delete newOpts.sortPeriod; }
            doBrowse(newOpts);
        });
    };
    $sortType.add($sortPeriod).change(doSort);

    var doExpansion = function($row)
    {
        var $content = $row.find('.nameDesc .extraInfo .infoContent:empty');
        if ($content.length < 1) { return; }

        var ds = getDS($row);
        $content.append($.renderTemplate('expandedInfo', ds,
            {
                '.manageApi.button@href': function(v) { return '/api_foundry/manage/' + v.context.id; },
                '.manageApi.button@class+': function(v)
                    { return v.context.isAPI() && v.context.hasRight('update_view') &&
                        !v.context.isFederated() ? '' : 'hide' },
                '.permissions.button': function(v)
                    { return $.t('controls.browse.actions.permissions.change_button.' + (v.context.isPublic() ? 'public' : 'private') + '_html'); },
                '.permissions.button@class+': function(v)
                    { return v.context.hasRight('update_view') &&
                        !v.context.isFederated() ? '' : 'hide'; },
                '.delete.button@class+': function(v)
                    { return v.context.hasRight('delete_view') &&
                        !v.context.isFederated() ? '' : 'hide'; },
                '.comments .value': 'numberOfComments'
            }));

        blist.datasetControls.hookUpShareMenu(ds, $content.find('.share.menu'),
                {
                    menuButtonContents: $.tag([
                        {tagName: 'span', 'class': 'shareIcon'},
                        {tagName: 'span', 'class': 'shareText', contents: $.t('controls.browse.actions.share_button')}
                    ], true),
                    onOpen: function($menu)
                    {
                        $.analytics.trackEvent('browse ' + window.location.pathname,
                            'share menu opened', ds.id);
                    },
                    onClose: function($menu)
                    {
                        if (($.browser.msie) && ($.browser.majorVersion < 8))
                        { $menu.closest('.extraInfo').css('z-index', 0); }
                    },
                    parentContainer: $row.closest('.results')
                }, true);

        $content.find('.datasetAverageRating').stars({ value: ds.averageRating });

        $content.find('.button.permissions:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            var isPublic = ds.isPublic();
            if (isPublic) { ds.makePrivate(); }
            else { ds.makePublic(); }
            $t.text($.t('controls.browse.actions.permissions.change_button.' + (v.context.isPublic() ? 'public' : 'private') + '_html'));
        });

        $content.find('.button.delete:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            if (confirm($.t('controls.browse.actions.delete.confirm', { dataset: ds.name })))
            {
                ds.remove(function() { $t.closest('tr.item').remove(); });
            }
        });

        $content.find('.button.about:not(.hide)')
          .attr("href", ds.fullUrl +
              ((ds.type == "blob" || ds.type == "href") ? "" : "/about"))
          .attr('rel', ds.isFederated() ? 'external' : '');
    };

    // Hook up expansion for list view
    $browse.find('table tbody tr').expander({
        animate: false,
        contentSelector: '.nameDesc .expandBlock',
        expandSelector: '.index .expander, .nameDesc .extraInfo .close',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded',
        forceExpander: true,
        preExpandCallback: doExpansion
    });

    // Hook up expansion for rich view
    $browse.find('table tbody tr').expander({
        contentSelector: '.richSection .description',
        expandSelector: '.richSection .expander',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded'
    });

    var renderRows = function()
    {
        // Sad hack: we don't have the stemmed version,
        // so just highlight the words they typed
        var searchRegex = blist.browse.searchOptions.q ?
            new RegExp(blist.browse.searchOptions.q.trim().replace(' ', '|'), 'gi') : '';
        // Render row search results, if any
        $browse.find('table tbody tr.withRows .rowSearchResults')
            .each(function()
        {
            var $results = $(this);
            var ds = getDS($results);
            $results.rowSearchRenderType({ highlight: searchRegex,
                rows: ds.rowResults, view: ds,
                query: blist.browse.searchOptions.q,
                totalRowResults: ds.rowResultCount });

            var $display = $results.find('.rowSearchRenderType');
            $display.removeClass('hide').css('opacity', 0);

            // Is it too tall?
            if ($results.height() > 220)
            {
                var $rows = $display.find('.rowList');
                $rows.data('origheight', $rows.height());
                $results.addClass('collapsed overheight');
                $results.find('.expandRowResults').click(function(event)
                {
                    event.preventDefault();
                    var expanding = $results.hasClass('collapsed'),
                        newHeight = expanding ? $rows.data('origheight') : 200;
                    $rows.animate({'max-height': newHeight}, 300,
                        function() { $results.toggleClass('collapsed'); });
                    $display.find('.expandHint')
                        .toggleClass('upArrow downArrow').end()
                        .find('.fader')[expanding ? 'fadeOut' : 'fadeIn'](300);
                });
            }

            $display.animate({ opacity: 1 }, 300, function() {
                $display.css('opacity', '');
            });
        });
        spinner.showHide(false);
    };

    // Need to load rows related to the search
    if (!$.isBlank(blist.browse.rowCount))
    {
        Dataset.search($.extend({}, blist.browse.searchOptions, { row_count: blist.browse.rowCount }),
            function(results)
            {
                _.each(results.views, function(ds)
                {
                    if (ds.rowResultCount > 0)
                    {
                        blist.browse.datasets[ds.id] = blist.browse.datasets[ds.id] || {};
                        blist.browse.datasets[ds.id].rowResults = ds.rowResults;
                        blist.browse.datasets[ds.id].rowResultCount = ds.rowResultCount;
                        $browse.find('table tbody tr[data-viewid="' + ds.id + '"]').addClass('withRows');
                    }
                });
                renderRows();
            });
    }
    else
    { spinner.showHide(false); }

    // Handle sidebar facets
    var $searchSect = $browse.find('.searchSection');
    if ($searchSect.length > 0)
    {
        var $search = $searchSect.find('.searchBox');
        var hookSearch = function(e)
        {
            e.preventDefault();
            _.defer(function()
            {
                var newOpts = $.extend({}, opts, {q: encodeURIComponent($search.val())});
                if ($.isBlank(newOpts.q))
                {
                    delete newOpts.q;
                }
                else
                {
                    delete newOpts.sortPeriod;
                    newOpts.sortBy = 'relevance';
                }
                doBrowse(newOpts);
            });
        };

        $searchSect.submit(hookSearch).children('.icon').click(hookSearch);
    }

    $browse.find('.facetSection .moreLink').click(function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var $options = $t.siblings('.moreOptions');

        $t.toggleClass('expanded');
        if ($t.hasClass('expanded'))
        {
            $t.text($.t('controls.browse.actions.less_options'));
            $options.hide().removeClass('hide').slideDown();
        }
        else
        {
            $options.slideUp();
            $t.text($.t('controls.browse.actions.all_options'));
        }
    });

    $browse.find('.facetSection .cloudLink').click(function(event)
    {
        event.preventDefault();
        var $dialog = $('#browseDialog_' + $(this).attr('rel'));
        $dialog.find('.optionsContent a').tagcloud({
            size: { start: 1.2, end: 2.8, unit: 'em' }
        });
        $dialog.jqmShow();

        _.defer(function() { $dialog.find('.optionsContent a:first').focus(); });
    });

    $.live('a[rel*=externalDomain]', 'click', function(e)
    {
        e.preventDefault();

        var $a = $(this);
        var ds = getDS($a);
        var href = $a.attr('href');
        var description = ds.description;
        if (description && description.length > 128)
        { description = description.substring(0, 128) + '...'; }
        description = $.htmlEscape(description).linkify('rel="nofollow"');
        var $modal = $('.externalDomainNotice');
        $modal.find('.leavingLink').attr('href', href).text(href);
        $modal.find('.accept.button').attr('href', href);
        $modal.find('.datasetType').text(ds.displayName);
        $modal.find('.externalDomain').attr('href', ds.domainUrl)
            .text(ds.domainCName);
        $modal.find('.dsName').text(ds.name).end()
              .find('.dsDesc').html(description);
        $modal.jqmShow();
    });

});
