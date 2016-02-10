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
      var editButton = document.querySelector('.btn-edit');

      if (editButton) {
        editButton.addEventListener('click', editPage);
      }

      document.documentElement.addEventListener('keyup', pageOrClose);
      document.querySelector('.btn-presentation-next').addEventListener('click', pageNext);
      document.querySelector('.btn-presentation-previous').addEventListener('click', pagePrevious);
      document.querySelector('.btn-presentation-mode').addEventListener('click', enablePresentationMode);
    }

    function editPage() {
      var slash = window.location.href.lastIndexOf('/') === window.location.href.length - 1 ?  '' : '/';
      window.location = window.location.href + slash + 'edit';
    }

    function enablePresentationMode() {
      var userStory = document.querySelector('.user-story');

      if (userStory.classList.contains('presentation-mode')) {
        enableLinearMode();
      } else {
        var editButton = document.querySelector('.btn-edit');
        var presentationModeButton = document.querySelector('.btn-presentation-mode');

        userStory.classList.add('presentation-mode');

        presentationModeButton.classList.remove('icon-presentation');
        presentationModeButton.classList.add('icon-cross2');


        if (editButton) {
          editButton.classList.add('hidden');
        }

        blocks.forEach(function(block) {
          var index = parseInt(block.getAttribute('data-page-index'));
          block.classList.toggle('hidden', index !== 0);
        });

        document.querySelector('.btn-presentation-previous').classList.remove('hidden');
        document.querySelector('.btn-presentation-next').classList.remove('hidden');
      }
    }

    function enableLinearMode() {
      var editButton = document.querySelector('.btn-edit');
      var presentationModeButton = document.querySelector('.btn-presentation-mode');

      document.querySelector('.user-story').classList.remove('presentation-mode');

      if (editButton) {
        editButton.classList.remove('hidden');
      }

      presentationModeButton.classList.remove('icon-cross2');
      presentationModeButton.classList.add('icon-presentation');

      blocks.forEach(function(block) {
        block.classList.remove('hidden');
      });

      document.querySelector('.btn-presentation-previous').classList.add('hidden');
      document.querySelector('.btn-presentation-next').classList.add('hidden');

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
          presentationMode();
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
