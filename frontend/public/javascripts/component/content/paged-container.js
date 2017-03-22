(function($) {

  $.component.Container.extend('Paged Container', 'none', { //'content', {
    _init: function() {
      this._pages = [];
      this._super.apply(this, arguments);
      this.registerEvent({
        page_shown: 'newPage',
        page_added: 'pages',
        page_removed: 'pages',
        page_count_changed: []
      });
    },

    visibleId: function(newId) {
      var newP;
      if (!$.isBlank(newId)) {
        this.eachPage(function(p) {
          if (p.id == newId) {
            newP = p;
          }
        });
      }
      return (this._visiblePage(newP) || {}).id;
    },

    visibleIndex: function(newIndex) {
      var p = this.pages();
      if (!$.isBlank(newIndex)) {
        var cObj = this;
        cObj._getPage(newIndex, function(page) {
          cObj._visiblePage(page);
        });
      } else {
        return _.indexOf(p, this._visiblePage());
      }
    },

    viewNext: function(preventWrap) {
      var p = this.pages();
      var cp = this.countPages();
      var newI = _.indexOf(p, this._visiblePage()) + 1;
      if (preventWrap && newI >= cp) {
        return;
      }

      var cObj = this;
      cObj._getPage(newI % cp, function(page) {
        cObj._visiblePage(page);
      });
    },

    viewPrevious: function(preventWrap) {
      var p = this.pages();
      var newI = _.indexOf(p, this._visiblePage()) - 1;
      if (preventWrap && newI < 0) {
        return;
      }

      var cp = this.countPages();
      var cObj = this;
      cObj._getPage((newI + cp) % cp, function(page) {
        cObj._visiblePage(page);
      });
    },

    viewFirst: function() {
      var p = this.countPages();

      if (p != 0) {
        var cObj = this;
        cObj._getPage(0, function(page) {
          cObj._visiblePage(page);
        });
      }
    },

    viewLast: function() {
      var p = this.countPages();

      if (p != 0) {
        var cObj = this;
        cObj._getPage(p - 1, function(page) {
          cObj._visiblePage(page);
        });
      }
    },

    pageSize: function() {
      return 1;
    },

    count: function() {
      if (!$.isBlank(this._childCount)) {
        return this._childCount;
      }
      return this._super.apply(this, arguments);
    },

    setCount: function(newCount) {
      this._childCount = newCount;
      this.trigger('page_count_changed');
    },

    pages: function() {
      return this._pages;
    },

    countPages: function() {
      return !$.isBlank(this._childCount) ? this._childCount : this._pages.length;
    },

    eachPage: function(fn, scope) {
      var cObj = this;
      var result;
      _.any(cObj._pages, function(p) {
        var r = fn.call(scope || cObj, p);
        if (r !== undefined) {
          result = r;
          return true;
        }
      });
      return result;
    },

    mapPage: function(fn, scope) {
      var result = [];
      this.eachPage(function(page) {
        result.push(fn.call(scope, page));
      });
      return result;
    },

    each: function(fn, scope) {
      var cObj = this;
      var result;
      _.any(cObj._pages, function(c) {
        var r = fn.call(scope || cObj, c);
        if (r !== undefined) {
          result = r;
          return true;
        }
      });
      return result;
    },

    add: function(child, position, forceAdd) {
      var cObj = this;
      var r;
      if (forceAdd) {
        child._domAdded = true;
        r = this._super(child);
      }

      if (_.isArray(child)) {
        _.each(child, function(c) {
          cObj.add(c);
        });
        return r;
      }

      if (child._parCont == this) {
        return r;
      }

      if (!(child instanceof $.component.Component)) {
        child = $.component.create(child, cObj._componentSet);
      }

      // We want to initialize any functional components, but they go into their own store
      // and not into the DOM
      if (child instanceof $.component.FunctionalComponent) {
        this._funcChildren = this._funcChildren || [];
        this._funcChildren.push(child);
        return null;
      }

      var $existDom;
      if ($.isBlank(child.$dom) && ($existDom = this.$contents.children('#' + child.id)).length > 0) {
        $existDom.addClass('hide');
      }
      child._parCont = this;
      if (_.isNumber(position)) {
        this._pages[position] = child;
      } else {
        this._pages.push(child);
      }
      this.trigger('page_added', [{
        pages: [child]
      }]);
      return r;
    },

    empty: function() {
      this.eachPage(function(child) {
        delete child.parent;
        child.destroy();
      });
      this.trigger('page_removed', [{
        pages: this._pages
      }]);
      this._pages = [];
      delete this._currentPage;
      this._super();
    },

    fetchAll: function() {
      var cObj = this;
      if (!$.isBlank(cObj.parent)) {
        cObj.parent.fetchChildren(0, cObj.count(), function(items) {
          _.each(items, function(item) {
            cObj.add(item.row, item.index);
          });
        });
      }
    },

    _getPage: function(newIndex, callback) {
      newIndex = parseInt(newIndex);
      var cObj = this;
      var p = cObj.pages();
      if (!$.isBlank(p[newIndex])) {
        callback(p[newIndex]);
      } else if (!$.isBlank(cObj.parent)) {
        cObj.parent.fetchChildren(newIndex, 1, function(items) {
          _.each(items, function(item) {
            cObj.add(item.row, item.index);
          });
          callback(p[newIndex]);
        });
      }
    },

    _visiblePage: function(newPage) {
      if (!$.isBlank(newPage) && newPage != this._currentPage) {
        this._currentPage = newPage;
        this._arrange();
      }
      return this._currentPage;
    },

    _hidePage: function(page) {
      page.$dom.addClass('hide');
      page.$contents.trigger('hide');
    },

    _showPage: function(page, finalCallback) {
      if (!page._initialized) {
        this.add(page, null, true);
      }
      page.properties({
        height: this._properties.height,
        hidden: false
      });
      if (!page._rendered) {
        page._render();
      }
      page.$dom.removeClass('hide');
      if (_.isFunction(page.each)) {
        page.each(function(child) {
          child.$dom.removeClass('hide');
        });
      }
      this.trigger('page_shown', [{
        newPage: page
      }]);
      page.$contents.trigger('show');
      $.component.sizeRenderRefresh();
      if (_.isFunction(finalCallback)) {
        finalCallback();
      }
    },

    _arrange: function() {
      var cObj = this;
      if ($.isBlank(cObj._currentPage) && !_.isEmpty(cObj._pages)) {
        // Hide any pre-rendered items first
        cObj.$dom.children().addClass('hide');
        if ($.subKeyDefined(cObj, '_properties.defaultPage')) {
          var defPage = cObj._stringSubstitute(cObj._properties.defaultPage);
          cObj._currentPage = _.detect(cObj._pages, function(p) {
            return p.id == defPage;
          });
          // Maybe it is a page number?
          if ($.isBlank(cObj._currentPage)) {
            var pageNum = parseInt(defPage);
            if (_.isNumber(pageNum) && pageNum < cObj._pages.length && pageNum >= 0) {
              cObj._currentPage = cObj._pages[pageNum];
            }
          }
        }
        if ($.isBlank(cObj._currentPage)) {
          cObj._currentPage = _.first(cObj._pages);
        }
        if ($.subKeyDefined(cObj, '_currentPage.$dom')) {
          cObj._currentPage.$dom.addClass('hide');
        }
      }

      var finalHide;
      cObj.eachPage(function(page) {
        if (page && page != cObj._currentPage && !$.isBlank(page.$dom)) {
          var callback = cObj._hidePage(page);
          if ($.isBlank(finalHide)) {
            finalHide = callback;
          } else if (_.isFunction(callback)) {
            callback();
          }
        }
      });

      if (cObj._rendered) {
        if (!$.isBlank(cObj._currentPage) && cObj._currentPage.domOrAnyChildrenHidden()) {
          cObj._showPage(cObj._currentPage, finalHide);
        } else if (_.isFunction(finalHide)) {
          finalHide();
        }
      }
      cObj._super();
    },

    _childRemoved: function(child) {
      this._super.apply(this, arguments);
      this.trigger('page_removed', [{
        pages: [child]
      }]);
    },

    _moveChildDom: function(child) {
      if (!this._initialized) {
        if (child._initialized) {
          child.$dom.remove();
        }
        return;
      }
      if (!child._domAdded) {
        return;
      }

      // Only init, don't do a full render until visible
      if (!child._initialized) {
        child._initDom();
        child.$dom.addClass('hide');
        if (this._designing) {
          child.design(true);
        }
      }
      if ($.subKeyDefined(child, 'next.$dom') && child.next.$dom.parent().index(this.$ct) >= 0) {
        child.next.$dom.before(child.$dom);
      } else if (!$.isBlank(this.$ct)) {
        this.$ct.append(child.$dom);
      }
    },

    _testChildHit: function(child, pos, inSequence) {
      var childOffset = child.$dom.offset();
      return (inSequence && childOffset.left > pos.x) ||
        childOffset.left <= pos.x && childOffset.left + child.$dom.outerWidth(true) >= pos.x;
    },

    _dropCursorDirection: function() {
      return 'vertical';
    }
  });

})(jQuery);
