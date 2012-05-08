(function($){$(function()
{
    $.fn.socrataJqm = function()
    {
        this.jqm({
            trigger: false,
            modal: true,
            onShow: function(jqm)
            {
                $('.menu').trigger('menu-close');
                if (!_.isUndefined(blist.events))
                { $(document).trigger(blist.events.MODAL_SHOWN); }
                jqm.w.fadeIn('slow');
                jqm.o.fadeIn('slow');
            },
            onHide: function(jqm)
            {
                jqm.w.fadeOut('slow');
                jqm.o.fadeOut('slow', function()
                {
                    if (!_.isUndefined(blist.events))
                    { $(document).trigger(blist.events.MODAL_HIDDEN); }
                });
            }
        });
    };

    // Set up modals
    $('.modalDialog, #modals > *').socrataJqm();
    $.live('a.jqmClose', 'click', function(event)
    {
        event.preventDefault();
        $(this).closest('.modalDialog').jqmHide();
    });

});})(jQuery);
