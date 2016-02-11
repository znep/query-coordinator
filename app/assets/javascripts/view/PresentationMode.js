(function(root) {
  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

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
    var blacklist = ['spacer', 'horizontal-rule'];
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));

    var userStory = document.querySelector('.user-story');
    var presentationMode = document.querySelector('.btn-presentation-mode');
    var editButton = document.querySelector('.btn-edit');
    var presentationButtons = {
      next: document.querySelector('.btn-presentation-next'),
      previous: document.querySelector('.btn-presentation-previous')
    };

    attachPageIndexes();
    attachEvents();

    function attachPageIndexes() {
      var index = 0;

      blocks.forEach(function(block) {
        if (notBlacklisted(block)) {
          block.setAttribute('data-page-index', index++);
        }
      });
    }

    function attachEvents() {
      if (editButton) { editButton.addEventListener('click', editPage); }

      document.documentElement.addEventListener('keyup', pageOrClose);
      presentationButtons.next.addEventListener('click', pageNext);
      presentationButtons.previous.addEventListener('click', pagePrevious);
      presentationMode.addEventListener('click', enablePresentationMode);
    }

    function editPage() {
      var hasSlash = window.location.href.lastIndexOf('/') === window.location.href.length - 1;
      var slash = hasSlash ? '' : '/';

      window.location = window.location.href + slash + 'edit';
    }

    function enablePresentationMode() {
      if (userStory.classList.contains('presentation-mode')) {
        enableLinearMode();
      } else {

        if (editButton) { editButton.classList.add('hidden'); }

        userStory.classList.add('presentation-mode');
        presentationMode.classList.remove('icon-presentation');
        presentationMode.classList.add('icon-cross2');
        presentationButtons.previous.classList.remove('hidden');
        presentationButtons.next.classList.remove('hidden');

        blocks.forEach(function(block) {
          var index = parseInt(block.getAttribute('data-page-index'));
          if (index !== 0) {
            block.classList.add('hidden');
          } else {
            block.classList.remove('hidden');
          }
        });
      }
    }

    function enableLinearMode() {
      if (editButton) { editButton.classList.remove('hidden'); }

      userStory.classList.remove('presentation-mode');
      presentationMode.classList.remove('icon-cross2');
      presentationMode.classList.add('icon-presentation');
      presentationButtons.previous.classList.add('hidden');
      presentationButtons.next.classList.add('hidden');

      blocks.forEach(function(block) {
        block.classList.remove('hidden');
      });

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function pageNext() {
      var visible = document.querySelector('.block:not(.hidden)');
      var nextIndex = parseInt(visible.getAttribute('data-page-index'), 10) + 1;
      var nextVisible = document.querySelector('.block[data-page-index="' + nextIndex + '"]');

      nextVisible = nextVisible || document.querySelector('.block[data-page-index="0"]');

      visible.classList.add('hidden');
      nextVisible.classList.remove('hidden');
    }

    function pagePrevious() {
      var visible = document.querySelector('.block:not(.hidden)');
      var previousIndex = parseInt(visible.getAttribute('data-page-index'), 10) - 1;
      var previousVisible = document.querySelector('.block[data-page-index="' + previousIndex + '"]');
      var pageable = Array.prototype.slice.call(document.querySelectorAll('.block[data-page-index]'));

      previousVisible = previousVisible ||
        document.querySelector('.block[data-page-index="{0}"]'.format(pageable.length - 1));

      visible.classList.add('hidden');
      previousVisible.classList.remove('hidden');
    }

    function pageOrClose(event) {
      var key = event.charCode || event.keyCode;
      var isPresenting = document.querySelector('.presentation-mode');

      if (isPresenting) {
        // 27 == ESC, 37 == <-, 39 == ->
        if (key === 27) {
          enableLinearMode();
        } else if (key === 37) {
          pagePrevious();
        } else if (key === 39) {
          pageNext();
        }
      } else {
        // 80 == p
        if (key === 80) {
          enablePresentationMode();
        }
      }
    }

    function notBlacklisted(element) {
      var component = element.querySelector('.component-container > .component');
      var classes = Array.prototype.slice.call(component.classList);

      return classes.every(function(value) {
        return blacklist.indexOf(value.replace('component-', '')) === -1;
      });
    }
  }

  storyteller.PresentationMode = PresentationMode;
})(window);
