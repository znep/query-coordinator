var blistCommonNS = blist.namespace.fetch('blist.common');

// Attach the view as a hidden form parameter to allow
// printing/downloading inline views
blistCommonNS.formInliner = function(event)
{
    var $form = $(event.target);
    var view  = $form.data('dataset').cleanCopy();
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
    $.fn.downloadToFormCatcher = function(ds, $context)
    {
        return this.each(function()
        {
            var $dom = $(this);
            var lastClickTime;
            $dom.off('.downloadToFormCatcher');
            $dom.on('click.downloadToFormCatcher', function(event)
            {
                var lastClickTimeExceedsThrottle =
                  _.isUndefined(lastClickTime) || (_.now() - lastClickTime) > (30 * 1000);
                if (!lastClickTimeExceedsThrottle) {
                  return false;
                }

                lastClickTime = _.now();

                if (ds.temporary !== true)
                { return true; }

                event.preventDefault();

                var href = $dom.attr('href')
                    .replace(/\w{4}-\w{4}/,'INLINE');

                var $form = $('<form>')
                    .attr('ACTION', href)
                    .attr('method', 'post');

                $form.data('dataset', ds);
                ($context || $dom).append($form);
                $form.bind('submit', blistCommonNS.formInliner);
                $form.submit();
            });
        });
    }
})(jQuery);
