$(function()
{
    var getDS = function($item)
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
            opts[s[0]] = s[1];
        });
    }

    var doBrowse = function(newOpts)
    {
        // Reset page
        delete newOpts.page;
        // Pull real URL from JS
        window.location = blist.browse.baseURL + '?' +
            _.map(newOpts, function(v, k) { return k + '=' + v; }).join('&');
    };

    var $browse = $('.browseSection');
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
                '.permissions .permType': function(v)
                    { return v.context.isPublic() ? 'Private' : 'Public'; },
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
                        {tagName: 'span', 'class': 'shareText', contents: 'Share'}
                    ], true),
                    onOpen: function($menu)
                    {
                        // Grr, IE7
                        if (($.browser.msie) && ($.browser.majorVersion < 8))
                        { $menu.closest('.extraInfo').css('z-index', 1); }
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

        $content.find('.datasetAverageRating')
            .stars({value: ds.averageRating, enabled: false});

        $content.find('.button.permissions:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            var isPublic = ds.isPublic();
            if (isPublic) { ds.makePrivate(); }
            else { ds.makePublic(); }
            $t.find('.permType').text(isPublic ? 'Public' : 'Private');
        });

        $content.find('.button.delete:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            if (confirm('Are you sure you want to delete ' + ds.name + '?'))
            {
                ds.remove(function() { $t.closest('tr.item').remove(); });
            }
        });
    };

    $browse.find('table tbody tr').expander({
        contentSelector: '.nameDesc .expandBlock',
        expandSelector: '.index .expander, .nameDesc .extraInfo .close',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded',
        forceExpander: true,
        preExpandCallback: doExpansion
    });


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
                var newOpts = $.extend({}, opts, {q: $search.val()});
                if ($.isBlank(newOpts.q)) { delete newOpts.q; }
                doBrowse(newOpts);
            });
        };

        $searchSect.submit(hookSearch).children('.icon').click(hookSearch);
    }

    $browse.find('.facetSection .moreLink').click(function(e)
    {
        e.preventDefault();
        var $dialog = $('.browseOptionsDialog');
        var $c = $dialog.find('.optionsContent');
        $c.empty();
        $c.append($(this).siblings('.moreOptions').children().clone());
        if ($c.find('[rel]').length > 0)
        { $c.find('a').tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } }); }
        $dialog.jqmShow();
    });

    $.live('a[rel*=externalDomain]', 'click', function(e)
    {
        e.preventDefault();

        var $a = $(this);
        var ds = getDS($a);
        var href = $a.attr('href');

        var $modal = $('.externalDomainNotice');
        $modal.find('.leavingLink').attr('href', href).text(href);
        $modal.find('.accept.button').attr('href', href);
        $modal.find('.datasetType').text(ds.displayName);
        $modal.find('.externalDomain').attr('href', ds.domainUrl)
            .text(ds.domainCName);
        $modal.jqmShow();
    });
});
