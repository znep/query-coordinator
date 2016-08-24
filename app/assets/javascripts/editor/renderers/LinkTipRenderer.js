import $ from 'jQuery';

import I18n from '../I18n';
import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import { dispatcher} from '../Dispatcher';
import { linkModalStore } from '../stores/LinkModalStore';
import { linkTipStore } from '../stores/LinkTipStore';

/**
 * @class LinkTipRenderer
 * @description
 * Renders a link tip template based on information
 * from the LinkTipStore.
 */
export default function LinkTipRenderer() {
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
        StorytellerUtils.format(
          '<span class="link-edit" data-action="{0}">{1}</span>',
          Actions.LINK_MODAL_OPEN,
          I18n.t('editor.rich_text_toolbar.link_tip.edit')
        ) +
        '<span class="link-tip-divider"></span>' +
        StorytellerUtils.format(
          '<span class="link-remove" data-action="{0}">{1}</span>',
          Actions.LINK_TIP_REMOVE,
          I18n.t('editor.rich_text_toolbar.link_tip.remove')
        ) +
      '</div>'
    );
  }

  function compileDOM() {
    $tip = $(template());
    $link = $tip.find('.link-text');
  }

  function attachEvents() {
    $(document.documentElement).on('click', '#link-tip [data-action]', dispatchActions);
    linkTipStore.addChangeListener(render);
    linkModalStore.addChangeListener(render);
  }

  function detachEvents() {
    $(document.documentElement).off('click', dispatchActions);
    linkTipStore.removeChangeListener(render);
    linkModalStore.removeChangeListener(render);
    $tip.remove();
    $tip = null;
  }

  function dispatchActions(event) {
    var action = event.target.getAttribute('data-action');

    switch (action) {
      case Actions.LINK_MODAL_OPEN:
        dispatcher.dispatch({
          action: Actions.LINK_MODAL_OPEN,
          editorId: linkTipStore.getEditorId(),
          text: linkTipStore.getInputs().text,
          link: linkTipStore.getInputs().link,
          openInNewWindow: linkTipStore.getInputs().openInNewWindow
        });
        break;
      case Actions.LINK_TIP_REMOVE:
        dispatcher.dispatch({
          action: Actions.LINK_TIP_REMOVE
        });
        break;
    }
  }

  function render() {
    var editorId = linkTipStore.getEditorId();
    var visible = linkTipStore.getVisibility();
    var inputs = linkTipStore.getInputs();
    var boundingClientRect = linkTipStore.getBoundingClientRect();

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
    var $container = editorId ? $(StorytellerUtils.format('[data-editor-id="{0}"]', editorId)) : $('body');

    // Append here, or else the first time you insert this tip into the DOM,
    // your height calculation will be wrong.
    if (_.last($container[0].children) !== $tip[0]) {
      $container.append($tip);
    }

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
  }
}
