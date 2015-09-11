$(document).on('ready', function() {
  'use strict';

  var $userStory = $('.user-story');
  var storyteller = window.socrata.storyteller;
  storyteller.flyoutRenderer = new storyteller.FlyoutRenderer();

  // Init window size classes
  storyteller.windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
  storyteller.windowSizeBreakpointStore.addChangeListener(_applyWindowSizeClass);
  function _applyWindowSizeClass() {
    var windowSizeClass = storyteller.windowSizeBreakpointStore.getWindowSizeClass();
    var unusedWindowSizeClasses = storyteller.windowSizeBreakpointStore.getUnusedWindowSizeClasses();

    $userStory.
      removeClass(unusedWindowSizeClasses.join(' ')).
      addClass(windowSizeClass);
  }

  // Init visualizations
  $('[data-component-data]').each(function() {
    var $this = $(this);

    $this.componentSocrataVisualizationColumnChart(
      JSON.parse($this.attr('data-component-data'))
    );
  });

  //
  // Don't breathe this.
  //

  var pageable;
  var blacklist = ['spacer', 'horizontal-rule'];
  var presenting = false;
  var presentationNavigation = document.querySelector('.presentation-navigation');
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.block'), 0);
  var index = 0;

  blocks.forEach(function(block) {
    if (notBlacklisted(block)) {
      block.setAttribute('data-page-index', index++);
    }
  });

  pageable = Array.prototype.slice.call(document.querySelectorAll('.block[data-page-index]'), 0);

  document.documentElement.addEventListener('keyup', pageOrClose);
  document.querySelector('.presentation-next').addEventListener('click', pageNext);
  document.querySelector('.presentation-previous').addEventListener('click', pagePrevious);
  document.querySelector('.presentation-mode').addEventListener('click', enablePresentationMode);
  document.querySelector('.linear-mode').addEventListener('click', enableLinearMode);

  function enablePresentationMode(event) {
    presenting = true;

    event.target.setAttribute('disabled', 'disabled');
    document.querySelector('.linear-mode').removeAttribute('disabled');

    blocks.forEach(function(block) {
      block.classList.toggle('hidden', block !== pageable[0]);
    });

    presentationNavigation.classList.remove('hidden');
  }

  function enableLinearMode(event) {
    presenting = false;

    event.target.setAttribute('disabled', 'disabled');
    document.querySelector('.presentation-mode').removeAttribute('disabled');

    blocks.forEach(function(block) {
      block.classList.remove('hidden');
    });

    presentationNavigation.classList.add('hidden');
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

    if (presenting) {
      switch (key) {
        case 27:
          document.querySelector('.linear-mode').click();
          break;
        case 37:
          pagePrevious();
          break;
        case 39:
          pageNext();
          break;
      }
    }
  }

  function notBlacklisted(element) {
    element = element.querySelector('.component-container > .component');
    var classes = Array.prototype.slice.call(element.classList, 0);
    return classes.every(function(value) {
      return blacklist.indexOf(value.replace('component-', '')) === -1;
    });
  }
});
