(function($) {

  var publishNS = blist.namespace.fetch('blist.publish');

  // Confused? Core functionality is in admin-customizer.js

  /////////////////////////////////////
  // SECTION: Config

  blist.publish.applyAutoAdvance = function(value) {
    blist.homepage.autoadvanceInit(value);
  };

  blist.publish.applyShadow = function(value) {
    if (_.isNumber(value))
      return '0 0 5px rgba(0,0,0,' + value + ')';
    else
      return '0 0 ' + value.radius.value + value.radius.unit + ' rgba(0,0,0,' + value.alpha + ')';
  };

  blist.publish.customizationApplication = {
    autoAdvance: [{
      callback: publishNS.applyAutoAdvance
    }],
    height: [{
      selector: '.storiesContainer',
      css: 'height',
      hasUnit: true
    }],
    orientation: [{
      selector: '.storiesContainer .storyTexts li',
      css: 'right',
      map: {
        left: 'auto',
        right: 0
      }
    }, {
      selector: '.storiesContainer .storyTextbox',
      css: 'right',
      map: {
        left: 'auto',
        right: 0
      }
    }, {
      selector: '.storiesContainer .storyPager',
      css: 'right',
      map: {
        left: 'auto',
        right: 0
      }
    }, {
      selector: '.storiesContainer .storyImages li img',
      css: 'right',
      map: {
        left: 0,
        right: 'auto'
      }
    }, {
      selector: '.storiesContainer',
      attr: 'data-orientation'
    }],
    box: {
      alpha: [{
        selector: '.storiesContainer .storyTextbox',
        css: 'opacity'
      }],
      body: {
        color: [{
          selector: '.storiesContainer .storyTexts li .storyBody',
          css: 'color'
        }],
        font_family: [{
          selector: '.storiesContainer .storyTexts li .storyBody',
          css: 'font-family'
        }],
        font_size: [{
          selector: '.storiesContainer .storyTexts li .storyBody',
          css: 'font-size',
          hasUnit: true
        }],
        shadow: [{
          selector: '.storiesContainer .storyTexts li .storyBody',
          css: 'text-shadow',
          callback: publishNS.applyShadow
        }]
      },
      color: [{
        selector: '.storiesContainer .storyTextbox',
        css: 'background-color'
      }],
      headline: {
        color: [{
          selector: '.storiesContainer .storyTexts li h2',
          css: 'color'
        }],
        font_family: [{
          selector: '.storiesContainer .storyTexts li h2',
          css: 'font-family'
        }],
        font_size: [{
          selector: '.storiesContainer .storyTexts li h2',
          css: 'font-size',
          hasUnit: true
        }],
        shadow: [{
          selector: '.storiesContainer .storyTexts li h2',
          css: 'text-shadow',
          callback: publishNS.applyShadow
        }]
      },
      margin: [{
        selector: '.storiesContainer .storyTexts li',
        css: 'margin',
        hasUnit: true
      }, {
        selector: '.storiesContainer .storyTextbox',
        css: 'margin',
        hasUnit: true
      }],
      shadow: [{
        selector: '.storiesContainer .storyTextbox',
        css: 'box-shadow',
        callback: publishNS.applyShadow
      }],
      width: [{
        selector: '.storiesContainer .storyTextbox',
        css: 'width',
        hasUnit: true
      }, {
        selector: '.storiesContainer .storyTexts li',
        css: 'width',
        hasUnit: true
      }]
    },
    pager: {
      disposition: [{
        selector: '.storiesContainer .storyPager a',
        css: 'color',
        map: {
          light: '#ddd',
          dark: '#222'
        }
      }, {
        selector: '.storiesContainer .storyPager a.selected',
        css: 'color',
        map: {
          light: '#fff',
          dark: '#000'
        }
      }, {
        selector: '.storiesContainer .storyPagerBackground',
        css: 'background-color',
        map: {
          light: '#000',
          dark: '#fff'
        }
      }, {
        selector: '.storiesContainer .storyPager a',
        css: 'background-position',
        map: {
          light: '0 0',
          dark: '0 -7px'
        }
      }, {
        selector: '.storiesContainer .storyPager a.selected',
        css: 'background-position',
        map: {
          light: '-7px 0',
          dark: '-7px -7px'
        }
      }],
      position: [{
        selector: '.storiesContainer .storyPager',
        css: 'bottom',
        map: {
          box: '1.3em',
          center: '1em'
        }
      }, {
        selector: '.storiesContainer .storyPager',
        css: 'height',
        map: {
          box: 'auto',
          center: '0.7em'
        }
      }, {
        selector: '.storiesContainer .storyPager',
        css: 'padding',
        map: {
          box: '0 1.5em',
          center: '0'
        }
      }, {
        selector: '.storiesContainer .storyPager',
        css: 'width',
        map: {
          box: 'auto',
          center: '100%'
        }
      }, {
        selector: '.storiesContainer .storyPagerBackground',
        css: 'display',
        map: {
          box: 'none',
          center: 'block'
        }
      }],
      type: [{
        selector: '.storiesContainer .storyPager a',
        css: 'text-indent',
        map: {
          bullets: '-9999px',
          numbers: '0'
        }
      }, {
        selector: '.storiesContainer .storyPager a',
        css: 'background-image',
        map: {
          bullets: 'url(/stylesheets/images/interface/story_pager.png)',
          numbers: 'none'
        }
      }]
    }
  };

  function t(str, props) {
    return $.t('screens.admin.story_appearance.' + str, props);
  }

  $.Control.extend('pane_storiesTextbox', {
    getTitle: () => t('panes.text_box.title'),

    getSubtitle: () => t('panes.text_box.subtitle'),

    _getCurrentData: function() {
      return this._super() || publishNS.resolveWorkingTheme();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function() {
      const sectionPrefix = 'panes.text_box.sections';
      return [
        {
          title: t(`${sectionPrefix}.layout.label`),
          name: 'overall',
          fields: [
            {
              text: t(`${sectionPrefix}.layout.fields.orientation.text`),
              name: 'orientation',
              prompt: t(`${sectionPrefix}.layout.fields.orientation.prompt`),
              type: 'radioSelect',
              options: [
                {
                  value: 'left',
                  label: t(`${sectionPrefix}.layout.fields.orientation.option_left`)
                },
                {
                  value: 'right',
                  label: t(`${sectionPrefix}.layout.fields.orientation.option_right`)
                }
              ]
            },
            {
              type: 'group',
              text: t(`${sectionPrefix}.layout.fields.width.text`),
              includeLabel: true,
              lineClass: 'dimensions',
              options: [
                {
                  type: 'text',
                  name: 'box.width.value',
                  inputOnly: true
                },
                {
                  type: 'select',
                  name: 'box.width.unit',
                  inputOnly: true,
                  options: publishNS.dimensionOptions
                }
              ]
            },
            {
              type: 'group',
              text: t(`${sectionPrefix}.layout.fields.margin.text`),
              includeLabel: true,
              lineClass: 'dimensions',
              options: [
                {
                  type: 'text',
                  name: 'box.margin.value',
                  inputOnly: true
                },
                {
                  type: 'static',
                  name: 'box.margin.unit',
                  inputOnly: true,
                  value: 'em'
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.layout.fields.bg_color.text`),
              name: 'box.color',
              prompt: t(`${sectionPrefix}.fields.bg_color.prompt`),
              type: 'color',
              advanced: true,
              showLabel: true
            },
            {
              text: t(`${sectionPrefix}.layout.fields.alpha.text`),
              name: 'box.alpha',
              prompt: t(`${sectionPrefix}.layout.fields.prompt.text`),
              type: 'slider',
              minimum: 0,
              maximum: 1
            }
            /*,
             {   text: 'Shadow', name: 'box.shadow',
             prompt: 'Drop shadow strength around the box',
             type: 'slider', minimum: 0, maximum: 1 }*/
          ]
        },
        {
          title: t(`${sectionPrefix}.headline.label`),
          name: 'text',
          fields: [
            {
              text: t(`${sectionPrefix}.headline.fields.font_family.text`),
              name: 'box.headline.font_family',
              prompt: t(`${sectionPrefix}.headline.fields.font_family.prompt`),
              type: 'select',
              options: publishNS.fontOptions
            },
            {
              text: t(`${sectionPrefix}.headline.fields.font_color.text`),
              name: 'box.headline.color',
              prompt: t(`${sectionPrefix}.headline.fields.font_color.prompt`),
              type: 'color',
              advanced: true,
              showLabel: true
            },
            {
              type: 'group',
              text: t(`${sectionPrefix}.headline.fields.font_size.text`),
              includeLabel: true,
              lineClass: 'dimensions',
              options: [
                {
                  type: 'text',
                  name: 'box.headline.font_size.value',
                  inputOnly: true
                },
                {
                  type: 'select',
                  name: 'box.headline.font_size.unit',
                  inputOnly: true,
                  options: publishNS.dimensionOptions
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.headline.fields.shadow_alpha.text`),
              name: 'box.headline.shadow.alpha',
              prompt: t(`${sectionPrefix}.headline.fields.shadow_alpha.prompt`),
              type: 'slider',
              minimum: 0,
              maximum: 1
            }
          ]
        },
        {
          title: t(`${sectionPrefix}.body_text.label`),
          name: 'text',
          fields: [
            {
              text: t(`${sectionPrefix}.body_text.fields.font_family.text`),
              name: 'box.body.font_family',
              prompt: t(`${sectionPrefix}.body_text.fields.font_family.subtitle`),
              type: 'select',
              options: publishNS.fontOptions
            },
            {
              text: t(`${sectionPrefix}.body_text.fields.font_color.text`),
              name: 'box.body.color',
              prompt: t(`${sectionPrefix}.body_text.fields.font_color.prompt`),
              type: 'color',
              advanced: true,
              showLabel: true
            },
            {
              type: 'group',
              text: t(`${sectionPrefix}.body_text.fields.font_size.text`),
              includeLabel: true,
              lineClass: 'dimensions',
              options: [
                {
                  type: 'text',
                  name: 'box.body.font_size.value',
                  inputOnly: true
                },
                {
                  type: 'select',
                  name: 'box.body.font_size.unit',
                  inputOnly: true,
                  options: publishNS.dimensionOptions
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.body_text.fields.shadow_alpha.text`),
              name: 'box.body.shadow.alpha',
              prompt: t(`${sectionPrefix}.body_text.fields.shadow_alpha.prompt`),
              type: 'slider',
              minimum: 0,
              maximum: 1
            }
          ]
        }
      ];
    }
  }, {
    name: 'textbox',
    noReset: true
  }, 'controlPane');
  $.gridSidebar.registerConfig('textbox', 'pane_storiesTextbox');

  $.Control.extend('pane_storiesPager', {
    getTitle: () => t('panes.pager.title'),

    getSubtitle: () => t('panes.pager.subtitle'),

    _getCurrentData: function() {
      return this._super() || publishNS.resolveWorkingTheme();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function() {
      const sectionPrefix = 'panes.pager.sections';
      return [
        {
          title: t(`${sectionPrefix}.layout.label`),
          name: 'pager',
          fields: [
            {
              text: t(`${sectionPrefix}.layout.fields.position.text`),
              name: 'pager.position',
              prompt: t(`${sectionPrefix}.layout.fields.position.prompt`),
              type: 'radioSelect',
              options: [
                {
                  value: 'center',
                  label: t(`${sectionPrefix}.layout.fields.position.option_center`)
                },
                {
                  value: 'box',
                  label: t(`${sectionPrefix}.layout.fields.position.option_box`)
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.layout.fields.type.text`),
              name: 'pager.type',
              prompt: t(`${sectionPrefix}.layout.fields.type.prompt`),
              type: 'radioSelect',
              options: [
                {
                  value: 'bullets',
                  label: t(`${sectionPrefix}.layout.fields.type.option_bullets`)
                },
                {
                  value: 'numbers',
                  label: t(`${sectionPrefix}.layout.fields.type.option_numbers`)
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.layout.fields.disposition.text`),
              name: 'pager.disposition',
              prompt: t(`${sectionPrefix}.layout.fields.disposition.subtitle`),
              type: 'radioSelect',
              options: [
                {
                  value: 'light',
                  label: t(`${sectionPrefix}.layout.fields.disposition.option_light`)
                },
                {
                  value: 'dark',
                  label: t(`${sectionPrefix}.layout.fields.disposition.option_dark`)
                }
              ]
            }
          ]
        }
      ];
    }
  }, {
    name: 'pager',
    noReset: true
  }, 'controlPane');
  $.gridSidebar.registerConfig('pager', 'pane_storiesPager');

  $.Control.extend('pane_storiesOther', {
    getTitle:  () => t('panes.other.title'),

    getSubtitle: () =>  t('panes.other.subtitle'),

    _getCurrentData: function() {
      return this._super() || publishNS.resolveWorkingTheme();
    },

    _changeHandler: publishNS.handleValueChanged,

    _getSections: function() {
      const sectionPrefix = 'panes.other.sections';
      return [
        {
          title: t(`${sectionPrefix}.background.label`),
          name: 'background',
          fields: [
            {
              type: 'group',
              text: t(`${sectionPrefix}.background.fields.height.text`),
              includeLabel: true,
              lineClass: 'dimensions',
              options: [
                {
                  type: 'text',
                  name: 'height.value',
                  inputOnly: true
                },
                {
                  type: 'static',
                  name: 'height.unit',
                  inputOnly: true,
                  value: 'em'
                }
              ]
            },
            {
              text: t(`${sectionPrefix}.background.fields.slide_advance.text`),
              name: 'autoAdvance',
              prompt: t(`${sectionPrefix}.background.fields.slide_advance.prompt`),
              type: 'slider',
              minimum: 0,
              maximum: 20
            },
            {
              value: t(`${sectionPrefix}.background.fields.description.value`),
              type: 'static'
            }
          ]
        }
      ];
    }
  }, {
    name: 'other',
    noReset: true
  }, 'controlPane');
  $.gridSidebar.registerConfig('other', 'pane_storiesOther');

  //////////////////////////////////////
  // SECTION: Styling Helpers

  blist.publish.findCache = {};
  blist.publish.findContextElem = function(selector) {
    if (_.isUndefined(publishNS.findCache[selector])) {
      publishNS.findCache[selector] = $(selector);
    }
    return publishNS.findCache[selector];
  };

  blist.publish.applyCustomizationToPreview = function(hash) {
    publishNS.applicator(publishNS.customizationApplication, hash);

    // apply some weird things we can't handle in the applicator
    var $storyTextbox = $('.storiesContainer .storyTextbox');
    $storyTextbox.height($('.storiesContainer').height() - 30 -
      ($storyTextbox.outerHeight(true) - $storyTextbox.outerHeight(false)));

    var $pager = $('.storiesContainer .storyPager');
    if (!$('.storiesContainer .storyPagerBackground').is(':visible')) {
      // then pager is in box mode.
      $pager.width($storyTextbox.width());
    } else {
      // the pager is in centered mode; unset explicit width
      $pager.css('width', '');
    }
  };

  blist.publish.generateStyleNode = function() {
    return $('head').
      append('<style id="customizationStyles" type="text/css"></style>').
      children('#customizationStyles')[0];
  };

  blist.publish.retrieveStylesheets = function() {
    return document.styleSheets;
  };


  //////////////////////////////////////
  // SECTION: Data Handling Methods

  blist.publish.initCustomization = function() {
    publishNS.workingTheme = $.extend(true, {}, publishNS.currentTheme);

    $('.publisherHeader').removeClass('unsaved');
    if (!_.isUndefined(publishNS.sidebar)) {
      publishNS.sidebar.refresh();
    }
  };

  blist.publish.cleanData = function(data) {
    // right now, we're clean on this page.
    return data;
  };

  blist.publish.saveCustomization = function(callback) {
    $.ajax({
      url: '/admin/home/stories/appearance',
      type: 'PUT',
      cache: false,
      contentType: 'application/json',
      data: JSON.stringify({
        stories: publishNS.cleanData(publishNS.workingTheme)
      }),
      dataType: 'json',
      success: function(response) {
        // update with latest from server
        publishNS.currentTheme = response;

        publishNS.initCustomization();
        callback();
      },
      error: function() {
        // TODO: wait and retry and/or notify user
      }
    });
  };


  $(function() {
    // Init data
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
    publishNS.sidebar.show('textbox');

    // Load in customization
    publishNS.applyCustomizationToPreview(publishNS.workingTheme);

    $('.previewScrollContainer').css('height', '100%').css('width', '100%');

  });

})(jQuery);
