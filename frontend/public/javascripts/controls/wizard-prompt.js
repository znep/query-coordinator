(function($) {
  $.fn.wizardPrompt = function(options) {
    // Check if object was already created
    var wizardPrompt = $(this[0]).data('wizardPrompt');
    if (!wizardPrompt) {
      wizardPrompt = new WizardPromptObj(options, this[0]);
    }
    return wizardPrompt;
  };

  var WizardPromptObj = function(options, dom) {
    this.settings = $.extend({}, WizardPromptObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(WizardPromptObj, {
    defaults: {
      buttons: null,
      buttonCallback: null,
      closeCallback: null,
      closeEvents: null,
      closeSelector: 'a:not(.wizExclude), :input:not(.wizExclude)',
      positions: null,
      prompt: null
    },

    prototype: {
      init: function() {
        var wizObj = this;
        var $domObj = wizObj.$dom();
        $domObj.data('wizardPrompt', wizObj);
        wizObj._uid = _.uniqueId();

        var $msg = $('<div class="wizardPrompt">' +
          '<a href="#close" title="Dismiss" class="wizardDismiss"></a>' +
          '<span class="prompt">' + wizObj.settings.prompt + '</span>' +
          '</div>');
        if (!_.isEmpty(wizObj.settings.buttons)) {
          $msg.append('<ul class="actionButtons"></ul>');
          var $list = $msg.find('ul.actionButtons');
          _.each(wizObj.settings.buttons, function(b) {
            var $link = $.button($.htmlEscape(b.text));
            $link.data('wizardValue', b.value);
            $list.append($('<li></li>').append($link));
          });
        }

        $msg.find('.actionButtons a').click(function(e) {
          e.preventDefault();
          if (!_.isNull(wizObj.settings.buttonCallback)) {
            wizObj.settings.buttonCallback($(this).data('wizardValue'));
          }

          // Make sure button callback happens first
          _.defer(function() {
            wizObj.close();
          });
        });

        $msg.children('.wizardDismiss').click(function(e) {
          e.preventDefault();
          if (_.isFunction(wizObj.settings.dismissCallback)) {
            wizObj.settings.dismissCallback();
          }
          wizObj.close();
        });

        $domObj.socrataTip({
          content: $msg,
          closeOnClick: false,
          overlap: -10,
          trigger: 'now',
          killTitle: false,
          positions: wizObj.settings.positions
        });

        var events = wizObj.settings.closeEvents;
        if (_.isNull(events)) {
          events = 'click, change';
        }
        var $closeItems = $domObj.find(wizObj.settings.closeSelector).
          andSelf().filter(wizObj.settings.closeSelector);
        if (typeof events == 'string') {
          events = events.replace(/\s+/g, '').split(',');
        }
        _.each(events, function(ev) {
          $closeItems.bind(ev + '.wizardPrompt' + wizObj._uid,
            function() {
              wizObj.close();
            });
        });
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      },

      close: function() {
        var wizObj = this;
        wizObj.$dom().socrataTip().destroy();
        wizObj.$dom().removeData('wizardPrompt');

        var $closeItems = wizObj.$dom().find(wizObj.settings.closeSelector);
        $closeItems.unbind('.wizardPrompt' + wizObj._uid);

        if (!_.isNull(wizObj.settings.closeCallback)) {
          wizObj.settings.closeCallback();
        }
      }
    }
  });

})(jQuery);
