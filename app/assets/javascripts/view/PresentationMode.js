import _ from 'lodash';
import $ from 'jquery';

import Environment from '../StorytellerEnvironment';

/**
 * @class PresentationMode
 * @description
 * Adds functionality to the presentation mode template.
 * This includes:
 * - Taking a preview-mode story and showing blocks one at a time.
 * - Paging between individual blocks
 * - Resizing the content to fit appropriately into the screen size.
 */
export default function PresentationMode() {
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'));

  var userStory = document.querySelector('.user-story');
  var presentationMode = document.querySelector('.btn-presentation-mode');
  var editButton = document.querySelector('.btn-edit');
  var header = document.querySelector('#site-chrome-header');
  var footer = document.querySelector('#site-chrome-footer');
  var presentationButtons = {
    next: document.querySelector('.btn-presentation-next'),
    previous: document.querySelector('.btn-presentation-previous')
  };

  attachPageIndexes();
  attachEvents();
  presentOnStart();

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

  function presentOnStart() {
    var searchParameters = {};
    var search = window.location.search[0] === '?' ?
      window.location.search.slice(1) :
      window.location.search;

    var keyValues = _.compact(search.split('&'));

    _.each(keyValues, (keyValue) => {
      var [key, value] = keyValue.split('=');
      searchParameters[key] = value !== 'false';
    });

    if (searchParameters.present) {
      enablePresentationMode();
    }
  }

  function editPage() {
    const segment = Environment.IS_GOAL ? 'edit-story' : 'edit';
    window.location = `${window.location.pathname}/${segment}`.replace('//', '/');
  }

  function setUserStoryHeight() {
    const $userStory = $(userStory);
    const windowHeight = $(window).height();
    const headerHeight = $(header).outerHeight();

    if ($userStory.hasClass('presentation-mode')) {
      $userStory.css('min-height', `${windowHeight - headerHeight}px`);
    } else {
      $userStory.css('min-height', '');
    }
  }

  function enablePresentationMode() {
    if (userStory.classList.contains('presentation-mode')) {
      enableLinearMode();
    } else {

      if (editButton) { editButton.classList.add('hidden'); }

      userStory.classList.add('presentation-mode');
      footer.classList.add('presentation-mode');
      presentationMode.classList.remove('socrata-icon-presentation');
      presentationMode.classList.add('socrata-icon-close-2');
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
      setUserStoryHeight();
    }
  }

  function enableLinearMode() {
    if (editButton) { editButton.classList.remove('hidden'); }

    userStory.classList.remove('presentation-mode');
    footer.classList.remove('presentation-mode');
    presentationMode.classList.remove('socrata-icon-close-2');
    presentationMode.classList.add('socrata-icon-presentation');
    presentationButtons.previous.classList.add('hidden');
    presentationButtons.next.classList.add('hidden');

    blocks.forEach(function(block) {
      block.classList.remove('hidden');
    });

    setUserStoryHeight();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    $('.socrata-visualization').trigger('SOCRATA_VISUALIZATION_INVALIDATE_SIZE');
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
    return element.dataset.hasOwnProperty('presentable');
  }
}
