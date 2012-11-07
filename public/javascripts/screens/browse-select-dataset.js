(function($)
{

if (_.isUndefined(window.parent))
{
    throw "Not in an iFrame! Not sure what you're expecting.";
}

var commonNS = window.parent.blist.namespace.fetch('blist.common');

$(function()
{
    $('.expander').replaceWith($.tag({
        tagName: 'a',
        'class': ['button', 'chooseDatasetButton'],
        contents: [ 'Choose' ]
    }, true));

    $('.chooseDatasetButton').click(function(event)
    {
        event.preventDefault();

        if (_.isFunction(commonNS.selectedDataset))
        {
            commonNS.selectedDataset(blist.browse.getDS($(this)));
        }
        else
        {
            throw "Can't find the blist.common.selectedDataset handler in the parent!"
        }
    });
});

})(jQuery);
