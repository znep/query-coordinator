(function($)

{

if (_.isUndefined(window.parent))
{
    throw "Not in an iFrame! Not sure what you're expecting.";
}


$(function()
{
    $('.expander').replaceWith($.tag({
        tagName: 'a',
        'class': ['button', 'chooseDatasetButton'],
        contents: [ $.t('controls.common.dataset_picker.button') ]
    }, true));


    $('.chooseDatasetButton').click(function(event) {
        event.preventDefault();
        var chosenDataset = blist.browse.getDS($(this));

        if (_.isFunction(window.frameElement.onDatasetSelect)) {
            // Use this to fire a `onDatasetSelect` function in the parent window
            // when a dataset is selected (if you do not have blist.common in the
            // parent window context).
            // Add an attribute to the iframe element that is the function to be called
            // Ex: $('iframe')[0].onDatasetSelect = function(datasetObj) {}
            // Context: This was added for Storyteller
            window.frameElement.onDatasetSelect(chosenDataset)
        } else {
            // Default behavior when embedded in an environment with blist.common
            // and the frameElement.onDatasetSelect is not defined
            var commonNS = window.parent.blist.namespace.fetch('blist.common');

            if (_.isFunction(commonNS.selectedDataset)) {
                commonNS.selectedDataset(chosenDataset);
            } else {
                throw "Can't find the blist.common.selectedDataset handler in the parent!"
            }
        }
    });
});

})(jQuery);
