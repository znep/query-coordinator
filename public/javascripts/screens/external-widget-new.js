var widgetNS = blist.namespace.fetch('blist.widget');
var commonNS = blist.namespace.fetch('blist.common');
var configNS = blist.namespace.fetch('blist.configuration');

widgetNS.ready = false;

blist.widget.hideToolbar = function()
{
    $('.toolbar')
        .removeClass().addClass('toolbar')
        .hide(
            'slide',
            { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') },
            function() { widgetNS.$resizeContainer.fullScreen().adjustSize(); });
};

blist.widget.showToolbar = function(sectionName, sectionClass)
{
    var $toolbar = $('.toolbar');

    var toolbarChanged = !$toolbar.hasClass(sectionName);
    $toolbar.removeClass().addClass('toolbar ' + sectionName);

    if (!$toolbar.is(':visible'))
    {
        $toolbar.show('slide', { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') });
        $toolbar
            .children(':not(.close)').hide()
            .filter('.' + sectionClass).show();
        widgetNS.$resizeContainer.fullScreen().adjustSize();
    }
    else if (toolbarChanged)
    {
        $toolbar
            .children(':not(.close):visible').fadeOut('fast', function()
            {
                $toolbar.find('.' + sectionClass).fadeIn('fast');
            });
    }
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
            widgetNS.$resizeContainer.fullScreen().adjustSize();
        });
};

$(function()
{
    // keep track of some stuff for easy access
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];
    widgetNS.isBlobby = (widgetNS.view.viewType === 'blobby');
    widgetNS.interstitial = widgetNS.theme['behavior']['interstitial'];

    // sizing
    widgetNS.$resizeContainer = $('.widgetContent');
    widgetNS.$resizeContainer.fullScreen();

    // generic events
    $.live('a[rel$=external]', 'focus', function(event)
    {
        this.target = '_blank';
    });
    $.live('a[rel$=external]', 'mouseover', function(event)
    {
        this.target = '_blank';
    });

    // controls
    $('select, input:checkbox, input:radio, input:file').uniform();

    // menus
    var menuOptions = widgetNS.theme['menu']['options'];
    $('.mainMenu').menu({
        attached: false,
        menuButtonTitle: 'Access additional information about this dataset.',
        menuButtonClass: 'mainMenuButton ' + ((widgetNS.orientation == 'downwards') ? 'upArrow' : 'downArrow'),
        contents: [
            { text: 'More Views', className: 'views',
                subtext: 'Filters, Charts, and Maps', href: '#views',
                onlyIf: menuOptions['more_views'] },
            { text: 'Download', className: 'downloads',
                subtext: 'Download in various formats', href: '#downloads',
                onlyIf: !widgetNS.isBlobby && menuOptions['downloads'] },
            { text: 'Comments', className: 'comments',
                subtext: 'Read comments on this dataset', href: '#comments',
                onlyIf: menuOptions['comments'] },
            { text: 'Embed', className: 'embed',
                subtext: 'Embed this player on your site', href: '#embed',
                onlyIf: menuOptions['embed'] },
            { text: 'Print', className: 'print',
                subtext: 'Print this dataset', href: '#print',
                onlyIf: !widgetNS.isBlobby && menuOptions['print'] },
            { text: 'About the Socrata Social Data Player', className: 'about',
                href: 'http://www.socrata.com/try-it-free', rel: 'external',
                onlyIf: menuOptions['about_sdp'] },
            { text: 'Access this Dataset via the API',
                // HACK: replace back with api + about when we drop IE6
                className: menuOptions['about_sdp'] ? 'api apiAfterAbout' : 'api',
                href: '/api/docs', rel: 'external',
                onlyIf: menuOptions['api'] }
        ]
    });

    // Additional actions for specific panes
    var paneHandlers = {
        embed: function()
        {
            $('#embed_code').focus().select();
        }
    };

    $('.mainMenu .menuDropdown a').click(function(event)
    {
        if ($(this).attr('rel') == 'external')
        {
            // bail; this is a real link
            return;
        }

        event.preventDefault();
        var target = $(this).closest('li').attr('class').split(' ')[1];
        if (!$('.widgetContent_' + target).is(':visible'))
        {
            $('.widgetContent > :visible:first').fadeOut(200,
                function()
                {
                    $('.widgetContent_' + target).fadeIn(200);

                    if (_.isFunction(paneHandlers[target]))
                    { paneHandlers[target](); }
                });
        }
    });

    blist.dataset.controls.hookUpShareMenu(widgetNS.view,
        $('.subHeaderBar .share .shareMenu'),
        { menuButtonClass: 'icon' });

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
        widgetNS.hideToolbar();
    });
    var handleSearchToggle = function(allowHide)
    {
        if (allowHide && $toolbar.hasClass('search') && $toolbar.is(':visible'))
        {
            widgetNS.hideToolbar();
        }
        else
        {
            widgetNS.showDataView();
            widgetNS.showToolbar('search', 'toolbarSearchForm');
        }
    };
    $('.subHeaderBar .search a')
        .click(function(event)
        {
            event.preventDefault();
            handleSearchToggle(true);
        })
        .mouseover(function(event)
        {
            handleSearchToggle(false);
        });
    $('.shareMenu .email a').click(function(event)
    {
        if ($toolbar.hasClass('email') && $toolbar.is(':visible'))
        {
            $('.toolbarEmailForm .toolbarTextbox').effect('pulsate', { times: 2 });
        }
        else
        {
            widgetNS.showToolbar('email', 'toolbarEmailForm');
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

    // grid
    var $dataGrid = $('#data-grid');
    if (!widgetNS.isAltView)
    {
        if ($dataGrid.length > 0)
        {
            $dataGrid
                .bind('full_load',
                    function(){ $('#header .headerBar').removeClass('hide'); })
                .datasetGrid({viewId: widgetNS.viewId,
                    accessType: 'WIDGET',
                    showRowNumbers: widgetNS.theme['grid']['row_numbers'],
                    showRowHandle: widgetNS.theme['grid']['row_numbers'],
                    editEnabled: false,
                    manualResize: true,
                    columnNameEdit: false,
                    filterForm: '.toolbar .toolbarSearchForm',
                    autoHideClearFilterItem: false,
                    initialResponse: $.unescapeObject(widgetNS.viewJson)
                });
        }
    }
    else if (blist.display.invokeVisualization)
    { $('#data-grid').visualization(); }

    // not-grid
    $('.widgetContent .close').click(function(event)
    {
        event.preventDefault();
        widgetNS.showDataView();
    });

    // more views
    var moreViews = [];
    $.ajax({
        url: '/views.json?method=getByTableId&tableId=' + widgetNS.view.tableId,
        dataType: 'json',
        success: function (responseData)
        {
            moreViews = _.reject(responseData, function(view)
            {
                return (_.include(view.flags, 'default') && (view.viewType == 'tabular')) ||
                       (view.viewType == 'blobby');
            });
            moreViews.sort(function(a, b) { return b.viewCount - a.viewCount });

            $('.widgetContent_views').append(
                $.renderTemplate(
                    'filtersTable',
                    moreViews,
                    {
                        'tbody .item': {
                            'filter<-': {
                                '.type .cellInner.icon': function(filter) { return blist.dataset.getDisplayType(filter.item); },
                                '.type@title': function(filter) { return blist.dataset.getDisplayType(filter.item); },
                                '.type@class+': function(filter) { return ' type' + blist.dataset.getDisplayType(filter.item); },

                                '.name a': function(filter) { return $.htmlEscape(filter.item.name); },
                                '.name a@title': function(filter) { return $.htmlEscape(filter.item.description || ''); },
                                '.name a@href': function(filter) { return $.generateViewUrl(filter.item); },

                                '.viewed .cellInner': 'filter.viewCount',

                                '.picture a@href': function(filter) { return $.generateProfileUrl(filter.item.owner); },
                                '.picture img@src': function(filter) { return filter.item.owner.profileImageUrlMedium ||
                                                                              '/images/small-profile.png'; },
                                '.picture img@alt': function(filter) { return $.htmlEscape(filter.item.owner.displayName); },
                                '.picture img@title': function(filter) { return $.htmlEscape(filter.item.owner.displayName); }
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
                $this.socrataTip({ message: $this.attr('title').replace(/\s/g, ' '),
                    shrinkToFit: false });
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
        },
        error: function(xhr)
        {
            // TODO: handle somehow?
        }
    });

    // downloads
    var supportedDownloadTypes = [ 'CSV', 'JSON', 'PDF', 'XLS', 'XLSX', 'XML'  ];
    $('.widgetContent_downloads').append(
        $.renderTemplate(
            'downloadsTable',
            supportedDownloadTypes,
            {
                'tbody .item': {
                    'downloadType<-': {
                        '.type a': '#{downloadType}',
                        '.type a@href': function(downloadType) { 
                            return '/views/' + widgetNS.view.id + '/rows.' +
                            downloadType.item.toLowerCase() + '?accessType=DOWNLOAD'; }
                        // TODO: add download count when supported
                    }
                }
            }));
    $('.widgetContent_downloads table.gridList').combinationList({
        headerContainerSelector: '.widgetContent_downloads .gridListWrapper',
        initialSort: [[0, 0]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: {0: {sorter: 'text'}}
    });

    // comments

    $('.widgetContent_comments .datasetAverageRating').stars({
        onChange: function()
        {
            $('.commentInterstitial').jqmShow();
            return false;
        },
        value: widgetNS.view.averageRating || 0
    });

    // TODO: maybe refactor these into one?
    var repliesDirective = {
        '.@data-commentid': 'reply.id',

        '.replyAuthor img@src':
            function(reply) { return reply.item.user.profileImageUrlMedium ||
                                       '/images/large-profile.png'; },
        '.replyAuthor img@alt':
            function(reply) { return $.htmlEscape(reply.item.user.displayName); },
        '.replyAuthor a@href':
            function(reply) { return $.generateProfileUrl(reply.item.user); },

        '.replyContainer .replyBody .replyAuthorName':
            function(reply) { return $.htmlEscape(reply.item.user.displayName); },
        '.replyContainer .replyBody .replyAuthorName@href':
            function(reply) { return $.generateProfileUrl(reply.item.user); },
        '.replyContainer .replyBody .replyTitle':
            function(reply) { return ' ' + $.htmlEscape(reply.item.title || ''); },
        '.replyContainer .replyBody+':
            function(reply) { return ' ' + $.htmlEscape(reply.item.body || ''); },

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
                '.commentAuthor img@alt':
                    function(comment) { return $.htmlEscape(comment.item.user.displayName); },
                '.commentAuthor a@href':
                    function(comment) { return $.generateProfileUrl(comment.item.user); },

                '.commentContainer .commentBody .commentAuthorName':
                    function(comment) { return $.htmlEscape(comment.item.user.displayName); },
                '.commentContainer .commentBody .commentAuthorName@href':
                    function(comment) { return $.generateProfileUrl(comment.item.user); },
                '.commentContainer .commentBody .commentTitle':
                    function(comment) { return ' ' + $.htmlEscape(comment.item.title || ''); },
                '.commentContainer .commentBody+':
                    function(comment) { return ' ' + $.htmlEscape(comment.item.body || ''); },

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
    $.ajax({
        url: '/views/' + widgetNS.view.id + '/comments.json',
        dataType: 'json',
        success: function (responseData)
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
           '.widgetContent_comments .replyActions a,' +
           '.widgetContent_comments .addCommentButton', 'click',
        function (event)
        {
            event.preventDefault();

            $('.commentInterstitial').jqmShow();
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
                    $(this).closest('form').submit();
                }));

    // Set up modals
    $('.widgetModal').jqm({
        trigger: false,
        modal: true,
        onShow: function(jqm)
        {
            jqm.w.fadeIn('slow');
            jqm.o.fadeIn('slow');
        },
        onHide: function(jqm)
        {
            jqm.w.fadeOut('slow');
            jqm.o.fadeOut('slow');
        }
    });
    $.live('a.jqmClose', 'click', function(event)
    {
        event.preventDefault();
        $('.widgetModal').jqmHide();
    });

    // Trigger interstitial if necessary
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

    // Notify publisher that we are ready
    widgetNS.ready = true;
});
