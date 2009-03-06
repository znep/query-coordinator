var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.sizeSwf = function (event)
{
    if (blistGridNS.popup)
    {
        return;
    }

    var $swf = $('#swfContent');
    var $target = $('#swfWrapper');
    var $container = $('#outerSwfWrapper');
    var $parent = $target.offsetParent();
    var containerTop = $container.offset().top;
    var containerLeft = $container.offset().left;

    $target.css('top', containerTop + 'px');
    $target.css('bottom',
        ($parent.height() - (containerTop + $container.height())) + 'px');
    $target.css('left', containerLeft + 'px');
    $target.css('right',
        ($parent.width() - (containerLeft + $container.width())) + 'px');
    // Safari doesn't give the swf the right height with height:100%; so force it
    $swf.height($target.height());
}

blist.blistGrid.showFlashPopup = function (popup)
{
    blist.util.flashInterface.showPopup(popup);
}

blist.blistGrid.flashPopupShownHandler = function (popup)
{
    blistGridNS.popup = true;
    $('#swfWrapper').css('top', ($('#header').outerHeight() + 10) + 'px');
    $('#swfWrapper').css('bottom', ($('#footer').outerHeight() + 10) + 'px');
    // Safari doesn't give the swf the right height with height:100%; so force it
    $('#swfContent').height($('#swfWrapper').height());
    $('#overlay').show();
}

blist.blistGrid.flashPopupClosedHandler = function ()
{
    blistGridNS.popup = false;
    blistGridNS.sizeSwf();
    $('#overlay').hide();
}

blist.blistGrid.toggleAddColumns = function ()
{
    $('#addColumnsMenu').toggleClass('shown');
    blist.common.forceWindowResize();
}

blist.blistGrid.dataTypeClickHandler = function (event)
{
    var dt = $(event.currentTarget).attr('href').slice(1);
    blist.util.flashInterface.addColumn(dt);
}

blist.blistGrid.viewChangedHandler = function (event, data)
{
    var $main = $('#lensContainer');
    if (data == 'grid')
    {
        $main.removeClass('pageView');
        $main.addClass('tableView');
    }
    else if (data == 'page')
    {
        $main.removeClass('tableView');
        $main.addClass('pageView');
    }
    blist.common.forceWindowResize();
}

blist.blistGrid.pageLabelHandler = function (event, newLabel)
{
    $('#pageInfo').text(newLabel);
}

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    blist.util.flashInterface.addPopupHandlers(blistGridNS.flashPopupShownHandler,
        blistGridNS.flashPopupClosedHandler);

    $(document).bind(blist.events.VIEW_CHANGED, blistGridNS.viewChangedHandler);
    $(document).bind(blist.events.PAGE_LABEL_UPDATED, blistGridNS.pageLabelHandler);

    $(window).resize(function (event)
    {
        blistGridNS.sizeSwf(event);
    });

    $('#filterViewMenu .filter').click(function (event)
    {
        blistGridNS.showFlashPopup('LensBuilder:Filter');
    });
    $('#filterViewMenu .sort').click(function (event)
    {
        blistGridNS.showFlashPopup('LensBuilder:Sort');
    });
    $('#filterViewMenu .showHide').click(function (event)
    {
        blistGridNS.showFlashPopup('LensBuilder:ShowHide');
    });

    $('#displayMenu .table').click(function (event)
    {
        blist.util.flashInterface.doAction('TableView');
    });
    $('#displayMenu .page').click(function (event)
    {
        blist.util.flashInterface.doAction('PageView');
    });

    $('.flashAction').click(function (event)
    {
        blist.util.flashInterface.doAction(
            $(event.currentTarget).attr('href').slice(1));
    });

    $('.addColumnsLink, #addColumnsMenu .close').click(function (event)
    {
        blistGridNS.toggleAddColumns();
    });

    $('#addColumnsMenu .column a').click(function (event)
    {
        blistGridNS.dataTypeClickHandler(event);
    });

    $('#lensContainer .headerBar form').submit(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.lensSearch(
            $(event.currentTarget).find('input[type="text"]').val());
    });

    $('#mainMenu').dropdownMenu({triggerButton: $('#mainMenuLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#filterViewMenu').dropdownMenu({triggerButton: $('#filterLink'),
        menuBar: $('#lensContainer .headerBar')});
    $('#displayMenu').dropdownMenu({triggerButton: $('#displayLink'),
        menuBar: $('#lensContainer .headerBar')});

    blistGridNS.sizeSwf();
});
