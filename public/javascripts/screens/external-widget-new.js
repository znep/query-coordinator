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

$(function()
{
    // orientation
    widgetNS.orientation = widgetNS.theme['frame']['orientation'];

    // Infinite Exasperation?
    if ($.browser.msie)
    {
        $('body').addClass('ie ie' + $.browser.version.slice(0, 1)); // I guess this will break when we hit IE10.
    }

    // sizing
    widgetNS.resizeViewport();
    $(window).resize(function() { widgetNS.resizeViewport(); });

    // generic events
    $.live('a[rel$=external]', 'focus', function(event)
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
        contents: [
            { text: 'Views', className: 'views', subtext: 'Filters, Charts, and Maps', href: '#views' },
            { text: 'Downloads', className: 'downloads', subtext: 'Download various file formats', href: '#downloads' },
            { text: 'Comments', className: 'comments', subtext: 'Read comments on this dataset', href: '#comments' },
            { text: 'Embed', className: 'embed', subtext: 'Embed this player on your site', href: '#embed' },
            { text: 'Print', className: 'print', subtext: 'Print out this dataset', href: '#print' },
            { text: 'About the Socrata Social Data Player', className: 'about', href: 'http://www.socrata.com/try-it-free' }
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

    var tweet = escape('Check out the ' + widgetNS.view.name + ' dataset on ' + configNS.strings.company_name + ': ');
    var seoPath = window.location.hostname + $.generateViewUrl(widgetNS.view);
    var shortPath = window.location.hostname.replace(/www\./, '') + '/d/' + widgetNS.viewId;
    $('.subHeaderBar .share .shareMenu').menu({
        attached: false,
        menuButtonClass: 'icon',
        menuButtonContents: 'Socialize',
        contents: [
            { text: 'Delicious', className: 'delicious', rel: 'external',
              href: 'http://del.icio.us/post?url=' + seoPath + '&title=' + widgetNS.view.name },
            { text: 'Digg', className: 'digg', rel: 'external',
              href: 'http://digg.com/submit?phase=2&url=' + seoPath + '&title=' + widgetNS.view.name },
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://www.twitter.com/home?status=' + tweet + shortPath },
            { text: 'Email', className: 'email', href: '#email' }
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
                        .css('background-color', null);
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
                        .css('background-color', null);
                }
            );
        }
    };
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
                dataType: 'json',
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
                    editEnabled: typeof(isOldIE) === 'undefined',
                    manualResize: true,
                    columnNameEdit: typeof(isOldIE) === 'undefined' &&
                        blist.isOwner,
                    filterForm: '.toolbar .toolbarSearchForm',
                    autoHideClearFilterItem: false,
                    clearTempViewCallback: widgetNS.clearTempViewTab,
                    setTempViewCallback: widgetNS.setTempViewTab,
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
        $('.widgetContent > :visible:first').fadeOut(200,
            function()
            {
                $('.widgetContentGrid').fadeIn(200);
            });
    });

    // embed
    $('.widgetContent_embed .embedForm').embedForm();

    // print
    // TODO: maybe make this generic?
    $('.widgetContent_print form input[type=image]')
        .replaceWith(
            $('<a href="#submit" class="button submit"><span class="icon"></span>Print</a>')
                .click(function(event)
                {
                    $(this).closest('form').submit();
                }));
});