var blistCommonNS = blist.namespace.fetch('blist.common');

// Attach the view as a hidden form parameter to allow
// printing/downloading inline views
blistCommonNS.formInliner = function(event, options)
{
    var opts  = $.extend({}, blistCommonNS.formInliner.defaults, options);
    var $form = $(event.target);
    var model = blist.$display.blistModel();
    var view  = model.cleanViewForPost(blist.display.view);

    $form.append(
            $('<input type="hidden" name="view"/>')
                .val(JSON.stringify(view)))
        .append(
            $('<input type="hidden" name="method" value="index" />'))
        .attr('METHOD', opts.submitMethod);
}

blistCommonNS.formInliner.defaults = {
    submitMethod: 'post',
};

// Grab links to download and auto-create a form if inline
(function($)
{
    $.fn.downloadToFormCatcher = function()
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
                    .attr('ACTION', href);

                blist.$display.append($form);
                $form.bind('submit', blistCommonNS.formInliner);
                $form.submit();
            });
        });
    }
})(jQuery);
