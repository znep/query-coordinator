(function($) {
  $.fn.formatOptions = function(options) {
    // build main options before element iteration
    var opts = $.extend({}, $.fn.formatOptions.defaults, options);

    // iterate and do stuff to each matched element
    return this.each(function() {
      var $fmtMenu = $(this);
      // build element specific options
      var config = $.meta ? $.extend({}, opts, $fmtMenu.data()) : opts;
      $fmtMenu.data('config-formatOptions', config);

      config.$grid = $(config.gridSelector);

      $fmtMenu.find('a.toggleButton').click(function(e) {
        e.preventDefault();
        var $button = $(this);
        var action = $button.attr('href').split('_')[1];
        if (!$.isBlank(config.formatEditor)) {
          var newVal = !$button.is('.active');
          if (action == 'link') {
            if (!newVal) {
              config.formatEditor.action('unlink');
            } else {
              var url = prompt('Enter a URL:');
              if (url !== null) {
                // theoretically all we have to do is leave this alone and tinymce
                // will handle email for us. but either we're sidestepping that
                // machinery or our version of tinymce is too old, so do it ourselves.
                if (url.match(/^.+@.+\..+/)) {
                  url = 'mailto:' + url;
                } else if (!url.match(/^(f|ht)tps?:\/\//)) {
                  url = 'http://' + url;
                }
                config.formatEditor.action('link', url);
              }
            }
          } else {
            config.formatEditor.action(action, newVal);
          }
        }
      });

      $fmtMenu.find('select').change(function() {
        var $select = $(this);
        var action = $select.attr('name').split('_')[1];
        var val = $select.val();
        if ($select.is('.fontSize')) {
          val = (val / 10.0) + 'em';
        }
        if (!$.isBlank(config.formatEditor)) {
          config.formatEditor.action(action, val);
        }
      });

      $fmtMenu.find('.menu.align').menu({
          menuButtonContents: $.tag({
            tagName: 'span',
            'class': 'alignIcon'
          }, true),
          menuButtonTitle: 'Alignment',
          contents: [{
            title: 'Align Left',
            className: 'alignLeft',
            href: '#format_justifyLeft'
          }, {
            title: 'Align Center',
            className: 'alignCenter',
            href: '#format_justifyCenter'
          }, {
            title: 'Align Right',
            className: 'alignRight',
            href: '#format_justifyRight'
          }]
        }).
        find('a').mousedown(function(e) {
          e.stopPropagation();
        }).end().
        find('.menuDropdown a').click(function(event) {
          event.preventDefault();

          var $target = $(event.currentTarget);
          var href = $target.attr('href');
          var s = href.slice(href.indexOf('#') + 1).split('_');
          var action = s[1];
          if (!$.isBlank(config.formatEditor)) {
            config.formatEditor.action(action, true);
          }
        });


      var $colorItem = $fmtMenu.find('a.color');
      $colorItem.colorPicker().bind('color_change', function(e, newColor) {
          if (!$.isBlank(config.formatEditor)) {
            config.formatEditor.action('color', newColor);
          }
          $colorItem.children('.colorIndicator').css('border-bottom-color', newColor);
        }).
        mousedown(function() {
          $colorItem.data('colorpicker-color', $colorItem.find('.colorIndicator').css('border-bottom-color'));
        }).click(function(e) {
          e.preventDefault();
        });
      $('#color_selector').mousedown(function(e) {
        e.stopPropagation();
      });


      config.$grid.bind('action-state-change', function(e) {
        if (!$(e.target).isControlClass('blistEditor')) {
          return;
        }
        config.formatEditor = $(e.target).blistEditor();
        if (!config.formatEditor.supportsFormatting()) {
          $fmtMenu.addClass('disabled');
          return;
        }

        config.formatEditor.registerExternalEditor($fmtMenu);
        $fmtMenu.removeClass('disabled');
        var state = config.formatEditor.getActionStates();

        var $bold = $fmtMenu.find('a.bold');
        state.bold.value ? $bold.addClass('active') :
          $bold.removeClass('active');
        var $italic = $fmtMenu.find('a.italic');
        state.italic.value ? $italic.addClass('active') :
          $italic.removeClass('active');
        var $underline = $fmtMenu.find('a.underline');
        state.underline.value ? $underline.addClass('active') :
          $underline.removeClass('active');
        var $strike = $fmtMenu.find('a.strike');
        state.strikethrough.value ? $strike.addClass('active') :
          $strike.removeClass('active');

        var $bulletList = $fmtMenu.find('a.bulletedList');
        state.unorderedList.value ? $bulletList.addClass('active') :
          $bulletList.removeClass('active');
        var $numList = $fmtMenu.find('a.numberedList');
        state.orderedList.value ? $numList.addClass('active') :
          $numList.removeClass('active');

        var $link = $fmtMenu.find('a.link');
        state.unlink.enabled ? $link.addClass('active') :
          $link.removeClass('active');

        var $fontFamily = $fmtMenu.find('.fontFamily');
        var family = (state.fontFamily.value || 'arial').toLowerCase();
        // First look for exact match
        var $famOpt = $fontFamily.find('[value="' + family + '"]');
        // If that is not found, look for something that starts with it
        if ($famOpt.length < 1) {
          $famOpt = $fontFamily.find('[value^="' + family + '"]');
        }
        // If that is not found, look for something that contains it
        if ($famOpt.length < 1) {
          $famOpt = $fontFamily.find('[value*="' + family + '"]');
        }
        if ($famOpt.length > 0) {
          $fontFamily.val($famOpt.eq(0).val());
        }

        var $fontSize = $fmtMenu.find('.fontSize');
        var size = state.fontSize.value || '10';
        // Our size may be in ems or pxs; convert as appropriate
        if (typeof size == 'string' && size.endsWith('em')) {
          size = parseFloat(size) * 10;
        } else {
          size = parseFloat(size);
        }
        var $sizeOpts = $fontSize.find('option');
        var foundSize = false;
        // Look through all the dropdown options and find which matches best
        for (var i = 0; i < $sizeOpts.length - 1; i++) {
          var curVal = parseFloat($sizeOpts.eq(i).val());
          if (curVal >= size) {
            $fontSize.val(curVal);
            foundSize = true;
            break;
          }
          var nextVal = parseFloat($sizeOpts.eq(i + 1).val());
          if (nextVal > size) {
            if ((nextVal + curVal) / 2.0 > size) {
              $fontSize.val(curVal);
            } else {
              $fontSize.val(nextVal);
            }
            foundSize = true;
            break;
          }
        }
        // If none match, it is large; so choose the last one
        if (!foundSize) {
          $fontSize.val($sizeOpts.eq($sizeOpts.length - 1).val());
        }

        var $color = $fmtMenu.find('.color .colorIndicator');
        // IE7 is very strict in what it accepts for colors, so do a bunch
        // of munging to make it a 6-digit hex string
        var hexColor = state.color.value + '';
        if (!hexColor.startsWith('#') && !hexColor.startsWith('rgb(')) {
          hexColor = (parseInt(state.color.value) || 0).toString(16);
          var hexPad = 6 - hexColor.length;
          for (i = 0; i < hexPad; i++) {
            hexColor = '0' + hexColor;
          }
          hexColor = '#' + hexColor.slice(0, 6);
        }
        $color.css('border-bottom-color', hexColor);

        var $alignment = $fmtMenu.find('.menu.align').removeClass('alignRight alignCenter');
        if (state.justifyRight.value) {
          $alignment.addClass('alignRight');
        } else if (state.justifyCenter.value) {
          $alignment.addClass('alignCenter');
        } else {
          $alignment.addClass('alignLeft');
        }

        if (!$.isBlank($.uniform) && !$.isBlank($.uniform.update)) {
          _.defer(function() {
            $.uniform.update($fmtMenu.find('.uniform :input'));
          });
        }
      });

      config.$grid.bind('edit-finished', function() {
        $fmtMenu.addClass('disabled').
          find('.active').
          removeClass('active').
          end().
          find('select').
          each(function(i, s) { $(s).val($(s).find('.default').val()); }).
          end().
          find('.menu.align').
          removeClass('alignRight alignCenter').
          addClass('alignLeft').
          end().
          find('.color .colorIndicator').
          css('border-bottom-color', '#000000');
        delete config.formatEditor;
      });

    });
  };

  $.fn.formatOptions.defaults = {
    gridSelector: ''
  };

})(jQuery);
