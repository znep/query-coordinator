(function($) {
  /* This plugin is designed to take a container with children that should
   * expand to fill the page, minus all of its siblings.  The container may
   * have mulitple switchable panes, each of which fills the height.  So all
   * children will actually be set to fill the height, not the container iteself.
   * Additionally, each of these children may have a component (selectable
   * via a parameter) that should fill it when visible. */
  $.fn.fullScreen = function(options) {
    // Check if object was already created
    var fullScreen = $(this[0]).data('fullScreen');
    if (!fullScreen) {
      fullScreen = new FullScreenObj(options, this[0]);
    }
    return fullScreen;
  };

  var FullScreenObj = function(options, dom) {
    this.settings = $.extend({}, FullScreenObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(FullScreenObj, {
    defaults: {
      fullHeightSelector: '.fullHeight'
    },

    prototype: {
      init: function() {
        var currentObj = this;
        var $domObj = currentObj.$dom();
        $domObj.data('fullScreen', currentObj);

        currentObj.adjustSize();
        $(window).resize(function() {
          currentObj.adjustSize();
        });
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      },

      adjustSize: function() {
        var fsObj = this;
        if (fsObj._disabled) {
          return;
        }

        var targetHeight = $(window).height();

        fsObj.$dom().parents().andSelf().each(function() {
          var $t = $(this);
          targetHeight -= $t.outerHeight() - $t.height();
        });

        targetHeight -= siblingsHeight(fsObj.$dom(), fsObj);

        fsObj.$dom().children().height(targetHeight).each(function() {
          var $t = $(this);
          if (!$t.is(':visible')) {
            return;
          }

          // IE7 would hang/take a long time switching render types
          // if the selector + :visible was run in one shot
          $t.find(fsObj.settings.fullHeightSelector).filter(':visible').each(function() {
            var $f = $(this);
            // If we have multiple fullHeight siblings, give the first one
            // a bit more than an even share; then fit the rest in evenly
            var $fh = $f.siblings(fsObj.settings.fullHeightSelector).filter(':visible').add($f);
            var multiplier = 1;

            // EN-18335 - Update and refactor grid view CSS
            //
            // Enabling the new Socrata Viz table in the grid view caused a few rendering bugs.
            // In this case our special treatment of the first fullHeight sibling (usually not
            // the table itself) casued the space allotted to the new table in the smallest SDP
            // widget size to be too small for the table to even render one row, which would
            // make it look broken. Moving forward, if the user has selected more than one
            // fullHeight render type, we will split the available vertical space equally among
            // all of them (but only if the new '2017' grid view update is enabled).
            if (
              !_.get(window, 'socrata.featureFlags.enable_2017_grid_view_refresh', false) &&
              $fh.length > 1
            ) {
              var adjFactor = 1.3333;
              multiplier = $fh.index($f) == 0 ? adjFactor :
                ($fh.length - adjFactor) / ($fh.length - 1);
            }
            $f.height(Math.floor(($f.parent().innerHeight() - siblingsHeight($f, fsObj)) *
              multiplier / $fh.length));
          });
        });
      },

      enable: function() {
        this._disabled = false;
        this.adjustSize();
      },

      disable: function() {
        this._disabled = true;
        this.$dom().children().height('auto').find(this.settings.fullHeightSelector).height('auto');
      }
    }
  });

  var siblingsHeight = function($item, fsObj) {
    var h = 0;
    $item.siblings(':visible').each(function() {
      var $t = $(this);
      if ($t.is(fsObj.settings.fullHeightSelector)) {
        return;
      }
      if ($t.css('position') != 'fixed' &&
        $t.css('position') != 'absolute') {
        h += $t.outerHeight(true);
      }
    });
    return h;
  };

})(jQuery);
