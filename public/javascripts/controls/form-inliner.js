var blistCommonNS = blist.namespace.fetch('blist.common');

// Attach the view as a hidden form parameter to allow
// printing/downloading inline views
blistCommonNS.formInliner = function(event)
{
    var $form = $(event.target);
    var view  = blist.dataset.cleanCopy();
    if ($form.find('input[name=view]').size() > 0)
    { return; }

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
        if (! _.isUndefined(blist.$container.renderTypeManager()
            .$domForType('table').datasetGrid))
        {
            var dsGrid = blist.$container.renderTypeManager()
                .$domForType('table').datasetGrid();

            return this.each(function()
            {
                $(this).click(function(event)
                {
                    if (blist.dataset.temporary !== true)
                    { return true; }

                    event.preventDefault();

                    var href = $(this).attr('href')
                        .replace(/\w{4}-\w{4}/,'INLINE');

                    var $form = $('<form>')
                        .attr('ACTION', href)
                        .attr('method', 'post');

                    blist.$container.renderTypeManager()
                        .$domForType('table').append($form);
                    $form.bind('submit', blistCommonNS.formInliner);
                    $form.submit();
                });
            });
        }
    }
})(jQuery);
