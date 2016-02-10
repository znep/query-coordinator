import $ from 'jquery';

import './flannel.scss';

var FlannelUtils;

(function() {
  'use strict';

  FlannelUtils = {
    init: function() {
      var self = this;

      if ( $('#flannel-overlay').length === 0) {
        $('<div/>', {
          id: 'qfb-flannel-overlay',
          class: 'hidden'
        }).
        appendTo('body').
        on('click', function() {
          self.closeAll();
        });
      }
      self.checkMobile();

      $(window).resize(function() {
        self.checkMobile();
        self.updateFlannels();
      });
    },

    checkMobile:  function() {
      var windowWidth = $(window).width();
      (windowWidth <= 768) ? $('body').addClass('is-mobile') : $('body').removeClass('is-mobile');
    },

    openFlannelForId: function(componentId) {
      var $flannelOverlay = $('#qfb-flannel-overlay');
      $flannelOverlay.removeClass('hidden');

      var $component = $('#qf-' + componentId);
      $component.find('.qfb-filter-item-flannel').removeClass('hidden');

      $('body').addClass('is-modal-open');
    },

    closeAll: function() {
      $('#qfb-flannel-overlay').addClass('hidden');

      $('.qfb-filter-item-flannel').each(function(i, elem) {
        if (!$(elem).hasClass('hidden')) {
          $(elem).addClass('hidden');
        }
      });

      $('body').removeClass('is-modal-open');
    },

    showOverlay: function() {
      var $flannelOverlay = $('#qfb-flannel-overlay');

      if ($flannelOverlay.hasClass('hidden')) {
        $flannelOverlay.removeClass('hidden');
      }
    },

    updateFlannels: function() {
      var screenHalfWidth = $(window).width() / 2 - 50;

      $('.qfb-filter-item').each(function(i, elem) {
        var $childFlannel = $(elem).find('.qfb-filter-item-flannel');

        $(elem).offset().left > screenHalfWidth ?
          $childFlannel.addClass('flannel-right') : $childFlannel.removeClass('flannel-right');
      });
    }

  };

})();

export default FlannelUtils;
