var publishNS = blist.namespace.fetch('blist.publish');
var widgetNS;

/*jslint sub: true */

// Confused? Core functionality is in admin-customizer.js

////////////////////////////////////////////
// SECTION: Config

// helpers for builder hash
blist.publish.applyOrientation = function($elem, value) {
  widgetNS.orientation = value;

  // prefetch this or jQuery gets confused about context
  var $widgetContent = $elem.children('.widgetContent');
  if (value == 'downwards') {
    $elem.children('.headerBar').insertBefore($widgetContent);
    $elem.children('.subHeaderBar').insertBefore($widgetContent);
    $elem.children('.toolbar').insertBefore($widgetContent);
    $elem.children('.headerBar').children('.mainMenuButton').removeClass('downArrow').addClass('upArrow');
  } else {
    $elem.children('.headerBar').insertAfter($widgetContent);
    $elem.children('.subHeaderBar').insertAfter($widgetContent);
    $elem.children('.toolbar').insertAfter($widgetContent);
    $elem.children('.headerBar').children('.mainMenuButton').removeClass('upArrow').addClass('downArrow');
  }
};

blist.publish.applyContentMargin = function($elem, value) {
  var valueAndUnit = value.value + value.unit;
  $elem.css('margin', '0 ' + valueAndUnit);
  if (widgetNS.orientation == 'upwards')
    $elem.css('margin-top', valueAndUnit);
  else
    $elem.css('margin-bottom', valueAndUnit);
};

blist.publish.applyLogo = function($elem, value) {
  if (value.type == 'static') {
    $elem.css('background-image', 'url(' + value.href + ')');
  } else {
    $elem.css('background-image', 'url(/assets/' + value.href + ')');
  }
};

blist.publish.applyGradient = function(selector, hover, value) {
  if (hover) {
    selector += ':hover';
  }

  var firstColor = value[0].color;
  if (!firstColor.startsWith('#')) {
    firstColor = '#' + firstColor;
  }
  var lastColor = value[1].color;
  if (!lastColor.startsWith('#')) {
    lastColor = '#' + lastColor;
  }

  if (!$.support.linearGradient) {
    // ie/older
    widgetNS.setGhettoButtonImage((hover ? 'hover' : 'normal'), 'url(/ui/box.png?w=3&h=30&rx=1&ry=1&rw=1&fc=' +
      firstColor.slice(1) + ',' + lastColor.slice(1) + ')');
  } else {
    // firefox
    publishNS.writeStyle(selector, 'background', '-moz-linear-gradient(0 0 270deg, ' +
      firstColor + ', ' + lastColor + ')');
    // webkit
    publishNS.writeStyle(selector, 'background', '-webkit-gradient(linear, left top, left bottom, from(' +
      firstColor + '), to(' + lastColor + '))');
  }
};

blist.publish.hideShowMenuItem = function($elem, value) {
  var target = $elem.children('a').attr('data-targetPane');
  if (value === true) {
    $elem.removeClass('hide');

    if (target == 'about') {
      $elem.closest('.menuColumns').addClass('hasAbout');
    }
  } else {
    $elem.addClass('hide');

    if (target == 'about') {
      $elem.closest('.menuColumns').removeClass('hasAbout');
    }

    if ($elem.closest('.widgetWrapper').children('.widgetContent').children('.widgetContent_' + target).is(':visible')) {
      widgetNS.showDataView();
      widgetNS.hideToolbar();
    }
  }

  var $mainMenu = $elem.closest('.mainMenu');
  $mainMenu.toggleClass('hide', $mainMenu.find('.menuEntry:not(.hide):not(.about)').length == 0);
};

// builder hash !
blist.publish.customizationApplication = {
  frame: {
    border: {
      color: [{
        selector: '.widgetWrapper',
        css: 'border-color'
      }],
      width: [{
        selector: '.widgetWrapper',
        css: 'border-width',
        hasUnit: true
      }]
    },
    color: [{
      selector: '.widgetWrapper',
      css: 'background-color'
    }],
    orientation: [{
      selector: '.widgetWrapper',
      callback: publishNS.applyOrientation
    }],
    show_title: [{
      selector: '.subHeaderBar .datasetName',
      hideShow: true
    }],
    padding: [{
      selector: '.subHeaderBar, .toolbar',
      css: 'margin-left, margin-right',
      hasUnit: true
    }, {
      selector: '.widgetContent',
      callback: publishNS.applyContentMargin
    }]
  },
  toolbar: {
    color: [{
      selector: '.subHeaderBar, .toolbar',
      css: 'background-color'
    }],
    input_color: [{
      selector: '.toolbar .toolbarTextboxWrapper .toolbarTextbox',
      css: 'background-color'
    }]
  },
  logo: {
    image: [{
      selector: '.headerBar .logo',
      callback: publishNS.applyLogo
    }],
    href: [{
      selector: '.headerBar .logoLink',
      attr: 'href'
    }]
  },
  menu: {
    button: {
      background: [{
        callback: function(value) {
          publishNS.applyGradient('.headerBar .mainMenu .mainMenuButton', false, value);
        }
      }],
      background_hover: [{
        callback: function(value) {
          publishNS.applyGradient('.headerBar .mainMenu .mainMenuButton', true, value);
        }
      }],
      border: [{
        selector: '.headerBar .mainMenu .mainMenuButton',
        css: 'border-color'
      }],
      text: [{
        selector: '.mainMenuButton',
        css: 'color'
      }]
    },
    options: {
      more_views: [{
        selector: '.mainMenu .menuEntry.views',
        callback: publishNS.hideShowMenuItem
      }],
      comments: [{
        selector: '.mainMenu .menuEntry.comments',
        callback: publishNS.hideShowMenuItem
      }],
      downloads: [{
        selector: '.mainMenu .menuEntry.downloads',
        callback: publishNS.hideShowMenuItem
      }],
      embed: [{
        selector: '.mainMenu .menuEntry.embed',
        callback: publishNS.hideShowMenuItem
      }],
      api: [{
        selector: '.mainMenu .menuEntry.api',
        callback: publishNS.hideShowMenuItem
      }],
      print: [{
        selector: '.mainMenu .menuEntry.print',
        callback: publishNS.hideShowMenuItem
      }],
      about_sdp: [{
        selector: '.mainMenu .menuEntry.about',
        callback: publishNS.hideShowMenuItem
      }]
    },
    share: [{
      selector: '.subHeaderBar .share',
      hideShow: true
    }],
    fullscreen: [{
      selector: '.subHeaderBar .fullscreen',
      hideShow: true
    }]
  },
  grid: {
    font: {
      header_size: [{
        selector: 'div.blist-th .info-container',
        css: 'font-size',
        hasUnit: true
      }],
      data_size: [{
        selector: '.blist-td',
        css: 'font-size',
        hasUnit: true
      }]
    },
    row_numbers: [{
      selector: '.blist-table-locked-scrolls:has(.blist-table-row-numbers)',
      hideShow: true
    }, {
      selector: '.blist-table-header-scrolls, .blist-table-footer-scrolls',
      css: 'margin-left',
      map: {
        'true': '49px',
        'false': '0'
      }
    }, {
      selector: '#data-grid .blist-table-inside .blist-tr',
      css: 'left',
      map: {
        'true': '49px',
        'false': '0'
      }
    }],
    wrap_header_text: [{
      selector: '.blist-th .info-container, .blist-th .name-wrapper',
      css: 'height',
      map: {
        'true': '2.45em',
        'false': '1.6667em'
      }
    }, {
      selector: '.blist-th .info-container',
      css: 'white-space',
      map: {
        'true': 'normal',
        'false': 'nowrap'
      }
    }, {
      selector: '.blist-table-header, .blist-th, .blist-th .dragHandle',
      css: 'height',
      map: {
        'true': '4.5em',
        'false': '3.5em'
      }
    }],
    title_bold: [{
      selector: '.blist-th .blist-th-name',
      css: 'font-weight',
      map: {
        'true': 'bold',
        'false': 'normal'
      }
    }],
    header_icons: [{
      selector: '.blist-th-icon',
      hideShow: true
    }],
    zebra: [{
      selector: '.blist-tr-even .blist-td',
      css: 'background-color'
    }]
  },
  behavior: {
    interstitial: [{
      callback: function(value) {
        widgetNS.interstitial = value;
      }
    }]
  },
  publish: {
    dimensions: {
      width: [{
        selector: '.previewPane, .previewPane iframe',
        outsideWidget: true,
        callback: function($elem, value) {
          $elem.css('width', value + 'px');
        }
      }],
      height: [{
        selector: '.previewPane iframe',
        outsideWidget: true,
        callback: function($elem, value) {
          $elem.css('height', value + 'px');
        }
      }]
    },
    show_powered_by: [{
      selector: '.previewPane p:last-child',
      outsideWidget: true,
      hideShow: true
    }]
  }
};

// helpers for SDP Sidebars

// get latest instance of data in spite of sidebar declaration
blist.publish.resolveCurrentThemeMeta = function() {
  return {
    _name: publishNS.workingThemeMeta.name,
    description: publishNS.workingTheme.description
  };
};

// events for logo upload
blist.publish.wireLogoEditor = function($section) {
  var cpObj = this;
  // restore normal styling, allow parser to see us
  $section.closest('.formSection').removeClass('custom');

  $section.find('.uploadNewLogoButton').click(function(event) {
    event.preventDefault();

    $.uploadDialog().show(
      function(fileName) {
        return '/assets.txt?name=' + fileName + '&type=WIDGET_CUSTOMIZATION_LOGO';
      },
      function(responseFile, file, response) {
        var $logoSelect = $('#gridSidebar_appearance_logo\\:_logoSelect');
        $logoSelect.append('<option value="' + response.id + '">' +
          response.nameForOutput + '</option>');
        $logoSelect.val(response.id);
        publishNS.handleValueChanged.call(cpObj);
      },
      null, ['jpg', 'jpeg', 'gif', 'png'], 'Image'
    );
  });

  $section.find('#gridSidebar_appearance_logo\\:_logoSelect', '#gridSidebar_appearance_logo\\:logo.href').
    change(function() {
      publishNS.handleValueChanged.call(cpObj);
    });
};

// wire up some custom behaviors into the sidebar
blist.publish.updateCustomUI = function() {
  // hide zebra color if not zebraing
  $('#gridSidebar_appearance_rows\\:grid\\.zebra').
    closest('.line').toggleClass('disabled', !publishNS.workingTheme._zebraStriping);

  // update logoSelect to appropriate value
  var $select = $('#gridSidebar_appearance_logo\\:_logoSelect').val(publishNS.workingTheme._logoSelect);
  if (!_.isUndefined($.uniform.update)) {
    $.uniform.update($select);
  }

  // hide url field if no logo, update value
  $('#gridSidebar_appearance_logo\\:logo\\.href').
    val(publishNS.workingTheme.logo.href).
    closest('.line').toggleClass('disabled', (publishNS.workingTheme._logoSelect == 'none'));

  // hide/show changes warning on embed pane
  $('#gridSidebar_embed .changesWarning').toggleClass('hide', !$('.publisherHeader').hasClass('unsaved'));

  // show validation messages
  publishNS.sidebar.$currentPane().find('form').valid();
};

blist.publish.generateEmbedCode = function(hash) {
  if (_.isUndefined(hash)) {
    hash = publishNS.workingTheme;
  }
  return $('#codeTemplate').val().
    replace('%variation%', publishNS.currentThemeMeta.id).
    replace('%width%', hash.publish.dimensions.width).
    replace('%height%', hash.publish.dimensions.height).
    replace((hash.publish.show_powered_by ? /<\/div>$/ : /<p>.*<\/p><\/div>$/), '</div>');
};

// Register the SDP sidebars !
function t(str, props) {
  return $.t('screens.admin.sdp.edit.' + str, props);
}

$.Control.extend('pane_sdpTmplMetadata', {
  getTitle: function() { return t('panes.metadata.title'); },

  getTemplateName: function() {
    return 'sidebarPaneWithFieldset';
  },

  getSubtitle: function() { return t('panes.metadata.subtitle'); },

  _getCurrentData: function() {
    return this._super() || publishNS.resolveCurrentThemeMeta();
  },

  shown: function() {
    this._super();
    publishNS.updateCustomUI();
  },

  _changeHandler: publishNS.handleValueChanged,

  _getSections: function() {
    return [{
      title: t('panes.metadata.sections.information.label'),
      name: 'metadata',
      fields: [{
        text: t('panes.metadata.sections.information.fields.name.text'),
        name: '_name',
        prompt: t('panes.metadata.sections.information.fields.name.prompt'),
        type: 'text',
        required: true
      }, {
        text: t('panes.metadata.sections.information.fields.description.text'),
        name: 'description',
        prompt: t('panes.metadata.sections.information.fields.description.prompt'),
        type: 'textarea'
      }]
    }];
  }
}, {
  name: 'metadata',
  noReset: true
}, 'controlPane');
$.gridSidebar.registerConfig('metadata', 'pane_sdpTmplMetadata');

$.Control.extend('pane_sdpTmplAppearance', {
  getTitle: function() {
    return t('panes.appearance.title');
  },

  getTemplateName: function() {
    return 'sidebarPaneWithFieldset';
  },

  getSubtitle: function() {
    return t('panes.appearance.subtitle');
  },

  _getCurrentData: function() {
    return this._super() || publishNS.resolveWorkingTheme();
  },

  shown: function() {
    this._super();
    publishNS.updateCustomUI();
  },

  _changeHandler: publishNS.handleValueChanged,

  _getSections: function() {
    return [
      {
        title: t('panes.appearance.sections.exterior.label'),
        name: 'exterior',
        fields: [
          {
            text: t('panes.appearance.sections.exterior.fields.width.text'),
            name: 'publish.dimensions.width',
            type: 'text',
            required: true,
            validateMin: 425
          },
          {
            text: t('panes.appearance.sections.exterior.fields.height.text'),
            name: 'publish.dimensions.height',
            type: 'text',
            required: true,
            validateMin: 425
          },
          {
            text: t('panes.appearance.sections.exterior.fields.powered_by.text'),
            name: 'publish.show_powered_by',
            type: 'checkbox'
          }
        ]
      },
      {
        title: t('panes.appearance.sections.logo.label'),
        name: 'logo',
        customContent: {
          template: 'logoEdit',
          directive: {},
          callback: publishNS.wireLogoEditor
        }
      },
      {
        title: t('panes.appearance.sections.colors.label'),
        name: 'colors',
        fields: [
          {
            text: t('panes.appearance.sections.colors.fields.frame_color.text'),
            name: 'frame.color',
            type: 'color',
            advanced: true,
            showLabel: true
          },
          {
            text: t('panes.appearance.sections.colors.fields.border_color.text'),
            name: 'frame.border.color',
            type: 'color',
            advanced: true,
            showLabel: true
          },
          {
            text: t('panes.appearance.sections.colors.fields.button_color.text'),
            name: '_menuButtonColor',
            type: 'color',
            advanced: true,
            showLabel: true
          },
          {
            text: t('panes.appearance.sections.colors.fields.toolbar_color.text'),
            name: 'toolbar.color',
            type: 'color',
            advanced: true,
            showLabel: true
          },
          {
            text: t('panes.appearance.sections.colors.fields.find_field_color.text'),
            name: 'toolbar.input_color',
            type: 'color',
            advanced: true,
            showLabel: true
          },
          {
            type: 'group',
            text: t('panes.appearance.sections.colors.fields.border_width.text'),
            includeLabel: true,
            lineClass: 'dimensions',
            options: [
              {
                type: 'text',
                name: 'frame.border.width.value',
                inputOnly: true
              },
              {
                type: 'select',
                name: 'frame.border.width.unit',
                inputOnly: true,
                options: publishNS.dimensionOptions
              }
            ]
          }
        ]
      },
      {
        title: t('panes.appearance.sections.columns.label'),
        name: 'columns',
        onlyIf: {
          func: function() {
            return publishNS.viewIsGrid;
          }
        },
        fields: [
          {
            text: t('panes.appearance.sections.columns.fields.wrap.text'),
            name: 'grid.wrap_header_text',
            type: 'checkbox'
          },
          {
            text: t('panes.appearance.sections.columns.fields.bold.text'),
            name: 'grid.title_bold',
            type: 'checkbox'
          },
          {
            type: 'group',
            text: t('panes.appearance.sections.columns.fields.font.text'),
            includeLabel: true,
            lineClass: 'dimensions',
            options: [
              {
                type: 'text',
                name: 'grid.font.header_size.value',
                inputOnly: true
              },
              {
                type: 'select',
                name: 'grid.font.header_size.unit',
                inputOnly: true,
                options: publishNS.dimensionOptions
              }
            ]
          }
        ]
      },
      {
        title: t('panes.appearance.sections.rows.label'),
        name: 'rows',
        onlyIf: {
          func: function() {
            return publishNS.viewIsGrid;
          }
        },
        fields: [
          {
            text: t('panes.appearance.sections.rows.fields.row_numbers.text'),
            name: 'grid.row_numbers',
            type: 'checkbox'
          },
          {
            type: 'group',
            text: t('panes.appearance.sections.rows.fields.font_size.text'),
            includeLabel: true,
            lineClass: 'dimensions',
            options: [
              {
                type: 'text',
                name: 'grid.font.data_size.value',
                inputOnly: true
              },
              {
                type: 'select',
                name: 'grid.font.data_size.unit',
                inputOnly: true,
                options: publishNS.dimensionOptions
              }
            ]
          },
          {
            text: t('panes.appearance.sections.rows.fields.stripe_rows.text'),
            name: '_zebraStriping',
            type: 'checkbox'
          },
          {
            text: t('panes.appearance.sections.rows.fields.stripe_color.text'),
            name: 'grid.zebra',
            type: 'color',
            advanced: true,
            showLabel: true
          }
        ]
      },
      {
        title: t('panes.appearance.sections.toolbars.label'),
        name: 'toolbars',
        fields: [
          {
            text: t('panes.appearance.sections.toolbars.fields.title.text'),
            name: 'frame.show_title',
            type: 'checkbox'
          },
          {
            text: t('panes.appearance.sections.toolbars.fields.orientation.text'),
            name: 'frame.orientation',
            type: 'radioSelect',
            options: [
              {
                value: 'downwards',
                label: t('panes.appearance.sections.toolbars.fields.' +
                  'orientation.option_downwards')
              },
              {
                value: 'upwards',
                label: t('panes.appearance.sections.toolbars.fields.' +
                  'orientation.option_upwards')
              }
            ]
          }
        ]
      }
    ];
  }
}, {
  name: 'appearance',
  noReset: true
}, 'controlPane');
$.gridSidebar.registerConfig('appearance', 'pane_sdpTmplAppearance');

$.Control.extend('pane_sdpTmplBehavior', {
  getTitle: function() {
    return t('panes.behavior.title');
  },

  getTemplateName: function() {
    return 'sidebarPaneWithFieldset';
  },

  getSubtitle: function() {
    return t('panes.behavior.subtitle');
  },

  _getCurrentData: function() {
    return this._super() || publishNS.resolveWorkingTheme();
  },

  shown: function() {
    this._super();
    publishNS.updateCustomUI();
  },

  _changeHandler: publishNS.handleValueChanged,

  _getSections: function() {
    return [
      {
        title: t('panes.behavior.sections.menu.label'),
        name: 'sdp_menu',
        fields: [
          {
            text: t('panes.behavior.sections.menu.fields.move_views.text'),
            name: 'menu.options.more_views',
            type: 'checkbox'
          },
          {
            text: t('panes.behavior.sections.menu.fields.discuss.text'),
            name: 'menu.options.comments',
            type: 'checkbox'
          },
          {
            text: t('panes.behavior.sections.menu.fields.downloads.text'),
            name: 'menu.options.downloads',
            type: 'checkbox'
          },
          {
            text: t('panes.behavior.sections.menu.fields.embed.text'),
            name: 'menu.options.embed',
            type: 'checkbox'
          },
          {
            text: t('panes.behavior.sections.menu.fields.api.text'),
            name: 'menu.options.api',
            type: 'checkbox'
          },
          {
            text: t('panes.behavior.sections.menu.fields.print.text'),
            name: 'menu.options.print',
            type: 'checkbox',
            onlyIf: publishNS.viewIsGrid
          },
          {
            text: t('panes.behavior.sections.menu.fields.about.text'),
            name: 'menu.options.about_sdp',
            type: 'checkbox'
          }
        ]
      },
      {
        title: t('panes.behavior.sections.general.label'),
        name: 'general',
        fields: [
          {
            text: t('panes.behavior.sections.general.fields.share_menu.text'),
            name: 'menu.share',
            type: 'checkbox'
          }, {
            text: t('panes.behavior.sections.general.fields.full_screen.text'),
            name: 'menu.fullscreen',
            type: 'checkbox'
          }, {
            text: t('panes.behavior.sections.general.fields.warn_leaving.text'),
            name: 'behavior.interstitial',
            type: 'checkbox'
          }, {
            value: t('panes.behavior.sections.general.fields.redirect_alert.value'),
            type: 'static'
          }
        ]
      }
    ];
  }
}, {
  name: 'behavior',
  noReset: true
}, 'controlPane');
$.gridSidebar.registerConfig('behavior', 'pane_sdpTmplBehavior');

$.Control.extend('pane_sdpTmplAdvanced', {
  getTitle: function() {
    return t('panes.advanced.title');
  },

  getTemplateName: function() {
    return 'sidebarPaneWithFieldset';
  },

  getSubtitle: function() {
    return t('panes.advanced.subtitle');
  },

  _getCurrentData: function() {
    return this._super() || publishNS.resolveWorkingTheme();
  },

  shown: function() {
    this._super();
    publishNS.updateCustomUI();
  },

  _changeHandler: publishNS.handleValueChanged,

  _getSections: function() {
    return [
      {
        title: t('panes.advanced.sections.google_analytics.label'),
        name: 'analytics',
        fields: [
          {
            text: t('panes.advanced.sections.google_analytics.fields.' +
              'ga_code.text'),
            name: 'behavior.ga_code',
            type: 'text'
          },
          {
            value: t('panes.advanced.sections.google_analytics.fields.' +
              'description.value'),
            type: 'static'
          }
        ]
      }
    ];
  }
}, {
  name: 'advanced',
  noReset: true
}, 'controlPane');
$.gridSidebar.registerConfig('advanced', 'pane_sdpTmplAdvanced');

$.Control.extend('pane_sdpTmplEmbed', {
  getTitle: function() {
    return 'Embed';
  },

  getSubtitle: function() {
    return 'Publish this Social Data Player on the web';
  },

  _getCurrentData: function() {
    return this._super() || {
        code: publishNS.generateEmbedCode()
      };
  },

  shown: function() {
    this._super();
    publishNS.updateCustomUI();
  },

  _changeHandler: publishNS.handleValueChanged,

  _getSections: function() {
    return [{
      title: 'Embed Code',
      name: 'embedCode',
      fields: [{
        text: 'Embed Code',
        name: 'code',
        type: 'textarea'
      }, {
        value: 'You have made changes to this template that have ' +
        'not yet been saved. They will not reflect in published ' +
        'until you save the template.',
        type: 'static',
        lineClass: 'changesWarning'
      }]
    }];
  }
}, {
  name: 'embed',
  noReset: true
}, 'controlPane');
$.gridSidebar.registerConfig('embed', 'pane_sdpTmplEmbed');

////////////////////////////////////////////
// SECTION: Render methods

blist.publish.$iframe = null;
blist.publish.findCache = {};
blist.publish.findContextElem = function(selector) {
  if (_.isUndefined(publishNS.findCache[selector])) {
    publishNS.findCache[selector] = publishNS.$iframe.contents().find(selector);
  }
  return publishNS.findCache[selector];
};

blist.publish.customizationApplied = false;
blist.publish.applyCustomizationToPreview = function(hash) {
  var $iframe = $('.previewPane iframe');
  if ($iframe.length === 0) {
    return;
  }
  publishNS.$iframe = $iframe;

  var iframeNS = $iframe.get()[0].contentWindow;

  clearTimeout(publishNS.loadFrameTimeout);
  if ((typeof iframeNS.blist === 'undefined') ||
    (typeof iframeNS.blist.widget === 'undefined') ||
    (iframeNS.blist.widget.ready !== true)) {
    // iframe may not have loaded yet.
    publishNS.loadFrameTimeout = setTimeout(
      function() {
        publishNS.applyCustomizationToPreview(hash);
      }, 50);
  } else {
    widgetNS = iframeNS.blist.widget;

    publishNS.applicator(publishNS.customizationApplication, hash);

    // update embed codes
    publishNS.findContextElem('#embed_code').text(publishNS.generateEmbedCode(hash));

    // this is slow; let's let the UI refresh before running it.
    _.defer(function() {
      widgetNS.$resizeContainer.fullScreen().adjustSize();
    });

    // first-load operations
    if (publishNS.customizationApplied === false) {
      // ENABLE HACK: background-image won't take in older IEs
      if (!$.support.linearGradient) {
        widgetNS.addGhettoHoverHook();
      }

      // Hide initial loading splash and show widget
      $('.loadingMessage').fadeOut(function() {
        $('.previewScrollContainer').css('height', '100%').css('width', '100%');
      });

      publishNS.customizationApplied = true;
    }
  }
};

blist.publish.generateStyleNode = function() {
  return $('.previewPane iframe').contents().find('head').
    append('<style id="customizationStyles" type="text/css"></style>').
    children('#customizationStyles')[0];
};

blist.publish.retrieveStylesheets = function() {
  return $('.previewPane iframe').get()[0].contentWindow.document.styleSheets;
};

////////////////////////////////////////////
// SECTION: Data handling methods

blist.publish.initCustomization = function() {
  publishNS.workingTheme = $.extend(true, {}, publishNS.currentTheme);

  publishNS.workingTheme._menuButtonColor = publishNS.workingTheme.menu.button.background[0].color;
  publishNS.workingTheme._zebraStriping = (publishNS.workingTheme.grid.zebra !== 'ffffff');
  if (publishNS.workingTheme.logo.image.type == 'static') {
    // assume this is us
    publishNS.workingTheme._logoSelect = 'socrata';
  } else if (publishNS.workingTheme.logo.image.type == 'none') {
    publishNS.workingTheme._logoSelect = 'none';
  } else {
    publishNS.workingTheme._logoSelect = publishNS.workingTheme.logo.image.href;
  }

  publishNS.workingThemeMeta = $.extend({}, publishNS.currentThemeMeta);

  $('.publisherHeader').removeClass('unsaved');
  if (!_.isUndefined(publishNS.sidebar)) {
    publishNS.sidebar.refresh();
  }
};

blist.publish.cleanData = function(hash) {
  var cleanCopy = $.extend(true, {}, hash);

  // set menu button gradient correctly
  if (!_.isUndefined(cleanCopy._menuButtonColor)) {
    var color = cleanCopy._menuButtonColor;
    var darkerColor = $.subtractColors(color, '222');
    var lighterColor = $.addColors(color, '222');

    cleanCopy.menu.button.background = [{
      color: color
    }, {
      color: darkerColor
    }];
    cleanCopy.menu.button.background_hover = [{
      color: lighterColor
    }, {
      color: color
    }];
    cleanCopy.menu.button.border = darkerColor;
  }

  // _zebraStriping indicates whether to ignore the specified color
  if (cleanCopy._zebraStriping === false) {
    cleanCopy.grid.zebra = 'ffffff';
  }

  // name isn't really in workingTheme
  if (!_.isUndefined(cleanCopy._name)) {
    publishNS.workingThemeMeta.name = cleanCopy._name;
  }

  // massage logo selection
  if (!_.isUndefined(cleanCopy._logoSelect)) {
    if (cleanCopy._logoSelect == 'none') {
      // do nothing
      cleanCopy.logo.image.type = 'none';
      cleanCopy.logo.image.href = '';
    } else if (cleanCopy._logoSelect == 'socrata') {
      // this is the default logo
      cleanCopy.logo.image.type = 'static';
      cleanCopy.logo.image.href = publishNS.v2Theme.logo.image.href;
    } else {
      // asset; set up path appropriately
      cleanCopy.logo.image.type = 'hosted';
      cleanCopy.logo.image.href = cleanCopy._logoSelect;
    }
  }

  // delete temp stuff
  _.each(cleanCopy, function(value, key) {
    if (key.startsWith('_')) {
      delete cleanCopy[key];
    }
  });

  return cleanCopy;
};

blist.publish.saveCustomization = function(callback) {
  $.ajax({
    url: '/api/widget_customization/' + publishNS.currentThemeMeta.id,
    type: 'PUT',
    cache: false,
    contentType: 'application/json',
    data: JSON.stringify({
      'customization': JSON.stringify(publishNS.cleanData(publishNS.workingTheme)),
      'name': publishNS.workingThemeMeta.name
    }),
    dataType: 'json',
    success: function(response) {
      // update with latest from server
      publishNS.currentTheme = JSON.parse(response.customization);
      publishNS.currentThemeMeta.name = response.name;

      publishNS.initCustomization();

      callback();
    },
    error: function() {
      // TODO: wait and retry and/or notify user
    }
  });
};

blist.publish.checkVersion = function(customization) {
  if (_.isUndefined(customization) || (customization.version !== 1)) {
    $('.previewPane').hide();
    $('.versionMessage').show();
    return false;
  } else {
    $('.previewPane').show();
    $('.versionMessage').hide();
    return true;
  }
};

blist.publish.cleanupColors = function(color) {
  color = color.replace(/[^\da-f]/ig, '');
  if (color.length == 3) {
    color = color.replace(/(.)/, '$1$1');
  }

  return color;
};

blist.publish.convertCustomization = function(customization) {
  // transfer relevant values over
  var newCustomization = $.extend(true, {}, publishNS.v2Theme);
  newCustomization.frame.color = publishNS.cleanupColors(customization.frame.color);
  newCustomization.frame.border.color = publishNS.cleanupColors(customization.frame.border);

  // none is no longer supported; default is already in the customization
  if ((customization.frame.logo != 'none') &&
    (customization.frame.logo != 'default')) {
    if (customization.frame.logo.match(/^[\dA-F]{8}-([\dA-F]{4}-){3}[\dA-F]{12}$/i)) {
      newCustomization.logo.image.type = 'hosted';
    }

    newCustomization.logo.image.href = customization.frame.logo;
  }

  newCustomization.grid.font.header_size = customization.style.font.grid_header_size;
  newCustomization.grid.font.data_size = customization.style.font.grid_data_size;
  newCustomization.grid.row_numbers = customization.grid.row_numbers;
  newCustomization.grid.wrap_header_text = customization.grid.wrap_header_text;
  newCustomization.grid.header_icons = customization.grid.header_icons;
  newCustomization.grid.title_bold = customization.grid.title_bold;
  newCustomization.grid.zebra = publishNS.cleanupColors(customization.grid.zebra);

  newCustomization.behavior = customization.behavior;
  newCustomization.publish = customization.publish;

  return newCustomization;
};


$(function() {
  // Init data
  if (publishNS.checkVersion(publishNS.currentTheme))
    publishNS.initCustomization();

  // Init and wire sidebar
  publishNS.sidebar = $('#gridSidebar').gridSidebar({
    onSidebarShown: function(activePane) {
      var $activeLink = $('#sidebarOptions a[data-paneName=' + activePane + ']');
      $('#sidebarOptions').css('background-color', $activeLink.css('background-color')).
        find('li').removeClass('active');
      $activeLink.closest('li').addClass('active');
    },
    resizeNeighbor: '.publisherWorkspace',
    setSidebarTop: false
  });

  if (publishNS.checkVersion(publishNS.currentTheme)) {
    publishNS.sidebar.show('metadata');

    // Load in customization
    publishNS.applyCustomizationToPreview(publishNS.workingTheme);
  }

  // Embed code highlight
  $.live('#gridSidebar_embed textarea', 'click', function() {
    $(this).select();
  });

  // Make public button
  $('.privateDatasetMessage .makePublicButton').click(function(event) {
    event.preventDefault();

    $.ajax({
      url: '/views/' + publishNS.viewId +
        '.json?method=setPermission&value=public.read',
      type: 'PUT',
      error: function() {
        alert('There was a problem changing the permissions');
      },
      success: function() {
        window.location.reload();
      }
    });
  });

  // Convert customization button
  $('.versionMessage .convertButton').click(function(event) {
    event.preventDefault();

    // convert and update internal structures
    publishNS.currentTheme = publishNS.convertCustomization(publishNS.currentTheme);
    publishNS.initCustomization();

    // update ui
    publishNS.checkVersion(publishNS.currentTheme);
    publishNS.applyCustomizationToPreview(publishNS.workingTheme);
    publishNS.sidebar.show('appearance');
    $('.headerBar').addClass('unsaved noRevert');
  });
});
