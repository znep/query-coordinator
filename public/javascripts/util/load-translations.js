;(function()
{
    var trans = document.getElementById('translations');
    if (trans && trans.firstChild)
    {
        blist.translations = JSON.parse(trans.firstChild.textContent);
    }
    else
    {
        trans = {};
    }
})();
