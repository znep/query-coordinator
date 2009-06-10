var widgetNS = blist.namespace.fetch('blist.widget');

blist.widget.setupMenu = function()
{
    $('#header').find('ul.headerMenu')
        .dropdownMenu({triggerButton: $('#header').find('a.menuLink'),
            forcePosition: true, linkCallback: widgetNS.headerMenuHandler});

    $('#emailDialog').jqm({trigger: false});
    $('#emailDialog a.submit').click(widgetNS.submitEmail);
    $('#emailDialog form').submit(widgetNS.submitEmail);

    $('#publishDialog').jqm({trigger: false});
    $("#publishDialog textarea").click(function() { $(this).select(); });
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

    $('#header form').submit(function (event) { event.preventDefault(); });

    $('#data-grid').datasetGrid({viewId: widgetNS.viewId,
            accessType: 'WIDGET', showRowNumbers: false,
            filterItem: '#header form :text',
            clearFilterItem: '#header form .clearSearch'
        });
    $.ajax({url: '/views/' + widgetNS.viewId + '.json', data: {method: 'opening',
            accessType: 'WIDGET'}});
});
