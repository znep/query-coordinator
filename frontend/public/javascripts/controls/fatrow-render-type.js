(function($) {
  $.fn.fatrowRenderType = function(options) {
    // Check if object was already created
    var fatrowRenderType = $(this[0]).data('fatrowRenderType');
    if (!fatrowRenderType) {
      fatrowRenderType = new FatrowRenderTypeObj(options, this[0]);
    }
    return fatrowRenderType;
  };

  var FatrowRenderTypeObj = function(options, dom) {
    this.settings = $.extend({}, FatrowRenderTypeObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  /**
   * EN-17685 - Make composite render types work with Socrata Viz Table
   *
   * Alternative render types such as the Fat Row, the Page and Visualizations work fine with
   * the Socrata Viz table, but certain functinalities (such as the column headers filter bar
   * here) contradict our effort to consolidate functionality into one single point of access
   * (such as making the filter pane the only place where filtering can be done).
   *
   * We therefore want to not render the fat row filter controls at all if we are using the
   * new Socrata Viz Table grid view.
   */
  var headersDisabled = _.get(window, 'blist.feature_flags.enable_2017_grid_view_refresh', false);

  $.extend(FatrowRenderTypeObj, {
    defaults: {
      pageSize: 20,
      view: null
    },

    prototype: {
      init: function() {
        var frObj = this;
        var $domObj = frObj.$dom();
        $domObj.data('fatrowRenderType', frObj);

        frObj.richRenderer = frObj.$template().richRenderer({
          balanceFully: true,
          columnCount: 3,
          config: ((frObj.settings.view.metadata || {}).richRendererConfigs || {}).fatRow,
          view: frObj.settings.view
        });

        frObj.navigation = frObj.$dom().find('.navigation').bind('page_changed', function() {
          renderCurrentPage(frObj);
        }).navigation({
          pageSize: frObj.settings.pageSize,
          view: frObj.settings.view
        });

        hookUpHeaders(frObj);

        $domObj.bind('resize', function() {
          resizeHandle(frObj);
        });

        frObj._shown = false;
        var mainUpdate = function() {
          if (!frObj._shown) {
            return;
          }
          renderHeaders(frObj);
          frObj.richRenderer.renderLayout();
          renderCurrentPage(frObj);
        };
        var rowChange = function(rows, fullReset) {
          if (!frObj._shown) {
            return;
          }
          if (fullReset) {
            mainUpdate();
          } else {
            _.each(rows, function(r) {
              updateRow(frObj, r);
            });
          }
        };
        var updateHeader = function() {
          var headerShown = (((frObj.settings.view.metadata || {}).richRendererConfigs || {}).
            fatRow || {}).headerShown;
          toggleHeader(frObj, $.isBlank(headerShown) || headerShown, true);
        };
        frObj.settings.view.
          bind('columns_changed', mainUpdate).
          bind('query_change', mainUpdate).
          bind('row_change', rowChange).
          bind('row_count_change', mainUpdate).
          bind('clear_temporary', updateHeader);

        frObj.$dom().bind('show', function() {
          frObj._shown = true;
          resizeHandle(frObj);
          mainUpdate();
        });
        frObj.$dom().bind('hide', function() {
          frObj._shown = false;
        });

        frObj.$dom().delegate('.rowList > .row', {
          'mouseenter': function() {
            var row = $(this).data('renderrow');
            if (!row.sessionMeta || !row.sessionMeta.highlight) {
              frObj.settings.view.highlightRows(row);
            }
          },
          'mouseleave': function() {
            var row = $(this).data('renderrow');
            if (row.sessionMeta && row.sessionMeta.highlight) {
              frObj.settings.view.unhighlightRows(row);
            }
          }
        });
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
          if (this._$dom.children().length < 1) {
            this._$dom.append($.renderTemplate('fatRowRenderType'));
            this._$dom.addClass('fatRowRenderType navRenderType');
          }
        }
        return this._$dom;
      },

      $list: function() {
        if (!this._$list) {
          this._$list = this.$dom().find('.rowList');
        }
        return this._$list;
      },

      $template: function() {
        if (!this._$template) {
          this._$template = this.$dom().find('.templateRow');
        }
        return this._$template;
      }
    }
  });

  var resizeHandle = function(frObj) {
    frObj.$list().height(frObj.$dom().height() -
      (frObj.$list().outerHeight(true) - frObj.$list().height()) -
      frObj.$dom().find('.columnHeaders').outerHeight(true));
    frObj.richRenderer.adjustLayout();
    var $headers = frObj.$dom().find('.columnHeaders');
    if ($headers.length > 0) {
      $headers.find('.scrollBox').toggleClass('hide',
        $headers[0].scrollHeight <= $headers.height());
    }
  };

  var hookUpHeaders = function(frObj) {

    if (headersDisabled) {
      return;
    }

    var $colHeaders = frObj.$dom().find('.columnHeaders');
    $colHeaders.delegate('.scrollBox a', 'click',
      function(e) {
        e.preventDefault();
        var action = $.hashHref($(this).attr('href')).toLowerCase();
        $colHeaders.animate({
          scrollTop: $colHeaders.scrollTop() +
            $colHeaders.children('.column:first-child').outerHeight(true) *
            (action == 'up' ? -1 : 1)
        });
      });

    $colHeaders.delegate('.controlsBox a.close, .controlsBox a.expand', 'click',
      function(e) {
        e.preventDefault();
        toggleHeader(frObj, $(this).hasClass('expand'));
      });

    var headerShown = (((frObj.settings.view.metadata || {}).richRendererConfigs || {}).
      fatRow || {}).headerShown;
    toggleHeader(frObj, $.isBlank(headerShown) || headerShown, true);

    var hoverTimer;
    $colHeaders.hover(
      function() {
        clearTimeout(hoverTimer);
        if ($colHeaders.hasClass('collapsed')) {
          $colHeaders.addClass('hover');
        }
      },
      function() {
        hoverTimer = setTimeout(function() {
          $colHeaders.removeClass('hover');
        }, 1000);
      });
  };

  var toggleHeader = function(frObj, isShow, skipUpdate) {

    if (headersDisabled) {
      return;
    }

    frObj.$dom().find('.columnHeaders').toggleClass('collapsed', !isShow).toggleClass('hover', !isShow).
      trigger('resize');
    if (!skipUpdate) {
      var md = $.extend(true, {
        richRendererConfigs: {
          fatRow: {}
        }
      }, frObj.settings.view.metadata);
      md.richRendererConfigs.fatRow.headerShown = isShow;
      frObj.settings.view.update({
        metadata: md
      }, false, true);
    }
  };

  var renderHeaders = function(frObj) {

    if (headersDisabled) {
      return;
    }

    var $headerList = frObj.$dom().find('.columnHeaders');
    if ($.isBlank(frObj._colTips)) {
      frObj._colTips = {};
    }

    var newItems = [];
    _.each(frObj.richRenderer.visibleColumns(), function(c) {

      var $columnBox = $.renderTemplate('fatRowColumn', c, {
        '.column@class+': 'renderTypeName',
        '.name': 'name!'
      });
      var $col = $columnBox.find('.info');

      var tooltipContent = blist.datasetControls.getColumnTip(c);

      var tipsRef = frObj._colTips;

      var cleanTip = function(tip) {
        if (tip.$dom.isSocrataTip()) {
          tip.$dom.socrataTip().hide();
          tip.$dom.socrataTip().disable();
        }
        clearShowTimer(tip);
      };

      // Make sure this is bound only once
      $col.parent().unbind('rerender.columnTip');
      $col.parent().bind('rerender.columnTip', function() {
        _.each(tipsRef, function(tip) {
          cleanTip(tip);
        });
      });

      var clearShowTimer = function(item) {
        clearTimeout(item.timer);
        delete item.timer;
      };


      if (!$.isBlank(tipsRef[c.id])) {
        cleanTip(tipsRef[c.id]);
      }
      tipsRef[c.id] = {
        $dom: $col
      };

      var showTip = function() {
        tipsRef[c.id].timer = setTimeout(function() {
          delete tipsRef[c.id].timer;
          $col.socrataTip().show();
        }, 300);
      };


      // Use mouseover for showing tip to catch when it moves onto
      // the menuLink.
      // Use mouseleave for hiding to catch when it leaves the entire header
      $col.socrataTip({
        content: tooltipContent,
        trigger: 'click',
        parent: 'body'
      });
      $col.mouseover(function(e) {
          if (!$(e.target).hasClass('menuLink')) {
            clearShowTimer(tipsRef[c.id]);
            showTip();
          } else {
            clearShowTimer(tipsRef[c.id]);
            $col.socrataTip().hide();
          }
        }).
        mouseleave(function() {
          clearShowTimer(tipsRef[c.id]);
          $col.socrataTip().hide();
        });


      $col.data('column', c);

      $col.columnMenu({
        column: c,
        $col: $col,
        columnDeleteEnabled: frObj.settings.columnDeleteEnabled,
        columnPropertiesEnabled: frObj.settings.columnPropertiesEnabled,
        editColumnCallback: frObj.settings.editColumnCallback,
        view: frObj.settings.view
      });

      newItems.push($columnBox);
    });

    // Wait until the end to empty out the old items; or else they lose their
    // data (meaning socrataTip-ness) and can't be cleaned out by columnTip,
    // resulting in stuck tips
    $headerList.empty();
    _.each(newItems, function($c) {
      $headerList.append($c);
    });
    $headerList.append($.tag({
      tagName: 'div',
      'class': 'controlsBox',
      contents: [{
        tagName: 'div',
        'class': 'scrollBox',
        contents: [{
          tagName: 'a',
          'class': ['scrollLink', 'upArrowDark'],
          'href': '#Up',
          contents: {
            tagName: 'span',
            'class': 'icon'
          }
        }, {
          tagName: 'a',
          'class': ['scrollLink', 'downArrowDark'],
          'href': '#Down',
          contents: {
            tagName: 'span',
            'class': 'icon'
          }
        }]
      }, {
        tagName: 'a',
        'class': 'close',
        'href': '#Hide',
        title: 'Hide column headers',
        contents: {
          tagName: 'span',
          'class': 'icon'
        }
      }, {
        tagName: 'a',
        'class': ['expand', 'add'],
        'href': '#Expand',
        title: 'Show column headers',
        contents: {
          tagName: 'span',
          'class': 'icon'
        }
      }]
    }));

    frObj.$dom().trigger('resize');
  };

  var renderNewRow = function(frObj, r) {
    var $item = frObj.$template().clone().removeClass('templateRow');
    frObj.richRenderer.renderRow($item, r);
    frObj.$list().append($item);
  };

  var renderCurrentPage = function(frObj) {
    frObj.$list().empty();

    if ($.isBlank(frObj.navigation.currentPage()) || frObj.settings.view.totalRows() < 1) {
      frObj.$list().append($.tag({
        tagName: 'div',
        'class': 'noResults',
        contents: $.t('controls.grid.no_rows')
      }));
      return;
    }

    var rowsLoaded = function(rows) {
      _.each(rows, function(r) {
        updateRow(frObj, r);
      });
    };

    var delay = 500;
    var loadRows;
    loadRows = function() {
      frObj.settings.view.getRows(frObj.navigation.currentPage() *
        frObj.settings.pageSize, frObj.settings.pageSize, rowsLoaded,
        function() {
          setTimeout(loadRows, delay);
          delay *= 2;
        });
    };
    loadRows();
  };

  var updateRow = function(frObj, row) {
    var cp = frObj.navigation.currentPage();
    var realRow = frObj.settings.view.rowForID(row.id);
    if ($.isBlank(cp) || (!$.isBlank(realRow) &&
        (realRow.index < cp * frObj.settings.pageSize ||
          realRow.index >= (cp + 1) * frObj.settings.pageSize))) {
      return;
    }

    var foundRow = false;
    frObj.$list().children('.row').each(function() {
      var $r = $(this);
      if ($r.data('renderrow').id == row.id) {
        if (!$.isBlank(realRow)) {
          frObj.richRenderer.renderRow($r, realRow);
        } else {
          $r.remove();
        }
        foundRow = true;
        return false;
      }
    });

    if (!foundRow && !$.isBlank(realRow)) {
      renderNewRow(frObj, realRow);
    }
  };

})(jQuery);
