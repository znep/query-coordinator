(function($){$(function()
{
// OLD JQM CODE -- TO BE PHASED OUT DUE TO JQUERY 1.9
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

// /JQM

    var $overlay = $('.socrataModal');
    var $wrapper = $('.socrataModal .socrataModalWrapper');
    var $body = $('body');
    var modalAnimLength = 800; // could use webkitTransitionEnd but that's, well, webkit

    // util
    var afterComplete = function(f) { window.setTimeout(f, modalAnimLength); };

    // state and setup
    $overlay.hide(); // can't do in css since we use classes to transition
    var overlayStatus = 'hidden';

    // overlay funcs
    var showOverlay = function()
    {
        if ((overlayStatus !== 'hiding') && (overlayStatus !== 'hidden')) { return; }

        $overlay.show();
        $body.css('overflow-y', 'hidden');
        overlayStatus = 'showing';

        _.defer(function()
        {
            $overlay.addClass('shown');
            afterComplete(function()
            {
                if (overlayStatus === 'hiding') { return; }

                // if we let it always be auto we get render
                // artifacts on the transition
                $wrapper.css('overflow', 'auto');
                overlayStatus = 'shown';
            });
        });
    };
    var hideOverlay = function()
    {
        if ((overlayStatus !== 'showing') && (overlayStatus !== 'shown')) { return; }

        $overlay.removeClass('shown');
        overlayStatus = 'hiding';

        $wrapper.css('overflow', 'visible');
        $body.css('overflow-y', 'visible');

        afterComplete(function()
        {
            if (overlayStatus === 'showing') { return; }

            $overlay.hide();
            overlayStatus = 'hidden';
        });
    };
    var pushModal = function($contents)
    {
        // if we have no modal, show it
        if ((overlayStatus !== 'showing') && (overlayStatus !== 'shown')) { showOverlay(); }

        // now push the previous modal if it exists
        var $previous = $wrapper.children(':last-child');
        if ($previous.length > 0)
        {
            $previous.addClass('pushed');
            afterComplete(function() { $previous.hide(); });
        }

        // last deal with the new modal
        $contents.addClass('modalContents');
        $wrapper.append($contents);

        _.defer(function()
        {
            $contents.addClass('shown');
            $contents.find('input:first').focus(); // focus on an input if we can
        });
    };
    var popModal = function(hideAll)
    {
        // first hide the last modal
        var $current = $wrapper.children(':last-child');
        $current.removeClass('shown');
        afterComplete(function() { $current.remove(); });

        // now either hide the overlay as well, or reshow the previous modal
        var $previous = $current.prev();
        if (hideAll === true)
        {
            $current.prevAll().remove();
            hideOverlay();
        }
        else if ($previous.length > 0)
        {
            $previous.show();
            _.defer(function() { $previous.removeClass('pushed'); });
        }
        else
        {
            hideOverlay();
        }
    };

    $.fn.showModal = function() { pushModal($(this)); };

    $(document).on('keyup', ':not(:input)', function(event)
    {
        if (event.keyCode === 27)
        {
            popModal();
        }
    });
    $wrapper.on('click', function(event)
    {
        if (event.target === this)
        {
            popModal(true);
        }
    });
    $wrapper.on('click', '.jqmHide', function(event)
    {
        event.preventDefault();
        popModal();
    });

});})(jQuery);
