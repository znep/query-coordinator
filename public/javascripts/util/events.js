// Create blist namespace if DNE
if (!blist)
{
    var blist = {};
}
// Create file namespace if DNE
if (!blist.events)
{
    blist.events = {};
}

blist.events.ROW_SELECTION = 'rowselection';
