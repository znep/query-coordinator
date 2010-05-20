var widgetNS = blist.namespace.fetch('blist.widget');
var commonNS = blist.namespace.fetch('blist.common');
var configNS = blist.namespace.fetch('blist.configuration');

blist.widget.resizeViewport = function()
{
    var $contentContainer = $('.widgetContent');
    var targetHeight = $(window).height() -
        widgetNS.theme.frame.border.width.value * 2 -
        widgetNS.theme.frame.padding.value;
    $contentContainer.siblings(':visible').each(function()
    {
        targetHeight -= $(this).outerHeight(true);
    });
    $contentContainer.children().height(targetHeight);

    widgetNS.resizeGrid();
};

blist.widget.resizeGrid = function()
{
    $('#data-grid:visible')
        .height($('.widgetContentGrid').innerHeight())
        .trigger('resize');
};

blist.widget.hideToolbar = function()
{
    $('.toolbar')
        .removeClass().addClass('toolbar')
        .hide(
            'slide',
            { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') },
            widgetNS.resizeViewport);
};

blist.widget.showToolbar = function(sectionName, sectionClass)
{
    var $toolbar = $('.toolbar');

    $toolbar.removeClass().addClass('toolbar ' + sectionName);

    if (!$toolbar.is(':visible'))
    {
        $toolbar.show('slide', { direction: ((widgetNS.orientation == 'downwards') ? 'up' : 'down') });
        $toolbar
            .children(':not(.close)').hide()
            .filter('.' + sectionClass).show();
        widgetNS.resizeViewport();
    }
    else
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
            widgetNS.resizeGrid();
        });
};

$(function()
{
    // keep track of some stuff for easy access
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];
    widgetNS.isBlobby = (widgetNS.view.viewType === 'blobby');

    // sizing
    widgetNS.resizeViewport();
    $(window).resize(function() { widgetNS.resizeViewport(); });

    // generic events
    $.live('a[rel$=external]', 'focus', function(event)
    {
        this.target = '_blank';
    });
    $.live('a[rel$=external]', 'mouseover', function(event)
    {
        this.target = '_blank';
    });
    $.live('a[rel$=external]', 'click', function(event)
    {
        // interstitial
        if (widgetNS.theme['behavior']['interstitial'] === true)
        {
            event.preventDefault();
            // todo: pop interstitial
            return;
        }
    });

    // controls
    $('select, input:checkbox, input:radio, input:file').uniform();

    // menus
    $('.mainMenu').menu({
        attached: false,
        menuButtonTitle: 'Access additional information about this dataset.',
        menuButtonClass: 'mainMenuButton ' + ((widgetNS.orientation == 'downwards') ? 'upArrow' : 'downArrow'),
        contents: [
            { text: 'Views', className: 'views', subtext: 'Filters, Charts, and Maps', href: '#views' },
            { text: 'Downloads', className: 'downloads', subtext: 'Download various file formats', href: '#downloads', onlyIf: !widgetNS.isBlobby },
            { text: 'Comments', className: 'comments', subtext: 'Read comments on this dataset', href: '#comments' },
            { text: 'Embed', className: 'embed', subtext: 'Embed this player on your site', href: '#embed' },
            { text: 'Print', className: 'print', subtext: 'Print out this dataset', href: '#print', onlyIf: !widgetNS.isBlobby },
            { text: 'About the Socrata Social Data Player', className: 'about', href: 'http://www.socrata.com/try-it-free', rel: 'external' }
        ]
    });
    $('.mainMenu .menuDropdown a').click(function(event)
    {
        var target = $(this).closest('li').attr('class');
        if (target == 'about')
        {
            // bail; this is a real link
            return;
        }

        event.preventDefault();
        if (!$('.widgetContent_' + target).is(':visible'))
        {
            $('.widgetContent > :visible:first').fadeOut(200,
                function()
                {
                    $('.widgetContent_' + target).fadeIn(200);
                });
        }
    });

    var tweet = escape('Check out the ' + $.htmlEscape(widgetNS.view.name) + ' dataset on ' + configNS.strings.company + ': ');
    var seoPath = window.location.hostname + $.generateViewUrl(widgetNS.view);
    var shortPath = window.location.hostname.replace(/www\./, '') + '/d/' + widgetNS.viewId;
    $('.subHeaderBar .share .shareMenu').menu({
        attached: false,
        menuButtonClass: 'icon',
        menuButtonContents: 'Socialize',
        menuButtonTitle: 'Share this dataset',
        contents: [
            { text: 'Delicious', className: 'delicious', rel: 'external',
              href: 'http://del.icio.us/post?url=' + seoPath + '&title=' + $.htmlEscape(widgetNS.view.name) },
            { text: 'Digg', className: 'digg', rel: 'external',
              href: 'http://digg.com/submit?phase=2&url=' + seoPath + '&title=' + $.htmlEscape(widgetNS.view.name) },
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://www.twitter.com/home?status=' + tweet + shortPath },
            { text: 'Email', className: 'email', href: '#email', onlyIf: !widgetNS.isBlobby }
        ]
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
        widgetNS.hideToolbar();
    });
    $('.subHeaderBar .search a').click(function(event)
    {
        event.preventDefault();

        if ($toolbar.hasClass('search') && $toolbar.is(':visible'))
        {
            widgetNS.hideToolbar();
        }
        else
        {
            widgetNS.showDataView();
            widgetNS.showToolbar('search', 'toolbarSearchForm');
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
            moreViews.sort(function(a, b) { return a.viewCount < b.viewCount });

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
                                '.picture img@alt': function(filter) { return $.htmlEscape(filter.item.owner.displayName); }
                            }
                        }
                    }));

            $('.widgetContent_views .name a').each(function()
            {
                var $this = $(this);
                if ($this.attr('title') === '')
                { return; }

                $this.socrataTip({ message: $this.attr('title'), trigger: 'hover', shrinkToFit: false });
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
                        '.type a': 'Download #{downloadType}',
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
});
