$(function()
{
    // highlight tab on measures overview page
    if (window.location.pathname.indexOf('/measures') == 0)
    {
        _.defer(function()
        {
            $('#measures-header .sidebarTabs li a[href=' + window.location.hash + ']').click();
        });
    }

    // exit modal
    // build from scratch and insert into modals div because life is awesome
    $('#modals').append($.tag(
      { tagName: 'div', id: 'hstpInterstitial', 'class': 'modalDialog', style: { display: 'none' }, contents: [
          { tagName: 'a', 'class': 'jqmClose modalDialogClose', href: '#close', contents: 'Close' },
          { tagName: 'h2', contents: 'You are leaving the Health System Measurement Project' },
          { tagName: 'p', contents: 'You are about to leave the Health System Measurement Project. The link you clicked on is sending you to' },
          { tagName: 'div', 'class': 'urlContainer', contents: { tagName: 'div' } },
          { tagName: 'p', contents: 'We hope your visit was enjoyable and informative.' },
          { tagName: 'ul', 'class': 'actions clearfix', contents: [
              { tagName: 'li', contents: { tagName: 'a', 'class': 'button default', rel: 'external', contents: 'Go now' } },
              { tagName: 'li', contents: { tagName: 'a', 'class': 'button jqmClose', href: '#cancel', contents: 'Cancel' } }
          ] }
      ] }
    ));
    // jqm it
    $('#hstpInterstitial').socrataJqm();

    // now trap links in places that they might appear
    var possibleLocations = [
        '#measure-page #measure-metadata .source a'
    ];
    $(possibleLocations.join(', ')).click(function(event)
    {
        if (!this.hostname.match(/\.gov$/i))
        {
            event.preventDefault();
            var href = $(this).attr('href');
            $('#hstpInterstitial')
                .find('.urlContainer div').text(href).end()
                .find('.button.default').attr('href', href).end()
                .jqmShow();
        }
    });
});
