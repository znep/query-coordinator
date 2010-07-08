$(function()
{
    // Set up modals
    $('.modalDialog, #modals > *').jqm({
        trigger: false,
        modal: true,
        onShow: function(jqm)
        {
            $('.menu').trigger('menu-close');
            $(document).trigger(blist.events.MODAL_SHOWN);
            jqm.w.fadeIn('slow');
            jqm.o.fadeIn('slow');
        },
        onHide: function(jqm)
        {
            jqm.w.fadeOut('slow');
            jqm.o.fadeOut('slow', function()
            { $(document).trigger(blist.events.MODAL_HIDDEN); });
        }
    });
    $.live('a.jqmClose', 'click', function(event)
    {
        event.preventDefault();
        $(this).closest('.modalDialog').jqmHide();
    });
});
