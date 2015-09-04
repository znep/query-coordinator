$(function()
{
    var $browse = $('.browseSection');
    var $listingDescriptions = $('.browse-listing-description');
    function updateDescriptionControls() {
        $listingDescriptions.
          each(function() {
              var $this = $(this);
              $this.find('.browse-listing-description-controls').
                toggleClass('hidden', parseFloat($this.css('max-height')) > $this.height());
          });
    }
    updateDescriptionControls();

    $listingDescriptions.
        on('click', '[data-expand-action]', function(event) {
            event.preventDefault();
            $(event.delegateTarget).toggleClass('is-expanded');
        });

    $(window).on('resize', _.throttle(updateDescriptionControls, 100));

    // alias this method so external scripts can get at it
    var getDS = blist.browse.getDS = function($item, browseType)
    {
        var id;
        switch (browseType) {
            case 'listing':
                id = $item.closest('.browse-list-item').attr('data-viewId');
                break;
            case 'table':
            case 'rich':
            default:
                id = $item.closest('tr').attr('data-viewId');
                break;
        }
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
                    {
                        if (v.context.isNewView()) {
                          return 'hide';
                        }
                        var publicGrant = _.detect(v.context.grants || [], function(grant)
                            { return _.include(grant.flags || [], 'public'); });
                        return v.context.hasRight('update_view') && !v.context.isFederated() &&
                            (!publicGrant || !publicGrant.inherited) ? '' : 'hide';
                    },
                '.delete.button@class+': function(v)
                    {
                        if (!blist.feature_flags.display_catalog_lens_delete_button &&
                            v.context.isNewView()) {
                            return 'hide';
                        }
                        return v.context.hasRight('delete_view') &&
                            !v.context.isFederated() ? '' : 'hide';
                    },
                '.comments .value': 'numberOfComments',
                '.about@class+': function(v)
                    {
                        return v.context.isNewView() ? 'hide' : '';
                    },
                '.comments@class+': function(v)
                    {
                        return v.context.isNewView() ? 'hide' : '';
                    },
                '.starsControl@class+': function(v)
                    {
                        return v.context.isNewView() ? 'hide' : '';
                    }
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
            $t.text($.t('controls.browse.actions.permissions.change_button.' + (!isPublic ? 'public' : 'private') + '_html'));
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

    function controlDeleteButton(e, ds) {
        e.preventDefault();
        if (confirm($.t('controls.browse.actions.delete.confirm', { dataset: ds.name })))
        {
            ds.remove(function() { $(e.target).closest('.browse-list-item').remove(); });
        }
    }

    function controlPermissionsButton(e, ds) {
        e.preventDefault();
        var isPublic = ds.isPublic();
        if (isPublic) { ds.makePrivate(); }
        else { ds.makePublic(); }
        e.target.textContent = $.t('controls.browse.actions.permissions.change_button.' + (!isPublic ? 'public' : 'private') + '_html');
    }

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

    // Hook up settings menu for listing view
    $browse.find('.settings-icon').each(function(index, settingsIcon) {

        // Find necessary component elements
        var parentMediaItem = $(settingsIcon).parent().parent();
        var $settingsMenu = parentMediaItem.parent().find('.settings.menu');
        var ds = getDS($(settingsIcon), 'listing');
        // TODO:
        //   - Handle permissions
        //   - Add proper tool tips/titles
        //   - Add styling
        //   - refactor of controlPermissionsButton and controlDeleteButton and existing code
        //   - Figure out how to access view type instead of hard coding it (line 245 above)

        var canDelete = ds.hasRight('delete_view') && !ds.isFederated();

        var deleteMenuItem = {
          text: $.t('controls.browse.actions.delete.button'),
          className: 'delete button',
          href: '#Delete'
        };

        var canChangePermissions = (function(context) {
            if (context.isNewView()) {
                return false;
            }
            var publicGrant = _.detect(
                context.grants || [],
                function(grant) {
                    return _.include(grant.flags || [], 'public');
                }
            );
            return context.hasRight('update_view') &&
              !context.isFederated()
              && (!publicGrant || !publicGrant.inherited);
        })(ds);

        var permissionsMenuItem = {
          text: $.t('controls.browse.actions.permissions.change_button.' + (ds.isPublic() ? 'public' : 'private') + '_html'),
          className: 'permissions button',
          href: '#Permissions'
        };

        var opts = {
            menuButtonElement: $(settingsIcon),
            contents: _.compact([
                canChangePermissions ? permissionsMenuItem : null,
                canDelete ? deleteMenuItem : null
            ])
        };

        if (_.isEmpty(opts.contents)) {
            $(settingsIcon).remove();
        }
        else {
            $settingsMenu.menu(opts);
        }

        $settingsMenu.find('.permissions.button').click(function(e) {
            controlPermissionsButton(e, ds);
        });
        $settingsMenu.find('.delete.button').click(function(e) {
            controlDeleteButton(e, ds);
        });
    });


    // Sad hack: we don't have the stemmed version, so just highlight the words they typed.
    // Also remove special characters because they can break the regex.
    var searchRegex = $.subKeyDefined(blist, 'browse.searchOptions.q') ?
        new RegExp(blist.browse.searchOptions.q.trim().
            replace(/[^\w\s]/gi, '').
            replace(' ', '|'), 'gi') : '';

    if (!$.isBlank(searchRegex))
    {
        // Assuming that dataset names do not have any html inside them.
        // Assuming that dataset descriptions only have A tags inside them.
        $("table tbody tr").find("a.name, span.name, div.description, span.category, span.tags").each(function() {
            var $this = $(this),
                a_links = $this.children().map(function()
                    {
                        var $child = $(this);
                        $child.html($child.html()
                            .replace(searchRegex, '<span class="highlight">$&</span>'));
                        return $child[0].outerHTML;
                    }),
                text_bits = _.map($this.html().split(/<a.*\/a>/), function(text)
                    { return text.replace(searchRegex, '<span class="highlight">$&</span>'); });
            $this.html(_.flatten(_.zip(text_bits, a_links)).join(''));
        });
    }

    var replaceBrokenThumbnails = function() {
        $browse.find('.results td.largeImage .datasetImage').each(function() {
            // Whenever a custom dataset image URL is found, we render that
            // image node but also add a hidden dataset icon node for backup.
            // If the custom image isn't present at this point in execution,
            // display the icon instead... but also listen for the load event
            // and show the image if it later becomes available, which can occur
            // under situations with even moderate latency.
            var $img = $(this);
            if (this.naturalWidth === 0) {
                $img.hide().next().show();
                $img.one('load', function() {
                    if (this.naturalWidth > 0) {
                        $img.show().next().hide();
                    }
                });
            }
        });
    }
    replaceBrokenThumbnails();

    var renderRows = function()
    {
        // Render row search results, if any
        $browse.find('table tbody tr.withRows .rowSearchResults')
            .each(function()
        {
            var $results = $(this);
            $results.empty(); // Remove span for matching rows.

            var ds = getDS($results);
            $results.rowSearchRenderType({ highlight: searchRegex, view: ds,
                rows: _.map(ds.rowResults, function(r)
                    { return RowSet.translateRow(r, ds, null, null, true); }),
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
    };

    $.fn.dancingEllipsis = function(options)
    {
        var opts = $.extend({}, { text: '', interval: 700 }, options),
            ellipsis = '',
            spans = this;

        var interval = setInterval(function()
        {
            ellipsis = ellipsis.length >= 3 ? '' : ellipsis + '.';
            spans.text(opts.text + ellipsis);
        }, opts.interval);

        return function() { clearInterval(interval); };
    };

    /*
        SavePoint uses two strategies: scroll position and mouseover.
        1) Mouse position is preferred. If a row is hovered over, scroll back to
        that row on restore. (This is scrollTarget.)
        2) Scroll position looks for the row that has the closest .offset().top
        to scrollPos(). (This is $scrollTarget.)
    */
    $.fn.savePoint = function()
    {
        var $this = this,
            rowOffsets = this.map(function() { return $(this).offset().top; }),
            scrollDelta = 0, // Distance between hover target and top of screen.
            scrollTarget, $scrollTarget,
            captureTarget = function() { scrollTarget = this; };

        this.mouseover(captureTarget).mouseenter(captureTarget);

        return {
            save: function()
            {
                var scrollPos = $(document).scrollTop(), index = 0, minDelta = Infinity;
                if (scrollTarget)
                {
                    scrollDelta = $(scrollTarget).offset().top - scrollPos;
                    return; // Have hover target. Shortcircuit now.
                }

                if (scrollPos < rowOffsets[0]) { return; }

                // Minimize delta between scrollPos and offset.top.
                _.any(rowOffsets, function(offset, i)
                {
                    var delta = Math.abs(scrollPos - offset);
                    if (delta >= minDelta)
                    { return true; }
                    else
                    { minDelta = delta; }
                    index = i;
                });

                $scrollTarget = $this.filter(':eq(' + index + ')');
                scrollDelta = _.get($scrollTarget.offset(), 'top', 0) - scrollPos;
            },
            restore: function()
            {
                if (scrollTarget)
                { $(document).scrollTop(Math.max($(scrollTarget).offset().top - scrollDelta, 0)); }
                else if ($scrollTarget)
                { $(document).scrollTop(_.get($scrollTarget.offset(), 'top', 0) - scrollDelta); }
            }
        };
    };

    // Need to load rows related to the search
    if (!$.isBlank(blist.browse.rowCount))
    {
        var stopEllipsis = $('.rowSearchResults span')
                .dancingEllipsis({ text: $.t('controls.browse.row_results.matching_rows') }),
            savePoint = $('table tr').savePoint(); // This order is important.

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
                savePoint.save();
                stopEllipsis();
                renderRows();
                $(".rowSearchResults > span").text($.t('controls.browse.row_results.no_matching_rows'));
                savePoint.restore();
            });
    }

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

                if(!blist.mixpanelLoaded)
                {
                    doBrowse(newOpts);
                }
                else
                {
                    $.mixpanelMeta();
                    mixpanel.track("Used Search Field", {}, function()
                        {
                            doBrowse(newOpts);
                        });
                }
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

    // blist.iframeHack belongs in the parent window and listens for a modifier key.
    if (window != window.parent &&
        window.parent.blist &&
        window.parent.blist.iframeHack)
    {
        $('.browseSection').on('click', 'a[rel=external]', function(evt)
        {
            if (!window.parent.blist.iframeHack.isModified())
            {
                event.preventDefault();
                event.stopPropagation();
                window.parent.location = $(this).attr('href');
            }
        });
    }

    $.live(
        '#create-story-button',
        'click',
        generateCreateNewStoryHandler(
            $('#create-resource-dropdown')
        )
    );
    $.live(
        '#create-story-footer-button',
        'click',
        generateCreateNewStoryHandler(
            $('#create-resource-footer-dropdown')
        )
    );

    function generateCreateNewStoryHandler($dropdownElement) {

        return function() {

            if (window.hasOwnProperty('blist') &&
                window.blist.hasOwnProperty('configuration') &&
                window.blist.configuration.hasOwnProperty('appToken')) {

                function onError(xhr, textStatus, error) {

                    $dropdownElement.removeClass('working');

                    alert('Oh no! There’s been a problem. Please try again.');
                }

                function onSuccess(data, textStatus, xhr) {

                    function validate4x4(testString) {

                        var valid = false;
                        var pattern = window.blist.util.patterns.UID;

                        if (pattern) {
                            valid = testString.match(pattern) !== null;
                        }

                        return valid;
                    }

                    if (data.hasOwnProperty('id') && validate4x4(data.id)) {
                        // This is the second phase of the creation action,
                        // and this endpoint is responsible for removing the
                        // '"initialized": false' flag (or setting it to true)
                        // when it succeeds at creating the new story objects
                        // in Storyteller's datastore.
                        //
                        // This isn't perfect but it should (hopefully) be
                        // reliable enough that users will not totally fail to
                        // create stories when they intend to do so.
                        window.location.href = '/stories/s/' + data.id + '/create';
                    } else {
                        onError(xhr, 'Invalid storyUid', 'Invalid storyUid');
                    }
                }

                var newStoryName = (
                    'Untitled Story - ' +
                    (new Date().format('m-d-Y'))
                );

                var newStoryData = {
                    name: newStoryName,
                    metadata: {
                        renderTypeConfig: {
                            visible: {
                                href: true
                            }
                        },
                        accessPoints: {
                            // This will be replaced with the actual resource
                            // url when the view metadata is updated by the Stories
                            // application.
                            story: 'https://www.socrata.com/'
                        },
                        availableDisplayTypes: ['story'],
                        jsonQuery: {},
                        // Since Storyteller has its own datastore, we will
                        // need to treat this asynchonously. Tagging the
                        // metadata with '"initialized": false' should at least
                        // allow us to understand how many of the two-phase
                        // story creation actions fail, and should also allow
                        // us to do some garbage collection down the road.
                        initialized: false
                    },
                    displayType: 'story',
                    displayFormat: {},
                    query: {}
                };

                var url = '/api/views.json';
                var settings = {
                    contentType: false,
                    data: JSON.stringify(newStoryData),
                    dataType: 'json',
                    error: onError,
                    headers: {
                        'Content-type': 'application/json',
                        'X-App-Token': blist.configuration.appToken
                    },
                    type: 'POST',
                    success: onSuccess
                };

                $dropdownElement.addClass('working');
                $.ajax(url, settings);
            }
        }
    }

});
