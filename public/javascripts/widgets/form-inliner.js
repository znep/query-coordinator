var blistCommonNS = blist.namespace.fetch('blist.common');

// Attach the view as a hidden form parameter to allow
// printing/downloading inline views
blistCommonNS.formInliner = function(event)
{
    var $form = $(event.target);
    var model = blist.$display.blistModel();
    var view  = blist.datasetUtil.cleanViewForPost(
        $.extend(true, {}, blist.display.view));

    $form.append(
            $('<input type="hidden" name="view"/>')
                .val(JSON.stringify(view)))
        .append(
            $('<input type="hidden" name="method" value="index" />'));
};

// Grab links to download and auto-create a form if inline
(function($)
{
    $.fn.downloadToFormCatcher = function()
    {
        if (! _.isUndefined(blist.$display.datasetGrid))
        {
            var dsGrid = blist.$display.datasetGrid();

            return this.each(function()
            {
                $(this).click(function(event)
                {
                    if (dsGrid.isTempView !== true)
                    { return true; }

                    event.preventDefault();

                    var href = $(this).attr('href')
                        .replace(/\w{4}-\w{4}/,'INLINE');

                    var $form = $('<form>')
                        .attr('ACTION', href)
                        .attr('method', 'post');

                    blist.$display.append($form);
                    $form.bind('submit', blistCommonNS.formInliner);
                    $form.submit();
                });
            });
        }
    }
})(jQuery);
