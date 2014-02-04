var widgetNS = blist.namespace.fetch('blist.widget');
var commonNS = blist.namespace.fetch('blist.common');
var configNS = blist.namespace.fetch('blist.configuration');

widgetNS.ready = false;

blist.widget.resizeViewport = function()
{
    widgetNS.$resizeContainer.fullScreen().adjustSize();

    if ($.browser.msie && ($.browser.majorVersion == 7))
    {
        // IE7 gets really confused when the toolbar is opening or closing.
        // Jiggering this class seems to help it.
        $('.mainMenu').toggleClass('open').toggleClass('open');
    }
};

blist.widget.searchToolbarShown = false;
blist.widget.showToolbar = function(sectionName, callback)
{
    var sectionClassLookup = {
        search: 'toolbarSearchForm',
        email: 'toolbarEmailForm',
        closePane: 'toolbarClosePaneBox',
        about: 'toolbarAboutBox'
    };
    var sectionClass = sectionClassLookup[sectionName];

    var $toolbar = $('.toolbar');

    var toolbarChanged = !$toolbar.hasClass(sectionName);
    $toolbar.removeClass().addClass('toolbar ' + sectionName);

    if (sectionName == 'search')
    { widgetNS.searchToolbarShown = true; }

    var maxAboutBoxHeight = $('.widgetContent').innerHeight() * 0.5;
    $('.toolbarAboutBox').css('max-height', maxAboutBoxHeight);

    var animateFinished = function()
    {
        widgetNS.resizeViewport();
        if (_.isFunction(callback)) { callback(); }
    };

    if (!$toolbar.is(':visible'))
    {
        // need to adjust height to fit about text
        if (sectionName == 'about')
        {
            $toolbar
                .show()
                .children().show();
            $toolbar
                .height(Math.min($toolbar.find('.toolbarAboutBox').outerHeight(true),
                    maxAboutBoxHeight))
                .hide();
        }
        else
        {
            $toolbar.height(20);
        }

        $toolbar.show('slide',
            { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') },
            500, animateFinished);
        $toolbar
            .children(':not(.close)').hide()
            .filter('.' + sectionClass).show();
    }
    else if (toolbarChanged)
    {
        // need to go back to the grid if we select something dangerous
        if (sectionName != 'closePane')
        {
            widgetNS.closePane();
        }

        // need to adjust height to fit about text
        if (sectionName == 'about')
        {
            var $aboutBox = $toolbar.find('.toolbarAboutBox');

            $aboutBox.show();
            $toolbar.animate({ height: Math.min($aboutBox.outerHeight(true), maxAboutBoxHeight) },
                500, animateFinished);
            $aboutBox.hide();
        }
        else
        {
            $toolbar.animate({ height: 20 }, 500, animateFinished);
        }
        $toolbar
            .children(':not(.close):visible').fadeOut('fast', function()
            {
                $toolbar.find('.' + sectionClass).fadeIn('fast');
            });
    }
};
blist.widget.hideToolbar = function()
{
    var $toolbar = $('.toolbar');

    if ($toolbar.hasClass('search'))
    {
        widgetNS.searchToolbarShown = false;
    }
    else if (widgetNS.searchToolbarShown)
    {
        widgetNS.showToolbar('search');
        return;
    }

    $toolbar
        .removeClass().addClass('toolbar')
        .hide(
            'slide',
            { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') },
            widgetNS.resizeViewport);
};

blist.widget.feedLoaded = false;
blist.widget.viewsLoaded = false;
// Additional actions for specific panes
blist.widget.paneHandlers = {
    embed: function()
    {
        $('#embed_code').focus().select();
    },

    feed: function()
    {
        if (widgetNS.feedLoaded) { return; }
        widgetNS.feedLoaded = true;

        // feed
        blist.dataset.getComments(function(comments)
        {
            $('.widgetContent_feed').append($.renderTemplate('feedList'));
            $('.widgetContent_feed .feed').feedList({
                bindCommentEvents: false,
                comments: comments
            });
        });
    },

    cellFeed: function(rowId, tcId)
    {
        blist.dataset.getComments(function(comments)
        {
            var $pane = $('.widgetContent_cellFeed');
            $pane.empty();
            $pane.append($.renderTemplate('feedList'));
            $pane.find('.feed').feedList({
                bindCommentEvents: false,
                comments: comments
            });
        }, rowId, tcId);
    },

    views: function()
    {
        if (widgetNS.viewsLoaded) { return; }
        widgetNS.viewsLoaded = true;

        // load more views
        blist.dataset.getRelatedViews(function(views)
        {
            var moreViews = _.reject(views, function(view)
            {
                return _.include(['blob', 'href'], view.type);
            });
            moreViews.sort(function(a, b) { return b.viewCount - a.viewCount });

            $('.widgetContent_views').append(
                $.renderTemplate(
                    'filtersTable',
                    moreViews,
                    {
                        'tbody .item': {
                            'filter<-': {
                                '.type .cellInner.icon': function(filter)
                                { return filter.item.displayName.capitalize(); },
                                '.type@title': function(filter)
                                { return filter.item.displayName.capitalize(); },
                                '.type@class+': function(filter)
                                { return ' type' + filter.item.styleClass; },

                                '.name a': 'filter.name!',
                                '.name a@title': 'filter.description!',
                                '.name a@href': 'filter.url',

                                '.viewed .cellInner': 'filter.viewCount',

                                '.picture a@href': function(filter) { return new User(filter.item.owner).getProfileUrl(); },
                                '.picture img@src': function(filter) { return filter.item.owner.profileImageUrlMedium ||
                                                                              '/images/small-profile.png'; },
                                '.picture img@alt': 'filter.owner.displayName!',
                                '.picture img@title': 'filter.owner.displayName!'
                            }
                        }
                    }));

            $('.widgetContent_views .name a').each(function()
            {
                var $this = $(this);
                if ($this.attr('title') === '')
                { return; }

                // This is returning with &nbsp;, so replace them all with
                // normal spaces
                $this.socrataTip({ message: ($this.attr('title') || '').clean(),
                    shrinkToFit: false, killTitle: true });
            });

            $('.widgetContent_views table.gridList').combinationList({
                headerContainerSelector: '.widgetContent_views .gridListWrapper',
                initialSort: [[2, 1]],
                scrollableBody: false,
                selectable: false,
                sortGrouping: false,
                sortHeaders: {0: {sorter: 'text'}, 1: {sorter: 'text'},
                    2: {sorter: 'digit'}, 3: {sorter: false}}
            });
        });
    }
};

blist.widget.showPane = function(paneName, paneText, paneColor, paneData)
{
    if ($('.widgetContent_' + paneName).is(':visible')) { return; }

    $('.widgetContent > :visible:first').fadeOut(200,
        function()
        {
            $('.widgetContent_' + paneName).fadeIn(200);

            // set up close pane
            if (!$.isBlank(paneText))
            { $('.toolbarClosePaneName').text(paneText); }
            widgetNS.showToolbar('closePane');
            if (!$.isBlank(paneColor))
            { $('.toolbar').animate({'background-color': paneColor}); }

            // call any custom handlers
            if (_.isFunction(widgetNS.paneHandlers[paneName]))
            { widgetNS.paneHandlers[paneName].apply(this, paneData || []); }
        });

    $.analytics.trackEvent('widget (v2)', 'pane shown: ' + paneName,
        document.referrer);
};

blist.widget.closePane = function()
{
    // get the color from the subHeaderBar in case we're in the publisher
    // and it has changed.
    $('.toolbar')
        .animate({ 'background-color': $('.subHeaderBar').css('background-color') },
            function()
            {
                $(this).css('background-color', '');
            });
    widgetNS.showDataView();
};

blist.widget.flashToolbarMessage = function($messageElem, message, onDisplay)
{
    $messageElem
        .text(message)
        .slideDown(function()
        {
            if (typeof onDisplay == 'function')
            {
                onDisplay();
            }
            setTimeout(function()
            {
                $messageElem.slideUp();
            }, 5000);
        });
};

blist.widget.showDataView = function()
{
    if ($('.widgetContentGrid').is(':visible'))
    { return; }

    $('.widgetContent > :visible:first').fadeOut(200,
        function()
        {
            $('.widgetContentGrid').fadeIn(200);
            widgetNS.resizeViewport();
        });
};


(function($)
{
    if (!blist.dataset.valid) { $('body').addClass('invalidView'); }

})(jQuery);

$(function()
{
    blist.dataset.setAccessType('WIDGET');

    // keep track of some stuff for easy access
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];
    widgetNS.isTabular = _.include(['tabular', 'geo'], blist.dataset.viewType);
    widgetNS.interstitial = widgetNS.theme['behavior']['interstitial'];

    // sizing
    widgetNS.$resizeContainer = $('.widgetContent');
    widgetNS.$resizeContainer.fullScreen();

    // controls
    $('select, input:checkbox, input:radio:not(.noUniform), input:file').uniform();

    // menus
    var menuOptions     = widgetNS.theme['menu']['options'],
        enabledModules  = widgetNS.enabledModules;
    if (_.any(menuOptions))
    {
        $('.mainMenu').menu({
            additionalDataKeys: [ 'targetPane', 'iconColor' ],
            menuButtonTitle: 'Access additional information about this dataset.',
            menuButtonClass: 'mainMenuButton ' + ((widgetNS.orientation == 'downwards') ? 'upArrow' : 'downArrow'),
            contents: [
                { text: 'More Views', className: 'views', targetPane: 'views',
                    subtext: 'Filters, Charts, and Maps', href: '#views',
                    iconColor: '#57b6dd', onlyIf: widgetNS.isTabular && menuOptions['more_views'] },
                { text: 'Download', className: 'downloads', targetPane: 'downloads',
                    subtext: 'Download in various formats', href: '#downloads',
                    iconColor: '#959595', onlyIf: widgetNS.isTabular && menuOptions['downloads'] },
                { text: 'Discuss', className: 'comments', targetPane: 'feed',
                    subtext: 'Discuss this Dataset', href: '#comments',
                    iconColor: '#bed62b', onlyIf: menuOptions['comments'] && enabledModules['allow_comments'] == true },
                { text: 'Embed', className: 'embed', targetPane: 'embed',
                    subtext: 'Embed this player on your site', href: '#embed',
                    iconColor: '#e44044', onlyIf: menuOptions['embed'] },
                { text: 'API', className: 'api', targetPane: 'api',
                    subtext: 'Access this Dataset via SODA', href: '#api',
                    iconColor: '#f93f06', onlyIf: widgetNS.isTabular && menuOptions['api'] },
                { text: 'OData', className: 'api', targetPane: 'odata',
                    subtext: 'Access this Dataset via OData', href: '#odata',
                    iconColor: '#f93f06', onlyIf: widgetNS.isTabular && menuOptions['odata'] },
                { text: 'Print', className: 'print', targetPane: 'print',
                    subtext: 'Print this dataset', href: '#print',
                    iconColor: '#a460c4', onlyIf: blist.dataset.isTabular() && menuOptions['print'] },
                { text: 'About the Socrata Open Data Platform', className: 'about',
                    href: 'http://www.socrata.com/', rel: 'external',
                    onlyIf: menuOptions['about_sdp'] }
            ],
            onOpen: function()
            {
                $.analytics.trackEvent('widget (v2)', 'main menu opened', document.referrer);
            }
        });
        if (menuOptions['about_sdp'])
        { $('.mainMenu .menuColumns').addClass('hasAbout'); }
    }

    $('.mainMenu .menuDropdown a').click(function(event)
    {
        var $this = $(this);

        var target = $this.attr('data-targetPane');

        if ($.isBlank(target))
        {
            // bail; this is a real link
            return;
        }

        event.preventDefault();
        widgetNS.showPane(target, $this.find('.contents').text(),
            $this.attr('data-iconColor'));
        if (!$('.widgetContent_' + target).is(':visible'))
        {
            $.analytics.trackEvent('widget (v2)', 'menu item clicked: ' +
                $this.attr('href'), document.referrer);
        }
    });

    blist.datasetControls.hookUpShareMenu(blist.dataset,
        $('.subHeaderBar .share .shareMenu'),
        {
            menuButtonClass: 'icon',
            onOpen: function()
            {
                $.analytics.trackEvent('widget (v2)', 'share menu opened', document.referrer);
            }
        });

    // Hook up search form
    var $searchForm = $('.toolbar .toolbarSearchForm');

    $searchForm.submit(function (e)
    {
        e.preventDefault();
        var searchText = $(e.currentTarget).find(':input').val();
        blist.dataset.update({searchString: searchText});
    });

    if (!$.isBlank(blist.dataset.searchString))
    {
        widgetNS.showToolbar('search', function()
            { $searchForm.find(':input').focus()
                .val(blist.dataset.searchString).blur(); });
    }

    // toolbar
    var $toolbar = $('.toolbar');
    $('.toolbar .close').click(function(event)
    {
        event.preventDefault();
        if ($toolbar.hasClass('search'))
        {
            $searchForm.find(':input').val('').blur();
            blist.dataset.update({searchString: null});
        }

        if ($toolbar.hasClass('closePane'))
        {
            widgetNS.closePane();
        }

        widgetNS.hideToolbar();
    });
    $('.subHeaderBar .about a').click(function(event)
    {
        event.preventDefault();
        if ($toolbar.hasClass('about') && $toolbar.is(':visible'))
        {
            widgetNS.hideToolbar();
        }
        else
        {
            widgetNS.showToolbar('about');
        }
    });
    $('.subHeaderBar .search a')
        .click(function(event)
        {
            event.preventDefault();
            if ($toolbar.hasClass('search') && $toolbar.is(':visible'))
            {
                widgetNS.hideToolbar();
            }
            else
            {
                widgetNS.showToolbar('search');
            }
        });
    $('.shareMenu .email a').click(function(event)
    {
        if ($toolbar.hasClass('email') && $toolbar.is(':visible'))
        {
            $('.toolbarEmailForm .toolbarTextbox').effect('pulsate', { times: 2 });
        }
        else
        {
            widgetNS.showToolbar('email');
        }
    });
    var emailRequestComplete = function(emails)
    {
        if (emails.length > 0)
        {
            widgetNS.flashToolbarMessage(
                $('.toolbarEmailForm .toolbarMessage'),
                'Some of your emails could not be sent. Please verify the addresses and try again.',
                function()
                {
                    $('.toolbarEmailForm .toolbarTextbox')
                        .val(emails.join(', '))
                        .attr('disabled', false)
                        .css('background-color', null) // for firefox/webkit
                        .css('background-color', widgetNS.theme.toolbar.input_color); // for ie
                }
            );
        }
        else
        {
            widgetNS.flashToolbarMessage(
                $('.toolbarEmailForm .toolbarMessage'),
                'Your emails were sent successfully.',
                function()
                {
                    $('.toolbarEmailForm .toolbarTextbox')
                        .val('')
                        .blur()
                        .attr('disabled', false)
                        .css('background-color', null) // for firefox/webkit
                        .css('background-color', widgetNS.theme.toolbar.input_color); // for ie
                }
            );
        }
    };
    // force clear textbox; it acts weird on refresh because it thinks you've changed it
    $('.toolbarEmailForm .toolbarTextbox, .toolbarSearchForm .toolbarTextbox').val('').blur();

    $('.toolbar .toolbarEmailForm').submit(function(event)
    {
        event.preventDefault();

        var $form = $(this);
        var $emailTextbox = $('.toolbarEmailForm .toolbarTextbox');

        var emails = $.trim($emailTextbox.val());
        emails = emails.split(/[, ]+/);

        var completed = 0;
        var totalRequests = emails.length;
        _.each(emails, function(email)
        {
            $.ajax({
                url: $form.attr('action'),
                cache: false,
                type: 'POST',
                dataType: 'json', contentType: 'application/json',
                data: JSON.stringify({recipient: email}),
                success: function (responseData)
                {
                    if ($.isBlank(responseData) || responseData['error'] === undefined)
                    {
                        emails = _.without(emails, email);
                    }
                    if (++completed == totalRequests)
                    {
                        emailRequestComplete(emails);
                    }
                },
                error: function (request, status, error)
                {
                    if (++completed == totalRequests)
                    {
                        emailRequestComplete(emails);
                    }
                }
              });
          });
          $emailTextbox
            .attr('disabled', true)
            .animate({ 'background-color': '#cdc9b7' });
    });

    $('.toolbarAboutBox .datasetAverageRating').stars({
        onChange: function()
        {
            $('.actionInterstitial').jqmShow()
                .find('.actionPhrase').text('rate this dataset');
        }
    });

    $('.viewError').text(blist.dataset.invalidMessage());

    // Initialize all data rendering (but page is handled separately)
    blist.$container.renderTypeManager({view: blist.dataset,
        editEnabled: false,
        table: {
            columnHideEnabled: false,
            showRowNumbers: widgetNS.theme['grid']['row_numbers'],
            showRowHandle: widgetNS.theme['grid']['row_numbers'],
            manualResize: true,
            cellCommentsCallback: !blist.widget.enabledModules.cell_comments ? null : function(rowId, tcId)
            {
                widgetNS.showPane('cellFeed', 'Comments for row ' +
                        (blist.dataset.rowForID(rowId).index + 1) + ', column ' +
                        $.htmlEscape(blist.dataset.columnForTCID(tcId).name),
                        '#bed62b', [rowId, tcId]);
            }
        }
    });
    var $dataGrid = blist.$container.renderTypeManager().$domForType('table');

    blist.$container.bind('render_type_hidden', function(e, oldType)
    {
        if (_.isEmpty(blist.$container.renderTypeManager().visibleTypes))
        {
            _.each(blist.dataset.metadata.renderTypeConfig.visible, function(v, t)
                { if (v) { blist.$container.renderTypeManager().show(t); } });
        }
    });

    $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId, updateOnly)
    {
        var uid;
        if (typeof rowId == 'string' && rowId.indexOf('/') > -1)
        { var splitRowId = rowId.split('/'); uid = splitRowId[0]; rowId = splitRowId[1]; }

        var curId = $.deepGet(blist.dataset.metadata.renderTypeConfig, 'active', 'page', 'id');
        var sameDS = curId == uid || $.isBlank(curId) && uid == blist.dataset.id;
        if (!updateOnly || (blist.dataset.metadata.renderTypeConfig.visible.page && !sameDS))
        {
            blist.$container.renderTypeManager().setTypeConfig('page', {defaultRowId: rowId});
            blist.dataset.showRenderType('page', uid, !sameDS);
        }
    });


    // downloads
    $('.widgetContent_downloads').append(
        $.renderTemplate(
            'downloadsSectionContent',
            { downloadTypes: $.templates.downloadsTable.downloadTypes.normal,
              view: blist.dataset },
            $.templates.downloadsTable.directive.normal));
    $.templates.downloadsTable.postRender($('.widgetContent_downloads'));

    $.live('.feed .commentActions a, .feedNewCommentButton', 'click', function(event)
    {
        event.preventDefault();

        // display an appropriate interstitial for each action
        var message = 'do that';
        var $this = $(this);

        if ($this.is('.commentInappropriateLink:not(.disabled)'))
            message = 'report a comment';
        else if ($this.is('.commentRateUpLink:not(.ratedUp), .commentRateDownLink:not(.ratedDown)'))
            message = 'rate a comment';
        else if ($this.is('.commentReplyLink'))
            message = 'reply to a comment';
        else if ($this.is('.feedNewCommentButton'))
            message = 'add a comment';

        $('.actionInterstitial').jqmShow()
            .find('.actionPhrase').text(message);
    });

    $.live('a.feedActor, #aboutSection a', 'focus mouseover', function()
    {
        // pretend these are rel="external"
        $(this).attr('target', '_blank');
    });

    // embed
    $('.widgetContent_embed .embedForm').embedForm();

    // print
    $('.widgetContent_print form .submit').click(function(event)
    {
        event.preventDefault();
        $(this).closest('form').submit();
    });

    $('.widgetContent_print .close').click(function(event)
    {
        event.preventDefault();
        widgetNS.closePane();
        widgetNS.hideToolbar();
    });

    // Trigger interstitial if necessary
    if (!$.isBlank(document.referrer))
    { $('.leavingInterstitial').find('.serverName').text(
            document.referrer.replace(/(ht|f)tps?:\/\/(www\.)?/, '').replace(/\/.*$/, '')); }

    $.live('a:not([href^=#]):not(.noInterstitial):not([rel$="modal"])', 'click', function(event)
    {
        if (widgetNS.interstitial === true)
        {
            event.preventDefault();

            var href = $(this).attr('href');
            // IE sticks the full URL in the href, so we didn't filter out local URLs
            if ($.isBlank(href) || (href.indexOf(location) == 0))
            {
                return;
            }
            if (href.slice(0, 1) == '/')
            {
                href = location.host + href;
            }
            if (!href.match(/^(f|ht)tps?:\/\//))
            {
                href = location.protocol + "//" + href;
            }

            var $modal = $('.leavingInterstitial');
            $modal.find('.leavingLink')
                      .attr('href', href)
                      .text(href);
            $modal.find('.accept.button')
                      .attr('href', href);
            $modal.jqmShow();
        }
    });

    $('.needsInlineView').data('dataset', blist.dataset).bind('submit', commonNS.formInliner);

    $('.downloadsList .item .type a').downloadToFormCatcher(blist.dataset);

    // Notify publisher that we are ready
    widgetNS.ready = true;

    // Make adjustments for mobile
    if ($.device.iphone || $.device.android)
    {
        // supposedly scroll past address bar in webkit mobile
        _.defer(function() { window.scrollTo(0, 1); });

        // show the mobile site notice
        $dataGrid.bind('dataset_ready', function()
        {
            $('.mobileNotice').fadeIn();
            setTimeout(function()
            {
                $('.mobileNotice').fadeOut();
            }, 10000);
        });

        // if they choose fullscreen from the widget, make sure it doesn't redir back here
        $('.subHeaderAction.fullscreen a').attr('href',
            $('.subHeaderAction.fullscreen a').attr('href') + '?no_mobile=true');

        // essentially, disable scrolling of the main container
        $(document).bind('touchmove', function(event)
        {
            event.originalEvent.preventDefault();
        });
    }

    _.defer(function()
    {
        // Report we've opened for metrics
        blist.dataset.registerOpening(document.referrer);

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('widget (v2)', 'page loaded', document.referrer);
    });

    if (widgetNS.showPrivateMessage === true)
    {
        $('.privateDataset').jqmShow();
    }
});


// HACKETY HACK!
//  IE refuses to acknowledge dynamically written background-images.
//  I'm cutting my losses here and just adding a bad hack.

blist.widget.ghettoMenuButtonImages = {
    normal: '',
    hover: ''
};
blist.widget.ghettoHoverHookAdded = false;
blist.widget.addGhettoHoverHook = function()
{
    if (widgetNS.ghettoHoverHookAdded)
    { return; }

    $('.mainMenuButton').hover(function()
    {
        $(this).css('background-image', widgetNS.ghettoMenuButtonImages.hover);
    }, function()
    {
        $(this).css('background-image', widgetNS.ghettoMenuButtonImages.normal);
    });

    widgetNS.ghettoHoverHookAdded = true;
};

blist.widget.setGhettoButtonImage = function(image, src)
{
    widgetNS.ghettoMenuButtonImages[image] = src;

    if (image == 'normal')
    { $('.mainMenuButton').css('background-image', widgetNS.ghettoMenuButtonImages.normal); }
};

// END HACK
