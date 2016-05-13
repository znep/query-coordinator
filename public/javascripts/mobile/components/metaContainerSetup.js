(function() {
  var $metadataContent = $('#metadata-content');

  $('#button-toggle-metadata').on('click', function() {
    var showing = $(this).data('open');
    var self = $(this);

    if (showing) {
      self.html('show metadata');
      self.data('open', false);
    } else {
      self.html('hide metadata');
      self.data('open', true);
    }
    $metadataContent.toggleClass('hidden');
  });

  $('.meta-go-link').on('click', function() {
    var url = window.location.href;
    var aUrlParts = url.split('/mobile');
    window.location = aUrlParts[0];
  });

  var $window = $(window);
  var $navbar = $('.navbar');
  var lastScrollTop = 0;
  var wasScrollingDown = false;

  $window.scroll(function() {
    var stp = $window.scrollTop();

    if ((stp + 20) > lastScrollTop && stp > 0) {
      if (!wasScrollingDown) {
        wasScrollingDown = true;

        $navbar.removeClass('navbar-visible').addClass('navbar-hidden');
        $('#navbar').removeClass('in').attr('aria-expanded','false');
      }
    } else {
      if (wasScrollingDown) {
        wasScrollingDown = false;

        $navbar.removeClass('navbar-hidden').addClass('navbar-visible');
      }
    }

    lastScrollTop = stp;
  });
})();
