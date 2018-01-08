(function($) {
  var typeConfigs = {
    calendar: {
      name: 'calendar',
      domId: 'calendarRenderType',
      initFunction: 'socrataCalendar',
      javascripts: [{
        assets: 'shared-calendar'
      }],
      stylesheets: [{
          assets: 'display-calendar'
        },
        '/stylesheets/fullcalendar.css', {
          assets: 'rich-render-bundle'
        }
      ],
      scrollsInline: false
    },

    chart: {
      name: 'chart',
      domId: 'chartRenderType',
      initFunction: 'socrataChart',
      javascripts: [{
        assets: 'shared-chart'
      }],
      stylesheets: ['/stylesheets/chart-screen.css', {
        assets: 'rich-render-bundle'
      }, {
        assets: 'display-chart'
      }],
      scrollsInline: true,
      translations: ['controls.charts', 'controls.common.visualization']
    },

    form: {
      name: 'form',
      domId: 'staticRenderType',
      initFunction: function() {},
      scrollsInline: false
    },

    map: {
      name: 'map',
      domId: 'mapRenderType',
      initFunction: 'socrataMap',
      javascripts: [
        'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3', {
          assets: 'shared-map'
        }
      ],
      stylesheets: [{
        assets: 'render-images-bundle',
        hasImages: true
      }, {
        assets: 'display-map'
      }, {
        assets: 'rich-render-bundle'
      }],
      scrollsInline: true,
      translations: ['controls.map', 'controls.common.visualization']
    },

    geoRows: {
      name: 'geoRows',
      domId: 'mapRenderType',
      initFunction: 'socrataMap',
      javascripts: [
        'https://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3', {
          assets: 'shared-map'
        }
      ],
      stylesheets: [{
        assets: 'render-images-bundle',
        hasImages: true
      }, {
        assets: 'display-map'
      }, {
        assets: 'rich-render-bundle'
      }],
      scrollsInline: true,
      translations: ['controls.map', 'controls.common.visualization']
    },

    fatrow: {
      name: 'fatrow',
      domId: 'fatRowRenderType',
      initFunction: function($dom, settings) {
        $dom.fatrowRenderType($.extend({
          view: settings.view,
          columnDeleteEnabled: settings.editEnabled &&
            settings.view.type == 'blist' &&
            settings.view.hasRight(blist.rights.view.REMOVE_COLUMN),
          columnPropertiesEnabled: settings.editEnabled
        },
        settings.common,
        settings.fatrow));
      },
      javascripts: [{
        assets: 'shared-richRenderers'
      }],
      templates: ['fatrow', 'fatrow_header'],
      translations: ['screens.ds.column_tip', 'controls.grid'],
      reset: function() {
        this.$dom.children('.renderContent').removeData().
          children('.columnHeaders, .rowList').empty().end().
          children('.templateRow').removeData().empty();
      },
      stylesheets: [{
        assets: 'render-images-bundle',
        hasImages: true
      }, {
        assets: 'rich-render-bundle'
      }],
      scrollsInline: false
    },

    page: {
      name: 'page',
      domId: 'pageRenderType',
      initFunction: 'pageRenderType',
      javascripts: [{
        assets: 'shared-richRenderers'
      }],
      templates: ['page_render_type'],
      reset: function() {
        this.$dom.children('.renderContent').removeData().
          children('.content').empty().removeData().end().
          children('.navigation').removeData();
      },
      stylesheets: [{
        assets: 'render-images-bundle',
        hasImages: true
      }, {
        assets: 'rich-render-bundle'
      }],
      scrollsInline: false
    },

    href: {
      name: 'href',
      domId: 'staticRenderType',
      stylesheets: [{
        assets: 'dataset-about-minimal',
        hasSpecialSelectors: true
      }, {
        assets: 'display-blob'
      }],
      javascripts: [{
        assets: 'shared-blob'
      }],
      scrollsInline: false,
      initFunction: function($dom, settings) {
        $dom.blobDataset($.extend({
            view: settings.view,
            editEnabled: settings.editEnabled
          }, settings.common,
          settings.href));
      }
    },

    federated: {
      name: 'href',
      domId: 'staticRenderType',
      stylesheets: [{
        assets: 'dataset-about-minimal',
        hasSpecialSelectors: true
      }, {
        assets: 'display-blob'
      }],
      javascripts: [{
        assets: 'shared-blob'
      }],
      scrollsInline: false,
      initFunction: function($dom, settings) {
        $dom.blobDataset($.extend({
            view: settings.view,
            editEnabled: settings.editEnabled
          }, settings.common,
          settings.href));
      }
    },

    blob: {
      name: 'blob',
      domId: 'staticRenderType',
      stylesheets: [{
        assets: 'dataset-about-minimal',
        hasSpecialSelectors: true
      }, {
        assets: 'display-blob'
      }],
      javascripts: [{
        assets: 'shared-blob'
      }],
      scrollsInline: false,
      initFunction: function($dom, settings) {
        $dom.blobDataset($.extend({
            view: settings.view,
            editEnabled: settings.editEnabled
          }, settings.common,
          settings.blob));
      }
    }
  };

  // EN-17053/EN-16787 - Use socrata-viz table for NBE-only grid view
  //
  // This 'Render Type' defines the usage of the 'socrataVizTable' in the
  // context of the /dataset/four-four 'grid view'. It is meant to be a
  // mostly-drop-in replacement for the 'table' 'Render Type', which is the
  // grid view that was in use until July 2017 (and later, if the
  // 'enable_2017_grid_view_refresh' feature flag is set to 'false'
  // on the domain in question.
  var socrataVizTableTypeConfig = {
    name: 'socrataVizTable',
    domId: 'gridRenderType',
    javascripts: [{
      assets: 'shared-table-render'
    }],
    stylesheets: [],
    initFunction: function($dom, settings) {
      var settingsForSocrataVizDatasetGrid = $.extend(
        {
          view: settings.view,
          columnDeleteEnabled: false,
          columnPropertiesEnabled: false,
          columnNameEdit: false,
          showAddColumns: false,
          editEnabled: false
        },
        settings.common,
        settings.table
      );

      $dom.socrataVizDatasetGrid(settingsForSocrataVizDatasetGrid);
    },
    scrollsInline: true,
    translations: []
  };

  var legacyTableTypeConfig = {
    name: 'table',
    domId: 'gridRenderType',
    javascripts: [{
      assets: 'shared-table-render'
    }],
    stylesheets: [{
      assets: 'grid',
      hasImages: true
    }, {
      assets: 'render-images-bundle',
      hasImages: true
    }],
    initFunction: function($dom, settings) {
      $dom.datasetGrid($.extend({
          view: settings.view,
          columnDeleteEnabled: settings.editEnabled &&
            settings.view.type == 'blist' &&
            settings.view.hasRight(blist.rights.view.REMOVE_COLUMN),
          columnPropertiesEnabled: settings.columnEditEnabled,
          columnNameEdit: settings.columnEditEnabled &&
            (settings.view.isDefault() ||
              settings.view.type == 'grouped') &&
            settings.view.hasRight(blist.rights.view.UPDATE_COLUMN),
          showAddColumns: settings.editEnabled &&
            settings.view.type == 'blist' &&
            settings.view.hasRight(blist.rights.view.ADD_COLUMN),
          editEnabled: settings.editEnabled
        },
        settings.common,
        settings.table));
    },
    reset: function() {
      this.$dom.children('.renderContent').empty().removeData().removeClass('blist-table').off('.table');
    },
    scrollsInline: true,
    translations: ['controls.grid', 'screens.ds']
  };

  if (_.get(window, 'socrata.featureFlags.enable_2017_grid_view_refresh', false)) {
    typeConfigs.table = socrataVizTableTypeConfig;
  } else {
    typeConfigs.table = legacyTableTypeConfig;
  }

  typeConfigs.api = typeConfigs.table;
  typeConfigs.assetinventory = typeConfigs.table;
  typeConfigs.metadata_table = typeConfigs.table;

  $.fn.renderTypeManager = function(options) {
    // Check if object was already created
    var renderTypeManager = $(this[0]).data('renderTypeManager');
    if (!renderTypeManager) {
      renderTypeManager = new RenderTypeManagerObj(options, this[0]);
    }
    return renderTypeManager;
  };

  var RenderTypeManagerObj = function(options, dom) {
    this.settings = $.extend({}, RenderTypeManagerObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(RenderTypeManagerObj, {
    defaults: {
      defaultTypes: null,
      handleResize: true,
      view: null
    },

    prototype: {
      init: function() {
        var rtmObj = this;
        var $domObj = rtmObj.$dom();
        $domObj.data('renderTypeManager', rtmObj);

        $domObj.find('.renderTypeNode').addClass('hide');

        rtmObj.typeInfos = {};

        rtmObj.visibleTypes = {};

        rtmObj.settings.view.bind('valid', function() {
          if (!_.isEmpty(rtmObj.visibleTypes)) {
           _.each(rtmObj.visibleTypes, function(v, t) {
              if (v) {
                rtmObj.show(t);
              }
            });
          }
        }).
        bind('displaytype_change', function() {
          var toShow = $.extend({}, rtmObj.settings.view.metadata.renderTypeConfig.visible);
          _.each(_.keys(rtmObj.visibleTypes), function(vt) {
            if (!toShow[vt]) {
              rtmObj.hide(vt);
            }
          });
          _.each(toShow, function(v, t) {
            if (v) {
              rtmObj.show(t);
            }
          });
        });

        $domObj.delegate('.renderTypeNode > .divider .close', 'click', function(e) {
          e.preventDefault();
          rtmObj.hide($(this).closest('.renderTypeNode').data('rendertype'));
        });

        rtmObj._loadedTypes = {};

        var defTypes = rtmObj.settings.defaultTypes ||
          rtmObj.settings.view.metadata.renderTypeConfig.visible;
        if (_.isString(defTypes)) {
          var dt = {};
          dt[defTypes] = true;
          defTypes = dt;
        }

        _.each(defTypes, function(v, t) {

          if (v) {
            rtmObj.show(t);
          }
        });

        if (rtmObj.settings.handleResize) {
          $(window).bind('resize', function(e, source, forceUpdate) {
            if (source == this) {
              return;
            }
            _.each(rtmObj.visibleTypes, function(v, t) {
              rtmObj.$domForType(t).trigger('resize', [this, forceUpdate]);
            });
          });
        }
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      },

      setTypeConfig: function(type, newConfig) {
        var rtmObj = this;
        var typeInfo = getConfig(rtmObj, type);
        rtmObj.settings[typeInfo.name] = rtmObj.settings[typeInfo.name] || {};
        $.extend(rtmObj.settings[typeInfo.name], newConfig);
      },

      show: function(type, defArgs) {
        var rtmObj = this;
        var typeInfo = getConfig(rtmObj, type);

        rtmObj.visibleTypes[type] = true;
        if (!rtmObj.settings.view.valid) {
          return;
        }

        // if we have multiple possible child views,
        // and we've already initialized this type with a child
        // view that is different from the one in the dataset's
        // metadata (to be displayed), then reset the render type
        var activeId = $.deepGetStringField(rtmObj.settings.view,
          'metadata.renderTypeConfig.active.' + type + '.id');
        if (activeId && typeInfo.activeView &&
          typeInfo.activeView.id != activeId) {
          typeInfo._assetsLoaded = true;
          delete typeInfo._initialized;
          if (_.isFunction(typeInfo.reset)) {
            typeInfo.reset();
          }
        }

        initType(rtmObj, type, defArgs);

        if (typeInfo.$dom.is(':visible')) {
          return;
        }

        typeInfo.$dom.removeClass('hide').children('.renderContent').trigger('show');

        rtmObj.$dom().toggleClass('multipleRenderers',
          rtmObj.$dom().children('.renderTypeNode:visible').length > 1);
        rtmObj.$dom().trigger('render_type_shown', [type]);
        $(window).resize();
      },

      hide: function(type) {
        var rtmObj = this;

        var typeInfo = getConfig(rtmObj, type);

        delete rtmObj.visibleTypes[type];

        if (!typeInfo.$dom.is(':visible')) {
          return;
        }

        typeInfo.$dom.addClass('hide').children('.renderContent').trigger('hide');

        rtmObj.$dom().toggleClass('multipleRenderers',
          rtmObj.$dom().children('.renderTypeNode:visible').length > 1);
        rtmObj.$dom().trigger('render_type_hidden', [type]);
        $(window).resize();
      },

      toggle: function(type) {
        var rtmObj = this;
        if (rtmObj.visibleTypes[type]) {
          rtmObj.hide(type);
        } else {
          rtmObj.show(type);
        }
      },

      $domForType: function(type) {
        var rtmObj = this;
        initDom(rtmObj, type);
        return getConfig(rtmObj, type).$dom.children('.renderContent');
      }
    }
  });

  var getConfig = function(rtmObj, type) {
    if (_.isUndefined(rtmObj.typeInfos[type])) {
      var typeInfo = $.extend(true, {}, typeConfigs[type]);
      if ($.isBlank(typeInfo)) {
        throw 'missing type info for ' + type;
      }
      rtmObj.typeInfos[type] = typeInfo;
    }

    return rtmObj.typeInfos[type];
  };

  var initDom = function(rtmObj, type) {
    var typeInfo = getConfig(rtmObj, type);
    var $dom = typeInfo.$dom;
    if ($.isBlank($dom)) {
      $dom = rtmObj.$dom().find('.' + typeInfo.domId);
      if ($dom.length < 1) {
        // We want to create the DOM nodes in the order they appear in
        // availableDisplayTypes. So find the the next existing node after
        // this type. If this type isn't in ADT, stick it at the front
        var adt = rtmObj.settings.view.metadata.availableDisplayTypes;
        var $beforeItem;
        var curIndex = _.indexOf(adt, type);
        var $renderNodes = rtmObj.$dom().children('.renderTypeNode');

        if (curIndex < 0) {
          $beforeItem = $renderNodes.eq(0);
        }
        for (var i = curIndex + 1; i < adt.length && $.isBlank($beforeItem); i++) {
          var $r = $renderNodes.filter('[data-renderType=' + adt[i] + ']');
          if ($r.length > 0) {
            $beforeItem = $r;
          }
        }

        var name = _.get(rtmObj, 'settings.view.name', '');
        var $newNode = $.tag2({
          _: 'div',
          className: ['fullHeight', 'renderTypeNode', 'hide', typeInfo.domId],
          'data-renderType': type,
          'aria-label': name + ' (' + type + ')'
        });
        if ($.isBlank($beforeItem) || $beforeItem.length < 1) {
          rtmObj.$dom().append($newNode);
        } else {
          $beforeItem.before($newNode);
        }

        $dom = rtmObj.$dom().find('.' + typeInfo.domId);
      }

      if ($dom.children('.renderContent').length < 1) {
        var $content = $.tag({
          tagName: 'div',
          'class': ['renderContent', 'fullHeight']
        });
        $content.append($dom.children());
        $dom.append($content);
      }

      if ($dom.children('.divider').length < 1 && !rtmObj.settings.hideDividers) {
        $dom.prepend($.tag({
          tagName: 'div',
          'class': 'divider',
          contents: {
            tagName: 'a',
            href: '#Hide',
            'class': 'close',
            title: 'Hide section',
            contents: {
              tagName: 'span',
              'class': 'icon'
            }
          }
        }));
      }

      typeInfo.$dom = $dom;
    }
  };

  var initType = function(rtmObj, type, defArgs) {
    var typeInfo = getConfig(rtmObj, type);

    if (typeInfo._initialized) {
      return;
    }

    initDom(rtmObj, type);

    var $dom = typeInfo.$dom;
    var $content = $dom.find('.renderContent');

    var finishCallback = function() {
      rtmObj.settings.view.getViewForDisplay(type, function(view) {
        typeInfo.activeView = view;

        if (_.isFunction($.fn[typeInfo.initFunction])) {
          $content[typeInfo.initFunction]($.extend({
              view: view,
              deoptimizeRender: rtmObj.settings.deoptimizeRender,
              editEnabled: rtmObj.settings.editEnabled
            },
            rtmObj.settings.common, rtmObj.settings[typeInfo.name],
            defArgs));
        } else if (_.isFunction(typeInfo.initFunction)) {
          typeInfo.initFunction($content, $.extend({}, rtmObj.settings, {
            view: view
          }));
        }
        // Else: no init function specified!
        $content.trigger('show');
      });
    };

    if (!typeInfo.scrollsInline) {
      $content.removeClass('scrollContent');
    } else {
      $content.addClass('scrollContent');
    }

    if (typeInfo._assetsLoaded) {
      finishCallback();
    } else {

      // HEY, LISTEN!
      //
      // The function `blist.util.assetLoading.loadAssets()` makes internal use
      // of lab.js, which swallows ALL exceptions. Since we basically do
      // everything of consequence w/r/t rendering the grid view in the
      // `finishCallback` passed in below, that means that basically ANY sort of
      // error anywhere in this file or any of the Render Type implementations
      // (such as `socrata-viz-dataset-grid.js`) will be sacrificed to the
      // choleric and bloodthirsty progressive-loading gods. You will see no
      // evidence of any error aside from the fact that nothing is rendered.
      //
      // AAARRGHGGHGH!
      //
      // You can avoid a _LOT_ of frustration by setting the `debug_labjs`
      // feature flag to true while working in this area of the code base. This
      // will cause labjs to become _VERY_ chatty in a Tourette's Syndrome sort
      // of way, but at least it will no longer swallow exceptions from
      // basically everywhere with a rapacious appetite that would be pretty
      // hilarious if it weren't so clearly a Communist conspiracy to sabotage
      // Capitalist developer productivity.
      blist.util.assetLoading.loadAssets(typeInfo, finishCallback,
        function() {
          // Some display types (grid) need more prodding than resize
          $content.trigger('show');
          $(window).trigger('resize', [null, true]);
        });
    }

    typeInfo._initialized = true;
  };

})(jQuery);
