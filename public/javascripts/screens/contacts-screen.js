var contactsNS = blist.namespace.fetch('blist.contacts');

blist.contacts.setupTable = function ()
{
    $('#contactList').combinationList({
        initialSort: [[[4, 1]]],
        loadedCallback: function ()
        {
            //blistsInfoNS.updateSummary(0);
        },
        searchable: true,
        searchCompleteCallback: function () {
            //blistsInfoNS.updateSummary(0);
        },
        searchFormSelector: "form.contactsFind",
        selectionCallback: function($targetRow, $selectedItems)
        {
            //blistsInfoNS.updateSummary($selectedItems.length);
        },
        sortHeaders: {0: {sorter: false}, 1: {sorter: false},
            2: {sorter: "text"}, 3: {sorter: "text"},
            4: {sorter: "usLongDate"}},
    });
};


/* Initial start-up calls, and setting up bindings */

$(function ()
{
    $(window).resize(function (event)
    {
        commonNS.adjustSize();
    });
    commonNS.adjustSize();

    contactsNS.setupTable();

    $('#contactFilters').filterList({
        filterClickCallback: function (title)
        {
            $('#contactList tbody').hide();
            $('#listTitle').text(title);
        },
        filterSuccessHandler: function (retData)
        {
            $('#contactList').combinationList().updateList(retData);
        }});
});
