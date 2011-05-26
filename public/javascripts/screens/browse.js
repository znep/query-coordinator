$(function()
{
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

        $content.find('.button.about:not(.hide)').attr("href", ds.fullUrl + ((ds.type == "blob" || ds.type == "href") ? "" : "/about"));
    };

    // Hook up expansion for list view
    $browse.find('table tbody tr').expander({
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
                var newOpts = $.extend({}, opts, {q: escape($search.val())});
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

    var extentChooserMap;
    var extentChooserRect;
    $browse.find('a.chooseBounds').click(function(e)
    {
        e.preventDefault();

        var $dialog = $('.extentChooser');
        $dialog.jqmShow();

        extentChooserMap = new google.maps.Map($dialog.find('.mapContainer')[0],
            {mapTypeId: google.maps.MapTypeId.ROADMAP,
                center: new google.maps.LatLng(40, -100), zoom: 4});
        var m1;
        var m2;
        extentChooserRect = new google.maps.Rectangle({map: extentChooserMap});

        var mapRedraw = function(fitMap)
        {
            // Use extend instead of passing points directly so that we don't
            // have to manually calculate SW & NE; extend will handle that
            var b = new google.maps.LatLngBounds();
            b.extend(m1.getPosition());
            b.extend(m2.getPosition());
            extentChooserRect.setBounds(b);
            if (fitMap) { extentChooserMap.fitBounds(b); }
        };

        var createMarker = function(latLng)
        {
            var m = new google.maps.Marker({map: extentChooserMap, draggable: true,
                    position: latLng});
            google.maps.event.addListener(m, 'position_changed', mapRedraw);
            return m;
        };

        var p1 = new google.maps.LatLng(47, -120);
        var p2 = new google.maps.LatLng(33, -80);
        if (!$.isBlank(blist.browse.extents))
        {
            p1 = new google.maps.LatLng(blist.browse.extents.ymax,
                blist.browse.extents.xmin);
            p2 = new google.maps.LatLng(blist.browse.extents.ymin,
                blist.browse.extents.xmax);
        }
        m1 = createMarker(p1);
        m2 = createMarker(p2);
        mapRedraw(true);

        google.maps.event.addListener(extentChooserMap, 'bounds_changed', function()
        {
            var bounds = extentChooserMap.getBounds();
            var ne = bounds.getNorthEast();
            var sw = bounds.getSouthWest();

            var latMin = sw.lat();
            var latMax = ne.lat();
            var latPad = Math.abs(latMax - latMin) * 0.1;
            latMin += latPad;
            latMax -= latPad;

            var longMin = sw.lng();
            var longMax = ne.lng();
            var longPad = Math.abs(longMax - longMin) * 0.1;
            longMin += longPad;
            longMax -= longPad;

            var adjMarker = function(m)
            {
                var p = m.getPosition();
                if (p.lat() >= latMin && p.lat() <= latMax &&
                    p.lng() >= longMin && p.lng() <= longMax) { return; }
                m.setPosition(new google.maps.LatLng(
                    Math.max(latMin, Math.min(latMax, p.lat())),
                    Math.max(longMin, Math.min(longMax, p.lng()))));
            };

            adjMarker(m1);
            adjMarker(m2);
        });
    });

    $('.extentChooser .actions .accept').click(function(e)
    {
        e.preventDefault();
        if ($.isBlank(extentChooserMap)) { return; }

        var newOpts = $.extend({}, opts);
        var b = extentChooserRect.getBounds();
        var ne = b.getNorthEast();
        var sw = b.getSouthWest();
        newOpts.extents = sw.lng().toFixed(5) + ',' + ne.lng().toFixed(5) + ',' +
            sw.lat().toFixed(5) + ',' + ne.lat().toFixed(5);
        doBrowse(newOpts);
    });

});
