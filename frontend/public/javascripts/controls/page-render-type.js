(function($) {
  $.fn.pageRenderType = function(options) {
    // Check if object was already created
    var pageRenderType = $(this[0]).data('pageRenderType');
    if (!pageRenderType) {
      pageRenderType = new PageRenderTypeObj(options, this[0]);
    }
    return pageRenderType;
  };

  var PageRenderTypeObj = function(options, dom) {
    this.settings = $.extend({}, PageRenderTypeObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(PageRenderTypeObj, {
    defaults: {
      defaultRowId: null,
      view: null
    },

    prototype: {
      init: function() {
        var prtObj = this;
        var $domObj = prtObj.$dom();
        $domObj.data('pageRenderType', prtObj);

        prtObj.richRenderer = prtObj.$content().richRenderer({
          columnCount: 2,
          config: ((prtObj.settings.view.metadata || {}).richRendererConfigs || {}).page,
          view: prtObj.settings.view
        });

        $domObj.bind('resize', function() {
          resizeHandle(prtObj);
        });

        prtObj.navigation = $domObj.find('.navigation').bind('page_changed', function(e, userInteraction) {
          renderCurrentRow(prtObj, userInteraction);
        }).navigation({
          pageSize: 1,
          view: prtObj.settings.view
        });

        prtObj._shown = false;
        var mainUpdate = function() {
          if (!prtObj._shown) {
            return;
          }
          prtObj.richRenderer.renderLayout();
          renderCurrentRow(prtObj);
        };
        var rowsChanged = function() {
          // Need to re-find current row ID
          if (!$.isBlank(prtObj._currentRowId)) {
            prtObj.displayRowByID(prtObj._currentRowId);
          } else {
            renderCurrentRow(prtObj);
          }
        };
        var rowChange = function(rows, fullReset) {
          if (!prtObj._shown) {
            return;
          }
          if (fullReset) {
            mainUpdate();
          } else {
            var cp = prtObj.navigation.currentPage();
            if ($.isBlank(cp)) {
              return;
            }
            _.each(rows, function(r) {
              var realRow = prtObj.settings.view.rowForID(r.id);
              if (!$.isBlank(realRow) && realRow.index == cp) {
                renderCurrentRow(prtObj);
              }
            });
          }
        };
        prtObj.settings.view.
          bind('columns_changed', mainUpdate).
          bind('query_change', rowsChanged).
          bind('row_change', rowChange).
          bind('row_count_change', rowsChanged);

        prtObj.$dom().bind('show', function() {
          prtObj._shown = true;
          resizeHandle(prtObj);
          mainUpdate();
        });
        prtObj.$dom().bind('hide', function() {
          prtObj._shown = false;
        });

        $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId) {
          var sameDS = true;
          if (typeof rowId == 'string' && rowId.indexOf('/') > -1) {
            var splitRowId = rowId.split('/');
            sameDS = splitRowId[0] == prtObj.settings.view.id || splitRowId[0] == blist.dataset.id;
            rowId = splitRowId[1];
          }

          if (sameDS && !$.isBlank(rowId)) {
            prtObj.displayRowByID(rowId);
          }
        });

        if (!$.isBlank(prtObj.settings.defaultRowId)) {
          prtObj.displayRowByID(prtObj.settings.defaultRowId);
        }
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
          if (this._$dom.children().length < 1) {
            this._$dom.append($.renderTemplate('pageRenderType'));
            this._$dom.addClass('pageRenderType navRenderType');
          }
        }
        return this._$dom;
      },

      $content: function() {
        if (!this._$content) {
          this._$content = this.$dom().find('.content');
        }
        return this._$content;
      },

      $noResults: function() {
        if (!this._$noResults) {
          this.$dom().append($.tag({
            tagName: 'div',
            'class': 'noResults',
            contents: $.t('controls.grid.no_rows')
          }));
          this._$noResults = this.$dom().find('.noResults');
        }
        return this._$noResults;
      },

      displayRowByID: function(rowId) {
        var prtObj = this;

        prtObj._currentRowId = rowId;
        prtObj.settings.view.rowIndex(rowId, function(rowIndex) {
          if ($.isBlank(rowIndex)) {
            rowIndex = 0;
          }
          prtObj.navigation.displayPage(rowIndex);
        });
      }
    }
  });

  var resizeHandle = function(prtObj) {
    prtObj.$content().height(prtObj.$dom().height() -
      (prtObj.$content().outerHeight(true) - prtObj.$content().height()));
    prtObj.richRenderer.adjustLayout();
  };

  var renderCurrentRow = function(prtObj, updateId) {
    if ($.isBlank(prtObj.navigation.currentPage()) || prtObj.settings.view.totalRows() < 1) {
      prtObj.$content().hide();
      prtObj.$noResults().show();
      return;
    }

    prtObj.$content().show();
    prtObj.$noResults().hide();

    var rowLoaded = function(rows) {
      if (rows.length != 1) {
        return;
      }
      var row = rows[0];

      if (updateId) {
        prtObj._currentRowId = row.id;
      }
      if (prtObj._shown) {
        prtObj.settings.view.highlightRows(row, 'select');
      }
      prtObj.richRenderer.renderRow(prtObj.$content(), row, true);
      prtObj.richRenderer.adjustLayout();
    };
    var delay = 500;
    var loadRows;
    loadRows = function() {
      prtObj.settings.view.getRows(prtObj.navigation.currentPage(), 1, rowLoaded,
        function() {
          setTimeout(loadRows, delay);
          delay *= 2;
        });
    };
    loadRows();
  };

})(jQuery);
