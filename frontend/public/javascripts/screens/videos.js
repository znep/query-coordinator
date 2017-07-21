$(function() {
  blist.namespace.fetch('blist.videos');

  // util function
  var showVideo = function($item, destination) {

    // do we even have anything?
    if ($item.length === 0) {
      return;
    }

    // process the templates
    var embedCode = $('#embedTemplate').text().
    replace(/%embedid%/g, $item.attr('data-embedid'));

    if (destination === 'topLevel') {
      $('.topLevelVideoContainer').html(embedCode);
    } else {
      // apply the code and pop the window
      $('.videoPopupModal').
        find('.videoContainer').
        html(embedCode).
        end().
        jqmShow();

      // focus the modal
      $('.videoPopupModal').
        focus();
    }
  };

  // set basics ordering #
  $('.videoList li').each(function(i) {
    $(this).data('basicsOrdering', i);
  });

  // save off a copy of the original list
  var $videoListClone = $('.videoList').clone();

  // sort and filter data
  var processData = function(filterCriteria, sortCriteria) {
    var $data = $videoListClone.find('li');

    // filter
    if (filterCriteria !== 'all') {
      $data = $data.filter('[data-type=' + filterCriteria + ']');
    }

    // sort
    var sortValueFunction;
    if (sortCriteria === 'basics') {
      sortValueFunction = function($item) {
        return $item.data('basicsOrdering');
      };
    } else if (sortCriteria === 'alphabetical') {
      sortValueFunction = function($item) {
        return $item.find('h2').text();
      };
    } else if (sortCriteria === 'date') {
      sortValueFunction = function($item) {
        return new Date($item.attr('data-added'));
      };
    }

    return _.sortBy($data.get(), function(a) {
      return sortValueFunction($(a));
    });
  };

  // wire up sorts and filters
  $.live('.filterBox ul a', 'click', function(event) {
    event.preventDefault();

    var $this = $(this);
    if ($this.hasClass('selected')) {
      return;
    }

    // mark as selected
    $this.closest('ul').find('a').removeClass('selected');
    $this.addClass('selected');

    // process data
    var processedData = processData($('.filterCriteria').find('a.selected').attr('data-filter'),
      $('.sortCriteria').find('a.selected').attr('data-sort'));

    // magic
    $('.videoList').quicksand($(processedData), {
      adjustHeight: 'dynamic',
      attribute: 'data-id',
      duration: 600,
      easing: 'easeInOutQuad',
      useScaling: false // I think the fade is cooler anyway.
    });

    if (processedData.length === 0) {
      $('.noResultsText').fadeIn();
    } else {
      $('.noResultsText').fadeOut();
    }
  });

  $.live('.videoList a', 'click', function() {
    // do NOT prevent default!
    showVideo($(this).closest('li'));
  });

  $('.videoPopupModal .close').click(function() {
    // do NOT prevent default!
    var $modal = $('.videoPopupModal');
    $modal.jqmHide();

    setTimeout(function() {
      $modal.find('.videoContainer').empty();
    }, 1000);
  });


  // detect if we have a hash at the end of the url; if
  // so locate and load that video straight away
  var hash = window.location.hash || '';
  hash = hash.replace('#', '').replace(/[^a-z\-]/g, '');
  if (!$.isBlank(hash)) {
    var $videoItem = $('.videoList li[data-id=' + hash + ']');

    if ($videoItem.length > 0) {
      showVideo($videoItem, (blist.videos.popupMode === true) ? 'topLevel' : 'lightbox');

      // detect if we're in a popup; if so, only show top 3 related videos
      if (blist.videos.popupMode === true) {
        var data = $(processData($videoItem.attr('data-type'), $videoItem.attr('data-audience'), 'basics'));
        var newItem = $(data).filter('[data-id=' + hash + ']').get(0);

        // we've sorted and filtered and got the actual video, now get the excerpt
        var excerptStart = _.indexOf(data, newItem) - 1;
        if ((data.length - excerptStart) <= 4) {
          // we're too close to the end! move back by appropriate amount
          excerptStart -= (4 - (data.length - excerptStart));
        }

        var dataExcerpt = data.splice(Math.max(excerptStart, 0), 4);
        dataExcerpt = _.without(dataExcerpt, newItem);

        $('.videoList').
        empty().
        append($(dataExcerpt));
      }
    }
  }
});
