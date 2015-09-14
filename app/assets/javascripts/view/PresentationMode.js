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
    var pageable;
    var blacklist = ['spacer', 'horizontal-rule'];
    var presentationNavigation = document.querySelector('.presentation-navigation');
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));
    var index = 0;

    blocks.forEach(function(block) {
      if (notBlacklisted(block)) {
        block.setAttribute('data-page-index', index++);
      }
    });

    pageable = Array.prototype.slice.call(document.querySelectorAll('.block[data-page-index]'));

    document.documentElement.addEventListener('keyup', pageOrClose);
    document.querySelector('.btn-presentation-next').addEventListener('click', pageNext);
    document.querySelector('.btn-presentation-previous').addEventListener('click', pagePrevious);
    document.querySelector('.btn-presentation-mode').addEventListener('click', enablePresentationMode);
    document.querySelector('.btn-linear-mode').addEventListener('click', enableLinearMode);

    function enablePresentationMode(event) {
      document.querySelector('.user-story').classList.add('presentation-mode');
      event.target.setAttribute('disabled', 'disabled');
      document.querySelector('.btn-linear-mode').removeAttribute('disabled');

      blocks.forEach(function(block) {
        block.classList.toggle('hidden', block !== pageable[0]);
      });

      presentationNavigation.classList.remove('hidden');
    }

    function enableLinearMode(event) {
      document.querySelector('.user-story').classList.remove('presentation-mode');
      event.target.setAttribute('disabled', 'disabled');
      document.querySelector('.btn-presentation-mode').removeAttribute('disabled');

      blocks.forEach(function(block) {
        block.classList.remove('hidden');
      });

      presentationNavigation.classList.add('hidden');

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    function pageNext() {
      var visible = document.querySelector('.block:not(.hidden)');
      var nextIndex = parseInt(visible.getAttribute('data-page-index'), 10) + 1;
      var nextVisible = document.querySelector('.block[data-page-index="' + nextIndex + '"]');

      nextVisible = nextVisible ? nextVisible : document.querySelector('.block[data-page-index="0"]');

      visible.classList.add('hidden');
      nextVisible.classList.remove('hidden');
    }

    function pagePrevious() {
      var visible = document.querySelector('.block:not(.hidden)');
      var previousIndex = parseInt(visible.getAttribute('data-page-index'), 10) - 1;
      var previousVisible = document.querySelector('.block[data-page-index="' + previousIndex + '"]');

      previousVisible = previousVisible ? previousVisible : document.querySelector('.block[data-page-index="' + (pageable.length - 1) + '"]');

      visible.classList.add('hidden');
      previousVisible.classList.remove('hidden');
    }

    function pageOrClose(event) {
      var key = event.charCode || event.keyCode;
      var isPresenting = document.querySelector('.presentation-mode').length === 1;

      if (isPresenting) {
        switch (key) {
          // ESC
          case 27:
            document.querySelector('.btn-linear-mode').click();
            break;
          // <=
          case 37:
            pagePrevious();
            break;
          // =>
          case 39:
            pageNext();
            break;
        }
      } else {
        switch (key) {
          // p
          case 80:
            document.querySelector('.btn-presentation-mode').click();
            break;
        }
      }
    }

    function notBlacklisted(element) {
      element = element.querySelector('.component-container > .component');
      var classes = Array.prototype.slice.call(element.classList);
      return classes.every(function(value) {
        return blacklist.indexOf(value.replace('component-', '')) === -1;
      });
    }
  }

  storyteller.PresentationMode = PresentationMode;
})(window);
