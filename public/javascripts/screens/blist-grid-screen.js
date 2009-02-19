var blistGridNS = blist.namespace.fetch('blist.blistGrid');

blist.blistGrid.sizeSwf = function (event)
{
    if (blistGridNS.popup)
    {
        return;
    }

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
    $('#overlay').show();
}

blist.blistGrid.flashPopupClosedHandler = function ()
{
    blistGridNS.popup = false;
    blistGridNS.sizeSwf();
    $('#overlay').hide();
}

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    blist.util.flashInterface.addPopupHandlers(blistGridNS.flashPopupShownHandler,
        blistGridNS.flashPopupClosedHandler);

    $(window).resize(function (event)
    {
        blistGridNS.sizeSwf(event);
    });

    $('#filterLink').click(function (event)
    {
        blistGridNS.showFlashPopup('LensBuilder');
    });

    $('#undoLink, #redoLink').click(function (event)
    {
        blist.util.flashInterface.doAction($(event.currentTarget).text());
    });

    $('#lensContainer .headerBar form').submit(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.search(
            $(event.currentTarget).find('input[type="text"]').val());
    });

    blistGridNS.sizeSwf();
});
