$(function () {
  'use strict';

  var $article = $('article');
  var $intro = $('.intro');
  var $all = $('.all');
  var description = $('.all').find('.desc').html();
  var introText = description.substring(0, 85);

  $intro.find('.desc').html(introText);
  $intro.removeClass('hidden');

  $intro.find('.text-link').on('click', function() {
    // show all desc
    $intro.addClass('hidden');
    $all.removeClass('hidden');
  });

  $all.find('.text-link').on('click', function() {
    // show intro desc
    $all.addClass('hidden');
    $intro.removeClass('hidden');
  });

  var $window = $(window);
  var $navbar = $('.navbar');
  var lastScrollTop = 0;
  var wasScrollingDown = false;

  $window.scroll(function() {
    var stp = $window.scrollTop();

    if (stp > lastScrollTop) {
      if (!wasScrollingDown) {
        $navbar.
          removeClass('navbar-visible').
          addClass('navbar-hidden');
        $('#navbar').
          removeClass('in').
          attr('aria-expanded','false');

        wasScrollingDown = true;
      }
    } else {
      if (wasScrollingDown) {
        $navbar.
          removeClass('navbar-hidden').
          addClass('navbar-visible');

        wasScrollingDown = false;
      }
    }
    lastScrollTop = stp;
  });

});
