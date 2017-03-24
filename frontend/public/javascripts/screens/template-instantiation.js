/**
 * This contains the logic for instantiating a template
 */
(function($) {

  var $form = $('#insertionForm'),
    $renderTo = $('div.socrata-root'),
    $wizard = $('div.templateCreation'),
    $body = $(document.body);

  $.cf.configuration({
    mask: false,
    editOnly: true,
    sidebar: false
  });

  $(document).bind('canvas_initialized', _.once(function() {
    $.cf.edit(true);
    $form.find('div.insertion-container.insertion-required input').addClass('required');
    $form.validate({
      errorPlacement: function(lbl, $el) {
        lbl.insertAfter($el.closest('div.insertion-container'));
      }
    });
  }));

  $wizard.wizard({
    paneConfig: {
      'template': {
        onActivate: function($pane, config, state) {
          _.each(state.insertionTips || [], function(tip) {
            tip.enable();
          });
        },

        onInitialize: function($pane, config, state) {
          state.insertionTips = [];
          $pane.find('div.insertion').each(function() {
            var $t = $(this);
            state.insertionTips.push(
              $t.find('div.insertion-container').socrataTip({
                content: $t.find('div.tooltip').html()
              })
            );
          });
        },

        onLeave: function($pane, config, state) {
          _.each(state.insertionTips || [], function(tip) {
            tip.hide();
            tip.disable();
          });
        },

        onNext: function() {
          $body.removeClass('instantiating');

          var insertions = [];
          $.component.root.edit(false);
          insertions.push($.component.root.properties());
          // de-register components
          $.component.root.destroy();

          // reset configuration
          $.cf.edit(false);
          $.cf.initialize($('div.socrata-cf-top'), {
            edit: false
          });

          return 'rendered';
        }
      },

      'rendered': {
        isFinish: true,

        onActivate: function($pane) {
          $pane.append($renderTo);
        },

        onAnimatedIn: function() {
          $wizard.replaceWith($renderTo);
        },

        onNext: function() {
          $.cf.save();
          return false;
        }
      }
    },

    onCancel: function() {
      // TODO: Something more appropriate than this?
      window.location.href = $.path('/profile');
    },

    finishText: 'Create'
  });

  $body.addClass('instantiating');

})(jQuery);
