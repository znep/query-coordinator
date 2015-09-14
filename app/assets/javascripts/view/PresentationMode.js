(function(root) {

  var socrata = root.socrata;
  var storyteller = root.socrata.storyteller;

  /**
   * @class PresentationMode
   * @description
   * Adds functionality to the presentation mode template.
   * This includes:
   * - Taking a preview-mode story and showing blocks one at a time.
   * - Paging between individual blocks
   * - Resizing the content to fit appropriately into the screen size.
   */
  function PresentationMode() {
    document.documentElement.addEventListener('keyup', keybindings);
    document.querySelector('.btn-presentation-next').addEventListener('click', pageNext);
    document.querySelector('.btn-presentation-previous').addEventListener('click', pagePrevious);
    document.querySelector('.btn-presentation-mode').addEventListener('click', enablePresentationMode);
    document.querySelector('.btn-linear-mode').addEventListener('click', enableLinearMode);

    function render() {
      if (storyteller.presentationModeStore.isEnabled()) {
        renderPresentationMode();
        renderPage();
      } else {
        renderLinearMode();
      }
    }

    function renderPresentationMode() {
      document.querySelector('.user-story').classList.add('presentation-mode');
      document.querySelector('.btn-presentation-mode').setAttribute('disabled', 'disabled');
      document.querySelector('.btn-linear-mode').removeAttribute('disabled');
      document.querySelector('.presentation-navigation').classList.remove('hidden');
    }

    function renderPage() {
      var visibleBlockId = storyteller.presentationModeStore.getVisibleBlockId();
      var hiddenBlockIds = storyteller.presentationModeStore.getHiddenBlockIds();

      hiddenBlockIds.forEach(function(blockId) {
        document.
          querySelector('.block[data-block-id="{0}"]'.format(blockId)).
          classList.add('hidden');
      });

      document.
        querySelector('.block[data-block-id="{0}"]'.format(visibleBlockId)).
        classList.remove('hidden');
    }

    function renderLinearMode() {
      var blockIds = storyteller.storyStore.getStoryBlockIds();

      document.
        querySelector('.user-story').
        classList.remove('presentation-mode');

      document.
        querySelector('.btn-linear-mode').
        setAttribute('disabled', 'disabled');

      document.
        querySelector('.btn-presentation-mode').
        removeAttribute('disabled');

      blockIds.forEach(function(blockId) {
        document.
          querySelector('.block[data-block-id="{0}"]'.format()).
          classList.remove('hidden');
      });

      presentationNavigation.classList.add('hidden');

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function enablePresentationMode(event) {
      storyteller.dispatcher.dispatch({
        action: Constants.PRESENTATION_MODE_ENABLE
      });
    }

    function enableLinearMode(event) {
      storyteller.dispatcher.dispatch({
        action: Constants.PRESENTATION_MODE_DISABLE
      });
    }

    function pageNext() {
      storyteller.dispatcher.dispatch({
        action: Constants.PRESENTATION_MODE_PAGE_NEXT
      });
    }

    function pagePrevious() {
      storyteller.dispatcher.dispatch({
        action: Constants.PRESENTATION_MODE_PAGE_PREVIOUS
      });
    }

    function keybindings(event) {
      var key = event.charCode || event.keyCode;
      var isPresenting = storyteller.presentationModeStore.isEnabled();

      if (storyteller.presentationModeStore.isEnabled()) {
        switch (key) {
          // ESC
          case 27:
            storyteller.dispatcher.dispatch({
              action: Constants.PRESENTATION_MODE_DISABLE
            });
            break;
          // <=
          case 37:
            storyteller.dispatcher.dispatch({
              action: Constants.PRESENTATION_MODE_PAGE_PREVIOUS
            });
            break;
          // =>
          case 39:
            storyteller.dispatcher.dispatch({
              action: Constants.PRESENTATION_MODE_PAGE_NEXT
            });
            break;
        }
      } else {
        switch (key) {
          // p
          case 80:
            storyteller.dispatcher.dispatch({
              action: Constants.PRESENTATION_MODE_ENABLE
            });
            break;
        }
      }
    }
  }

  storyteller.PresentationMode = PresentationMode;
})(window);
