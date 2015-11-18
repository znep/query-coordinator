(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  /**
   * @class LinkTipRenderer
   * @description
   * Renders a link tip template based on information
   * from the LinkTipStore.
   */
  function LinkTipRenderer() {
    var $tip;
    var $link;

    compileDOM();
    attachEvents();

    this.destroy = function() {
      detachEvents();
    };

    function template() {
      return (
        '<div id="link-tip">' +
          '<a class="link-text" href target="_blank"></a>' +
          '<span class="link-tip-divider"></span>' +
          '<span class="link-edit" data-action="{0}">{1}</span>'.
            format(Actions.LINK_MODAL_OPEN, I18n.t('editor.rich_text_toolbar.link_tip.edit')) +
          '<span class="link-tip-divider"></span>' +
          '<span class="link-remove" data-action="{0}">{1}</span>'.
            format(Actions.LINK_TIP_REMOVE, I18n.t('editor.rich_text_toolbar.link_tip.remove')) +
        '</div>'
      );
    }

    function compileDOM() {
      $tip = $(template());
      $link = $tip.find('.link-text');
    }

    function attachEvents() {
      $(document.documentElement).on('click', '#link-tip [data-action]', dispatchActions);
      storyteller.linkTipStore.addChangeListener(render);
      storyteller.linkModalStore.addChangeListener(render);
    }

    function detachEvents() {
      $(document.documentElement).off('click', dispatchActions);
      storyteller.linkTipStore.removeChangeListener(render);
      storyteller.linkModalStore.removeChangeListener(render);
      $tip.remove();
      $tip = null;
    }

    function dispatchActions(event) {
      var action = event.target.getAttribute('data-action');

      switch (action) {
        case Actions.LINK_MODAL_OPEN:
          storyteller.dispatcher.dispatch({
            action: Actions.LINK_MODAL_OPEN,
            editorId: storyteller.linkTipStore.getEditorId(),
            text: storyteller.linkTipStore.getInputs().text,
            link: storyteller.linkTipStore.getInputs().link,
            openInNewWindow: storyteller.linkTipStore.getInputs().openInNewWindow
          });
          break;
        case Actions.LINK_TIP_REMOVE:
          storyteller.dispatcher.dispatch({
            action: Actions.LINK_TIP_REMOVE
          });
          break;
      }
    }

    function render() {
      var editorId = storyteller.linkTipStore.getEditorId();
      var visible = storyteller.linkTipStore.getVisibility();
      var inputs = storyteller.linkTipStore.getInputs();
      var boundingClientRect = storyteller.linkTipStore.getBoundingClientRect();

      updateLink(inputs);
      placeTip(editorId, boundingClientRect);
      toggleTip(visible);
    }

    function updateLink(inputs) {
      inputs = inputs || {link: ''};

      $link.
        attr('title', inputs.link).
        attr('href', inputs.link).
        text(inputs.link);
    }

    function toggleTip(predicate) {
      $tip[predicate ? 'addClass' : 'removeClass']('visible');
    }

    function placeTip(editorId, boundingClientRect) {
      var padding = 5;
      var $container = editorId ? $('[data-editor-id="{0}"]'.format(editorId)) : $('body');

      var clientRect = boundingClientRect || $container[0].getBoundingClientRect();
      var linkTipWidth = $tip.outerWidth(true);
      var linkTipHeight = $tip.outerHeight(true);

      var overflows = (clientRect.left + linkTipWidth) > $container.outerWidth(true);

      var linkTipLeft = (overflows) ?
        clientRect.left - linkTipWidth + clientRect.width :
        clientRect.left;

      $tip.css({
        top: clientRect.top - linkTipHeight - padding,
        left: Math.max(linkTipLeft, 0)
      });

      $container.append($tip);
    }
  }

  storyteller.LinkTipRenderer = LinkTipRenderer;
})();
