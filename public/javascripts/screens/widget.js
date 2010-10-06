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
blist.widget.showToolbar = function(sectionName)
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
            500, widgetNS.resizeViewport);
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
                500, widgetNS.resizeViewport);
            $aboutBox.hide();
        }
        else
        {
            $toolbar.animate({ height: 20 }, 500, widgetNS.resizeViewport);
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

// Additional actions for specific panes
blist.widget.paneHandlers = {
    embed: function()
    {
        $('#embed_code').focus().select();
    }
};

blist.widget.showPane = function(paneName, paneText, paneColor)
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
            { widgetNS.paneHandlers[paneName](); }
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
    if (!$.isBlank($.uploadDialog)) { $.uploadDialog.version = 2; }

    // keep track of some stuff for easy access
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];
    widgetNS.isNonTabular = (blist.dataset.viewType !== 'tabular');
    widgetNS.isBlobby = (blist.dataset.viewType == 'blobby');
    widgetNS.interstitial = widgetNS.theme['behavior']['interstitial'];

    // sizing
    widgetNS.$resizeContainer = $('.widgetContent');
    widgetNS.$resizeContainer.fullScreen();

    // controls
    $('select, input:checkbox, input:radio, input:file').uniform();

    // menus
    var menuOptions = widgetNS.theme['menu']['options'];
    if (_.any(menuOptions))
    {
        $('.mainMenu').menu({
            additionalDataKeys: [ 'targetPane', 'iconColor' ],
            menuButtonTitle: 'Access additional information about this dataset.',
            menuButtonClass: 'mainMenuButton ' + ((widgetNS.orientation == 'downwards') ? 'upArrow' : 'downArrow'),
            contents: [
                { text: 'More Views', className: 'views', targetPane: 'views',
                    subtext: 'Filters, Charts, and Maps', href: '#views',
                    iconColor: '#57b6dd', onlyIf: !widgetNS.isBlobby && menuOptions['more_views'] },
                { text: 'Download', className: 'downloads', targetPane: 'downloads',
                    subtext: 'Download in various formats', href: '#downloads',
                    iconColor: '#959595', onlyIf: !widgetNS.isNonTabular && menuOptions['downloads'] },
                { text: 'Comments', className: 'comments', targetPane: 'comments',
                    subtext: 'Read comments on this dataset', href: '#comments',
                    iconColor: '#bed62b', onlyIf: menuOptions['comments'] },
                { text: 'Embed', className: 'embed', targetPane: 'embed',
                    subtext: 'Embed this player on your site', href: '#embed',
                    iconColor: '#e44044', onlyIf: menuOptions['embed'] },
                { text: 'API', className: 'api', targetPane: 'api',
                    subtext: 'Access this Dataset via SODA', href: '#api',
                    iconColor: '#f93f06', onlyIf: !widgetNS.isBlobby && menuOptions['api'] },
                { text: 'Print', className: 'print', targetPane: 'print',
                    subtext: 'Print this dataset', href: '#print',
                    iconColor: '#a460c4', onlyIf: blist.dataset.isGrid() && menuOptions['print'] },
                { text: 'About the Socrata Social Data Player', className: 'about',
                    href: 'http://www.socrata.com/try-it-free', rel: 'external',
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

    // toolbar
    var $toolbar = $('.toolbar');
    $('.toolbar .close').click(function(event)
    {
        if ($toolbar.hasClass('search'))
        {
            $dataGrid.datasetGrid().clearFilterInput(event);
        }
        else
        {
            // default has already been prevented for search
            event.preventDefault();
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
                data: {
                    'method': 'email',
                    'email': email
                },
                success: function (responseData)
                {
                    if (responseData['error'] === undefined)
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
            return false;
        },
        starMargin: 1,
        starWidth: 10,
        value: blist.dataset.averageRating || 0
    });

    // grid
    var $dataGrid = $('#data-grid');
    if (blist.dataset.isGrid())
    {
        if ($dataGrid.length > 0)
        {
            $dataGrid
                .datasetGrid({view: blist.dataset,
                    accessType: 'WIDGET',
                    showRowNumbers: widgetNS.theme['grid']['row_numbers'],
                    showRowHandle: widgetNS.theme['grid']['row_numbers'],
                    editEnabled: false,
                    manualResize: true,
                    columnNameEdit: false,
                    filterForm: '.toolbar .toolbarSearchForm',
                    autoHideClearFilterItem: false
                });
        }
    }

    // Page render type
    $('#pageRenderType').pageRenderType({ view: blist.dataset });
    $(document).bind(blist.events.DISPLAY_ROW, function()
            { widgetNS.showPane('pageRenderType', 'Row View'); });


    // more views
    var moreViews = [];
    blist.dataset.getRelatedViews(function(views)
        {
            moreViews = _.reject(views, function(view)
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
                $this.socrataTip({ message: $this.attr('title').clean(),
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

    // downloads
    $('.widgetContent_downloads').append(
        $.renderTemplate(
            'downloadsTable',
            { downloadTypes: $.templates.downloadsTable.downloadTypes,
              viewId: blist.dataset.id },
            $.templates.downloadsTable.directive));
    $.templates.downloadsTable.postRender($('.widgetContent_downloads'));

    // comments

    // TODO: maybe refactor these into one?
    var repliesDirective = {
        '.@data-commentid': 'reply.id',

        '.replyAuthor img@src':
            function(reply) { return reply.item.user.profileImageUrlMedium ||
                                       '/images/large-profile.png'; },
        '.replyAuthor img@alt': 'reply.user.displayName!',
        '.replyAuthor a@href':
            function(reply) { return new User(reply.item.user).getProfileUrl(); },

        '.replyContainer .replyBody .replyAuthorName': 'reply.user.displayName!',
        '.replyContainer .replyBody .replyAuthorName@href':
            function(reply) { return new User(reply.item.user).getProfileUrl(); },
        '.replyContainer .replyBody .replyTitle': 'reply.title!',
        '.replyContainer .replyBody+': 'reply.body!',

        '.replyContainer .replyActions .timestamp':
            function(reply) { return blist.util.humaneDate.getFromDate(new Date(reply.item.createdAt * 1000)); },
        '.replyContainer .replyActions .positiveRatings':
            function(reply) { return (reply.item.upRatings > 0) ? ('+' + reply.item.upRatings) : ''; },
        '.replyContainer .replyActions .negativeRatings':
            function(reply) { return (reply.item.downRatings > 0) ? ('-' + reply.item.downRatings) : ''; },
        '.replyContainer .replyActions .rateUp@class+':
            function(reply) { return (!_.isUndefined(reply.item.currentUserRating) &&
                                       reply.item.currentUserRating.thumbUp === true) ? ' ratedUp' : ''; },
        '.replyContainer .replyActions .rateDown@class+':
            function(reply) { return (!_.isUndefined(reply.item.currentUserRating) &&
                                       reply.item.currentUserRating.thumbUp === false) ? ' ratedDown' : ''; }
    };
    var commentsDirective = {
        '.commentList': {
            'comment<-': {
                '.@data-commentid': 'comment.id',

                '.commentAuthor img@src':
                    function(comment) { return comment.item.user.profileImageUrlMedium ||
                                               '/images/large-profile.png'; },
                '.commentAuthor img@alt': 'comment.user.displayName!',
                '.commentAuthor a@href':
                    function(comment) { return new User(comment.item.user).getProfileUrl(); },

                '.commentContainer .commentBody .commentAuthorName': 'comment.user.displayName!',
                '.commentContainer .commentBody .commentAuthorName@href':
                    function(comment) { return new User(comment.item.user).getProfileUrl(); },
                '.commentContainer .commentBody .commentTitle': 'comment.title!',
                '.commentContainer .commentBody+': 'comment.body!',

                '.commentContainer .commentActions .timestamp':
                    function(comment) { return blist.util.humaneDate.getFromDate(new Date(comment.item.createdAt * 1000)); },
                '.commentContainer .commentActions .positiveRatings':
                    function(comment) { return (comment.item.upRatings > 0) ? ('+' + comment.item.upRatings) : ''; },
                '.commentContainer .commentActions .negativeRatings':
                    function(comment) { return (comment.item.downRatings > 0) ? ('-' + comment.item.downRatings) : ''; },
                '.commentContainer .commentActions .rateUp@class+':
                    function(comment) { return (!_.isUndefined(comment.item.currentUserRating) &&
                                               comment.item.currentUserRating.thumbUp === true) ? ' ratedUp' : ''; },
               '.commentContainer .commentActions .rateDown@class+':
                   function(comment) { return (!_.isUndefined(comment.item.currentUserRating) &&
                                              comment.item.currentUserRating.thumbUp === false) ? ' ratedDown' : ''; },

                '.commentContainer .replyViewAllLink':
                    'View all #{comment.item.childCount} replies',
                '.commentContainer .replyViewAllLink@class+':
                    function(comment) { return (comment.item.childCount < 4) ? ' hide' : ''; },

                '.commentContainer .replyWrapper .replyList': {
                    'reply<-comment.children': repliesDirective
                },

                '.commentContainer .replyWrapper@class+':
                    function(comment) { return (comment.item.childCount === 0) ? ' hide' : ''; }
            }
        }
    };

    var allComments = [];
    var allCommentsCount = 0;
    var shownCommentCount = 0;
    var trimmedComments = [];

    var showMoreComments = function()
    {
        $('.widgetContent_comments .commentsWrapper').append(
            $.renderTemplate(
                'comments',
                trimmedComments.slice(shownCommentCount, shownCommentCount + 10),
                commentsDirective));

        shownCommentCount += 10;
        if (shownCommentCount >= allCommentsCount)
        {
            $('.commentsViewMoreLink').hide();
        }
        else if ((allCommentsCount - shownCommentCount) == 1)
        {
            $('.commentsViewMoreLink').text('Show last comment');
        }
        else
        {
            $('.commentsViewMoreLink').text('Next ' +
                Math.min(10, allCommentsCount - shownCommentCount) + ' comments');
        }
    };

    blist.dataset.getComments(function (responseData)
        {
            allComments = _.reject(responseData, function(comment)
            {
                return $.isBlank(comment.title) && $.isBlank(comment.body);
            });
            allCommentsCount = allComments.length;

            if (allCommentsCount === 0)
            {
                $('.widgetContent_comments .commentsWrapper').append(
                    $.tag({ tagName: 'p', 'class': 'emptyDataText',
                        contents: 'No one has posted any comments yet.' }));
            }
            else
            {
                trimmedComments = _.map(allComments, function(comment)
                {
                    var trimmedComment = $.extend({}, comment);
                    if (!_.isUndefined(comment.children) && (comment.children.length > 3))
                    {
                        trimmedComment.children = comment.children.slice(0, 3);
                    }
                    trimmedComment.childCount = (_.isUndefined(comment.children) ? 0 : comment.children.length);
                    return trimmedComment;
                });

                showMoreComments();                
            }
        });
    $('.commentsViewMoreLink').click(function(event)
    {
        event.preventDefault();
        showMoreComments();
    });
    $.live('.widgetContent_comments .replyViewAllLink', 'click', function(event)
    {
        event.preventDefault();

        var $this = $(this);
        var $commentList = $this.closest('.commentList');

        var commentId = parseInt($commentList.attr('data-commentid'));
        var commentObj = _.detect(allComments, function(comment)
        {
            return comment.id === commentId;
        });

        $commentList.find('.replyWrapper').append(
            $.renderTemplate(
                'comments .replyWrapper', // TODO: This is kind of a hack. Rethink with rest of refactor.
                commentObj.children.slice(3),
                {
                    '.replyList': {
                        'reply<-': repliesDirective
                    }
                }));

        $this.remove();
    });
    $.live('.widgetContent_comments .commentActions a,' +
           '.widgetContent_comments .replyActions a', 'click',
        function (event)
        {
            event.preventDefault();
            var message = 'do that';
            var $listItem = $(this).closest('li');
            if ($listItem.hasClass('actionReply'))
                message = 'reply to this comment';
            else if ($listItem.hasClass('actionInappropriate'))
                message = 'flag this comment';
            else if ($listItem.hasClass('rateUp') || $listItem.hasClass('rateDown'))
                message = 'rate this comment';
            $('.actionInterstitial').jqmShow()
                .find('.actionPhrase').text(message);
        });
    $.live('.widgetContent_comments .addCommentButton', 'click',
        function(event)
        {
            event.preventDefault();
            $('.actionInterstitial').jqmShow()
                .find('.actionPhrase').text('leave a comment');
        });

    // embed
    $('.widgetContent_embed .embedForm').embedForm();

    // print
    // TODO: maybe make this generic?
    $('.widgetContent_print form input[type=image]')
        .replaceWith(
            $.tag({ tagName: 'a', href: '#submit', 'class': ['button', 'submit'],
                    contents: [
                        { tagName: 'span', 'class': 'left' },
                        { tagName: 'span', 'class': 'icon' },
                        'Print'
                    ]})
                .click(function(event)
                {
                    event.preventDefault();
                    $(this).closest('form').submit();
                }));

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
                href = "http://" + href;
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

    $('.needsInlineView').bind('submit', commonNS.formInliner);

    $('.downloadsList .item .type a').downloadToFormCatcher();

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

        // essentially, disable scrolling of the main container
        $(document).bind('touchmove', function(event)
        {
            event.originalEvent.preventDefault();
        });
    }

    _.defer(function()
    {
        // Report we've opened for metrics
        blist.dataset.registerOpening('WIDGET', document.referrer);

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('widget (v2)', 'page loaded', document.referrer);
    });
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
