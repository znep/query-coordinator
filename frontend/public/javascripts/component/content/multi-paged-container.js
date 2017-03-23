(function($) {

  var DEFAULT_PAGE_SIZE = 5;

  $.component.PagedContainer.extend('Multi-Paged Container', 'none', {
    countPages: function() {
      return !$.isBlank(this._childCount) ? Math.ceil(this._childCount / this.pageSize()) :
      this._pages.length;
    },

    pageSize: function() {
      return this._properties.pageSize || DEFAULT_PAGE_SIZE;
    },

    /* Actual children added to the container */
    children: function() {
      return this._contentChildren;
    },

    each: function(fn, scope) {
      var cObj = this;
      var result;
      _.any(cObj._contentChildren, function(c) {
        var r = fn.call(scope || cObj, c);
        if (r !== undefined) {
          result = r;
          return true;
        }
      });
      return result;
    },

    empty: function() {
      this._super.apply(this, arguments);
      this._contentChildren = [];
    },

    add: function(child, position) {
      if (child._parCont == this) {
        return this._super.apply(this, arguments);
      }

      this._contentChildren = this._contentChildren || [];
      var index = _.isNumber(position) ? position : this._contentChildren.length;
      this._contentChildren[index] = child;

      if ($.isBlank(child.$dom)) {
        var $existDom = this.$contents.children('#' + child.id + ':visible');
        if ($existDom.length > 0) {
          child._carouselHidden = $existDom;
          $existDom.addClass('hide');
        }
      }

      var pageSize = this.pageSize();
      var pageIndex = Math.floor(index / pageSize);
      if ($.isBlank(this._pages[pageIndex])) {
        this._super(
          $.component.create(
            this._properties.container || {type: 'Container'},
            this._componentSet
          ),
          pageIndex
        );
      }
      child._indexInPage = (index - pageIndex * pageSize) % pageSize;

        // If the page already exists, add the item at the appropriate position
        if ($.subKeyDefined(this, '_pages.' + pageIndex + '.$dom')) {
          if (!$.isBlank(child._carouselHidden)) {
            child._carouselHidden.removeClass('hide');
          }
          var p = this._pages[pageIndex];
          var after = _.detect(p.children(), function(c) { return c._indexInPage > child._indexInPage; });
          p.add(child, after);
        }
      },

      _showPage: function(page) {
        if (!page._initialized) {
          var i = _.indexOf(this._pages, page);
          var numItems = this.pageSize();
          var c = this._contentChildren.slice(i * numItems, (i + 1) * numItems);
          _.each(c, function(_c) {
            if (!$.isBlank(_c._carouselHidden)) {
              _c._carouselHidden.removeClass('hide');
            }
          });
          page.add(c);
        }
        this._super.apply(this, arguments);
      },

      _getPage: function(newPage, callback) {
        newPage = parseInt(newPage);
        var cObj = this;
        var p = cObj.pages();
        if (!$.isBlank(p[newPage])) {
          callback(p[newPage]);
        } else if (!$.isBlank(cObj.parent)) {
          cObj.parent.fetchChildren(newPage * cObj.pageSize(), cObj.pageSize(), function(items) {
            _.each(items, function(item) {
              cObj.add(item.row, item.index);
            });
            callback(p[newPage]);
          });
        }
      },

    // The Container can pass the real children in here; ignore them if they're
    // not our interim page containers
    _moveChildDom: function(child) {
      if (child._parCont != this) {
        return;
      }
      this._super.apply(this, arguments);
    }
  });

})(jQuery);
