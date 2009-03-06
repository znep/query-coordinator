var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.searchUpdatedHandler = function (event, search)
{
    var $textBox = $('#header form.search input[type="text"]');
    // Do explicit focus & blur to correctly update the example plugin
    $textBox.focus();
    $textBox.val(search);
    $textBox.blur();
}

blist.discover.openLensHandler = function (event, lensId)
{
    // TODO: Is there a better way to get this URL?
    window.location = '/blists/' + lensId;
}

blist.discover.copyLensHandler = function (event, lensId)
{
    alert('Copying lens ' + lensId + ': not yet supported');
}

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(document).bind(blist.events.DISCOVER_SEARCH_UPDATED,
        discoverNS.searchUpdatedHandler);
    $(document).bind(blist.events.OPEN_LENS, discoverNS.openLensHandler);
    $(document).bind(blist.events.COPY_LENS, discoverNS.copyLensHandler);

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
});
