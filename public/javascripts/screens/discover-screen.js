var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.searchUpdatedHandler = function (event, search)
{
    var $textBox = $('#header form.search input[type="text"]');
    // Do explicit focus & blur to correctly update the example plugin
    $textBox.focus();
    $textBox.val(search);
    $textBox.blur();
}

blist.discover.openViewHandler = function (event, viewId)
{
    blist.util.navigation.redirectToView(viewId);
}

blist.discover.copyViewHandler = function (event, viewId)
{
    alert('Copying view ' + viewId + ': not yet supported');
}

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(document).bind(blist.events.DISCOVER_SEARCH_UPDATED,
        discoverNS.searchUpdatedHandler);
    $(document).bind(blist.events.OPEN_VIEW, discoverNS.openViewHandler);
    $(document).bind(blist.events.COPY_VIEW, discoverNS.copyViewHandler);

    // In Firefox, doing .focus() and .blur() events on a text input will
    // cause JS errors.  Disable autocomplete to make them stop
    // https://bugzilla.mozilla.org/show_bug.cgi?id=470968
    $('#discoverBody #header form.search input[type="text"]')
        .attr('autocomplete', 'off');

    $('#discoverBody #header form.search').submit(function (event)
    {
        event.preventDefault();
        blist.util.flashInterface.discoverSearch(
            $(event.currentTarget).find('input[type="text"]').val());
    });

    $(window).resize(function (event) 
    {
        commonNS.adjustSize();
    });
    commonNS.adjustSize();
});
