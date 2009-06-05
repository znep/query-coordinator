var widgetNS = blist.namespace.fetch('blist.widget');

blist.widget.jsGridFilter = function (e)
{
    var $grid = $('#data-grid');
    if ($grid.length > 0)
    {
        setTimeout(function ()
        {
            var searchText = $(e.currentTarget).val();
            $grid.blistModel().filter(searchText, 250);
            if (!searchText || searchText == '')
            {
                $('#header form .clearSearch').hide();
            }
            else
            {
                $('#header form .clearSearch').show();
            }
        }, 10);
    }
};

blist.widget.jsGridClearFilter = function(e)
{
    e.preventDefault();
    $('#header form :text').val('').blur();
    $('#data-grid').blistModel().filter('');
    $(e.currentTarget).hide();
};

blist.widget.setupMenu = function()
{
    var htmlStr =
        '<a class="menuLink" href="#header-menu">Menu</a>\
        <ul class="menu headerMenu">\
            <li class="email">\
                <a href="#email">' +
                    // TODO: language
                    '<span class="highlight">Email this dataset</span>\
                </a>\
            </li>\
            <li class="csvExport">\
                <a href="/views/' + widgetNS.viewId + '/rows.csv">\
                    <span class="highlight">Download as CSV</span>\
                </a>\
            </li>\
            <li class="publish">\
                <a href="#publish">' +
                    // TODO: language
                    '<span class="highlight">Republish this dataset</span>\
                </a>\
            </li>\
            <li class="fullscreen">' +
                // TODO: Real URL
                '<a rel="external" href="/dataset/' + $.urlSafe(widgetNS.viewName) +
                    '/' + widgetNS.viewId + '">\
                    <span class="highlight">View fullscreen</span>\
                </a>\
            </li>\
            <li class="print">\
                <a href="/views/' + widgetNS.viewId + '/rows.pdf?print=true&\
                    headers_on_every_page=true">\
                    <span class="highlight">Print as PDF</span>\
                </a>\
            </li>\
            <li class="newDataset">\
                <a href="/blists/new_blist" rel="external">' +
                    // TODO: language
                    '<span class="highlight">Create new dataset</span>\
                </a>\
            </li>\
            <li class="footer"><div class="outerWrapper">\
                <div class="innerWrapper"><span class="colorWrapper">\
                </span></div>\
            </div></li>\
        </ul>';
    $('#header .wrapperT').prepend(htmlStr);
    $('#header').find('ul.headerMenu')
        .dropdownMenu({triggerButton: $('#header').find('a.menuLink'),
            forcePosition: true, linkCallback: widgetNS.headerMenuHandler});

    // TODO: Real dialog renderer
    var emailDialogStr =
        '<div class="dialogWrapper" id="emailDialog">\
        <div class="dialogTL"><div class="dialogBR"><div class="dialogBL">\
        <div class="dialogOuter"><div class="dialogBox">\
            <div class="header"><h1>Email this dataset</h1></div>\
            <div class="mainContent clearfix">\
                <form action="/views/' + widgetNS.viewId +
                    '/rows.html?method=email">\
                <label for="emailInput">Email to send this dataset to:</label>\
                <input id="emailInput" name="email" type="text" />\
                </form>\
                <p class="error"></p>\
                <ul class="actionButtons">\
                    <li><a href="#close" class="jqmClose">Close</a></li>\
                    <li><a href="#send-email" class="submit arrowButton">\
                        Send Email\
                    </a></li>\
                </ul>\
            </div>\
        </div></div>\
        </div></div></div>\
        </div>';
    $('body').append(emailDialogStr);
    $('#emailDialog').jqm({trigger: false});
    $('#emailDialog a.submit').click(widgetNS.submitEmail);
    $('#emailDialog form').submit(widgetNS.submitEmail);


    var rootPath = window.location.protocol + '//' + window.location.host;
    var viewHref = '/dataset/' + $.urlSafe(widgetNS.viewName) + '/' +
        widgetNS.viewId;
    // TODO: Real dialog renderer
    var publishDialogStr =
        '<div class="dialogWrapper" id="publishDialog">\
        <div class="dialogTL"><div class="dialogBR"><div class="dialogBL">\
        <div class="dialogOuter"><div class="dialogBox">\
            <div class="header"><h1>Republish this widget</h1></div>\
            <div class="mainContent clearfix">\
                <p>Copy and paste this HTML code into your blog</p>' +
                // TODO: Real publish code
                '<textarea>' +
                '<div><p><a href="' + rootPath + viewHref +
                '" style="font-size:12px;font-weight:bold;' +
                'text-decoration:none;color:#333333;font-family:arial;">' +
                widgetNS.viewName + '</a></p><iframe width="425px" height="344px"' +
                ' src="' + rootPath + '/widgets/' + widgetNS.viewId +
                '" frameborder="0" scrolling="no"><a href="' + rootPath +
                viewHref + '" title="' + widgetNS.viewName + '">' +
                widgetNS.viewName + '</a></iframe><p><a href="' +
                'http://www.socrata.com">Powered by Socrata</a></p></div>' +
                '</textarea>\
                <ul class="actionButtons">\
                    <li><a href="#close" class="arrowButton jqmClose">\
                        Close\
                    </a></li>\
                </ul>\
            </div>\
        </div></div>\
        </div></div></div>\
        </div>';
    $('body').append(publishDialogStr);
    $('#publishDialog').jqm({trigger: false});
};

blist.widget.headerMenuHandler = function (event)
{
    // Href that we care about starts with # and parts are separated with _
    // IE sticks the full thing, so slice everything up to #
    var href = $(event.currentTarget).attr('href');
    if (href.indexOf('#') < 0)
    {
        return;
    }

    var action = href.slice(href.indexOf('#') + 1);
    event.preventDefault();
    switch (action)
    {
        case 'email':
            $('#emailDialog').jqmShow().find('input').focus();
            break;
        case 'publish':
            $('#publishDialog').jqmShow();
            break;
    }
};

blist.widget.submitEmail = function (event)
{
    event.preventDefault();
    $('#emailDialog .error').text('');
    var email = $('#emailDialog input').val();
    if (!email || email == '')
    {
        $('#emailDialog .error').text('Please enter an email address');
        $('#emailDialog input').focus();
        return;
    }

    var $form = $('#emailDialog form');
    $.ajax({url: $form.attr('action'),
            data: $form.find(':input'),
            cache: false,
            error: function (xhr)
            {
                // Error responses have lots of extra space due to an IE issue
                // with iframes & file uploads.  Trying to parse that in jQuery
                // would hang; but stripping the extra off makes it work OK
                var $resp = $(xhr.responseText.replace(/\n/g, '')
                    .replace(/\s+/g, ' '));
                $('#emailDialog .error').text($resp.filter('p')
                    .text().replace(/\(.+\)/, ''));
                $('#emailDialog input').focus().select();
            },
            success: function (resp)
            {
                $('#emailDialog').jqmHide();
            }});
};

$(function ()
{
    var sizeGrid = function ()
    {
        var $grid = $('#data-grid');
        $grid.height($grid.next().offset().top - $grid.offset().top + 1);
    };
    sizeGrid();
    $(window).resize(sizeGrid);

    // Make all links with rel="external" open in a new window.
    $("a[rel$='external']").live("mouseover",
        function(){ this.target = "_blank"; });

    widgetNS.setupMenu();

    $('#header form :text').keydown(widgetNS.jsGridFilter);
    $('#header form .clearSearch').click(widgetNS.jsGridClearFilter).hide();

    $('#data-grid')
        .blistTable({showName: false, showRowNumbers: false,
            showGhostColumn: true, showTitle: false, generateHeights: false})
        .blistModel()
        .options({filterMinChars: 0})
        .ajax({ url: '/views/' + widgetNS.viewId + '/rows.json',
            dataType: 'jsonp', jsonp: 'jsonp', data: {accessType: 'WIDGET'}});
    $.ajax({url: '/views/' + widgetNS.viewId + '.json', data: {method: 'opening',
            accessType: 'WIDGET'}});
});
