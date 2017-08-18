(function($) {
  $.fn.navigation = function(options) {
    // Check if object was already created
    var navigation = $(this[0]).data('navigation');
    if (!navigation) {
      navigation = new NavigationObj(options, this[0]);
    }
    return navigation;
  };

  var NavigationObj = function(options, dom) {
    this.settings = $.extend({}, NavigationObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(NavigationObj, {
    defaults: {
      pageSize: 20,
      view: null
    },

    prototype: {
      init: function() {
        var navObj = this;
        var $domObj = navObj.$dom();
        $domObj.data('navigation', navObj);

        hookUpNavigation(navObj);

        navObj._curPageIndex = 0;
        navObj._totalPages = null;
        navObj.settings.view.bind('row_count_change', function() {
          updateNavigation(navObj);
        }).bind('query_change', function() {
          navObj._curPageIndex = 0;
          updateNavigation(navObj);
          navObj.pageChanged();
        });

        updateNavigation(navObj);
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      },

      currentPage: function() {
        return this._curPageIndex;
      },

      pageChanged: function(userInteraction) {
        this.$dom().trigger('page_changed', [userInteraction]);
      },

      displayPage: function(index, userInteraction) {
        var navObj = this;
        navObj._curPageIndex = index;
        updateNavigation(navObj);
        navObj.pageChanged(userInteraction);
      }
    }
  });

  var hookUpNavigation = function(navObj) {
    navObj.$dom().delegate('.button', 'click', function(e) {
      var $a = $(this);
      if ($a.parent().hasClass('edit')) {
        return;
      }

      e.preventDefault();
      if ($a.hasClass('disabled')) {
        return;
      }

      switch ($.hashHref($a.attr('href'))) {
        case 'start':
          navObj.displayPage(0, true);
          break;
        case 'end':
          navObj.displayPage(-1, true);
          break;
        case 'previous':
          navObj.displayPage(navObj._curPageIndex - 1, true);
          break;
        case 'next':
          navObj.displayPage(navObj._curPageIndex + 1, true);
          break;
      }
    });

    navObj.$dom().delegate('.page a', 'click', function(e) {
      e.preventDefault();
      var $a = $(this);
      if ($a.parent().hasClass('active')) {
        return;
      }
      navObj.displayPage($a.parent().data('pagenum'), true);
    });
  };

  var updateNavigation = function(navObj) {
    var tr = navObj.settings.view.totalRows();
    if ($.isBlank(tr)) {
      return;
    }
    var pageCount = Math.ceil(tr / navObj.settings.pageSize);

    if (pageCount < 1) {
      navObj.$dom().addClass('hide');
      return;
    }
    navObj.$dom().removeClass('hide');

    // Make sure current page is within bounds
    if (navObj._curPageIndex < 0) {
      navObj._curPageIndex = pageCount + navObj._curPageIndex + 1;
    }
    if (navObj._curPageIndex >= pageCount) {
      navObj._curPageIndex = pageCount - 1;
    }

    var $info = navObj.$dom().find('.info');
    $info.find('.curPage').text(navObj._curPageIndex + 1);
    $info.find('.totalPages').text(pageCount.toLocaleString());

    navObj.$dom().find('.start, .previous').toggleClass('disabled', navObj._curPageIndex <= 0);
    navObj.$dom().find('.end, .next').toggleClass('disabled', navObj._curPageIndex >= pageCount - 1);

    if (pageCount != navObj._totalPages || navObj._incompletePager) {
      var $templLink = navObj.$dom().find('.page:first');
      navObj.$dom().find('.page + .page').remove();
      navObj.$dom().find('.remainder').remove();
      var $nextLink = navObj.$dom().find('.next').parent();

      var start = Math.max(0, navObj._curPageIndex - 4);
      var end = Math.min(pageCount - 1, navObj._curPageIndex + 4);
      for (var i = start; i <= end; i++) {
        var $newL = $templLink.clone(true).removeClass('active');
        $newL.attr('data-pagenum', i).data('pagenum', i).find('a').text(i + 1);
        $nextLink.before($newL);
      }
      $templLink.remove();

      navObj._incompletePager = false;
      if (start > 0) {
        navObj.$dom().find('.page:first').before('<li class="remainder">...</li>');
        navObj._incompletePager = true;
      }
      if (end < pageCount - 1) {
        navObj.$dom().find('.page:last').after('<li class="remainder">...</li>');
        navObj._incompletePager = true;
      }

      navObj._totalPages = pageCount;
    }

    navObj.$dom().find('.page').removeClass('active');
    navObj.$dom().find('.page[data-pagenum=' + navObj._curPageIndex + ']').addClass('active');
  };
})(jQuery);
