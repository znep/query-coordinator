(function($) {
  $(function() {
    // OLD JQM CODE -- TO BE PHASED OUT DUE TO JQUERY 1.9
    $.fn.socrataJqm = function() {
      this.jqm({
        trigger: false,
        modal: true,
        onShow: function(jqm) {
          jqm.w.find('iframe').each(function() {
            var $this = $(this),
              urlToLoad = $this.data('urltoload');

            if (!$.isBlank(urlToLoad)) {
              $this.attr('src', urlToLoad);
              $this.removeData('urltoload').removeAttr('data-urltoload');
            }
          });

          $('.menu').trigger('menu-close');
          if (!_.isUndefined(blist.events)) {
            $(document).trigger(blist.events.MODAL_SHOWN);
          }
          jqm.w.fadeIn('slow');
          jqm.o.fadeIn('slow');
        },
        onHide: function(jqm) {
          jqm.w.fadeOut('slow');
          jqm.o.fadeOut('slow', function() {
            if (!_.isUndefined(blist.events)) {
              $(document).trigger(blist.events.MODAL_HIDDEN);
            }
          });
        }
      });
    };

    // Set up modals
    $('.modalDialog, #modals > *').socrataJqm();
    $.live('a.jqmClose', 'click', function(event) {
      event.preventDefault();
      $(this).closest('.modalDialog').jqmHide();
    });

    // /JQM

    var $overlay = $('.socrataModal');
    var $wrapper = $('.socrataModal .socrataModalWrapper');
    var $body = $('body');
    var modalAnimLength = 500; // could use webkitTransitionEnd but that's, well, webkit
    var scrollTops = [];

    // util
    var afterComplete = function(f) {
      window.setTimeout(f, modalAnimLength);
    };

    // state and setup
    $overlay.hide(); // can't do in css since we use classes to transition
    var overlayStatus = 'hidden';

    // overlay funcs
    var showOverlay = function() {
      if ((overlayStatus !== 'hiding') && (overlayStatus !== 'hidden')) {
        return;
      }

      $overlay.show();
      $body.css('overflow-y', 'hidden');
      overlayStatus = 'showing';

      _.defer(function() {
        $wrapper.lockScroll(true);
        $overlay.addClass('shown');
        afterComplete(function() {
          if (overlayStatus === 'hiding') {
            return;
          }

          // if we let it always be auto we get render
          // artifacts on the transition
          $wrapper.css('overflow-y', 'scroll');
          overlayStatus = 'shown';
        });
      });
    };
    var hideOverlay = function() {
      if ((overlayStatus !== 'showing') && (overlayStatus !== 'shown')) {
        return;
      }

      $overlay.removeClass('shown');
      overlayStatus = 'hiding';

      $wrapper.css('overflow-y', 'visible');
      $body.css('overflow-y', 'visible');

      $wrapper.lockScroll(false);

      afterComplete(function() {
        if (overlayStatus === 'showing') {
          return;
        }

        $overlay.hide();
        overlayStatus = 'hidden';
      });
    };
    var pushModal = function($contents) {
      // if we have no modal, show it
      if ((overlayStatus !== 'showing') && (overlayStatus !== 'shown')) {
        showOverlay();
      }

      // now push the previous modal if it exists
      var $previous = $wrapper.children(':last-child');
      if ($previous.length > 0) {
        var top = $wrapper.scrollTop();
        scrollTops.push(top);
        $previous.css('top', (parseFloat($previous.css('top')) || 0) - top);

        $previous.addClass('pushed');
        afterComplete(function() {
          $previous.hide();
        });
      }

      // last deal with the new modal
      $contents.addClass('modalContents');
      $wrapper.append($contents);

      _.defer(function() {
        $contents.addClass('shown');
        $contents.find(':input:first').focus().filter(':text, textarea').caretToEnd(); // focus on an input if we can
      });
    };
    var popModal = function(hideAll) {
      // first hide the last modal
      var $current = $wrapper.children(':last-child');
      $current.removeClass('shown');
      afterComplete(function() {
        $current.remove();
      });

      // now either hide the overlay as well, or reshow the previous modal
      var $previous = $current.prev();
      if (hideAll === true) {
        $current.prevAll().remove();
        scrollTops = [];
        hideOverlay();
      } else if ($previous.length > 0) {
        $previous.show();
        _.defer(function() {
          $previous.removeClass('pushed');
          afterComplete(function() {
            var top = scrollTops.pop();
            $wrapper.scrollTop(top);
            $previous.css('top', parseFloat($previous.css('top')) + top);
          });
        });
      } else {
        hideOverlay();
      }
    };
    var modalLocked = function() {
      return $wrapper.children('.locked').length > 0;
    };

    $.fn.showModal = function() {
      var $this = $(this);
      pushModal($this);
      return $this;
    };
    $.showModal = function(name) {
      return $('#newModals > #' + name).clone().showModal();
    };
    $.popModal = popModal;

    $(document).on('keyup', function(event) {
      if ($(event.target).is(':not(:input)') && (event.keyCode === 27) && !modalLocked()) {
        popModal();
      }
    });
    $wrapper.on('click', function(event) {
      if (event.target === this && !modalLocked()) {
        popModal(true);
      }
    });
    $wrapper.on('click', '.jqmClose', function(event) {
      event.preventDefault();
      popModal();
    });
    // Radio/Checkboxes don't get focused on click, so manually hack it
    $wrapper.on('click', ':radio, :checkbox', function() {
      $(this).focus();
    });
    $wrapper.on('keyup', function(event) {
      if (event.keyCode === 13) {
        $wrapper.trigger('submit', event);
      }
    });

  });
})(jQuery);
