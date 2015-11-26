(function(root) {
  'use strict';

  var DOMAIN = 'https://dataspace.demo.socrata.com/metadata/v1/';
  var DATASET_UID = location.pathname.split('/')[2];

  var _cards;
  var _datasetId;
  var _pageName;
  var _pageId;
  var _cardView;

  var _$cardContainder;

  function getPageData() {
    return $.get(DOMAIN + '/page/' + DATASET_UID);
  }

  function getPageDataset() {
    return $.get(DOMAIN + '/dataset/' + DATASET_UID);
  }

  function setupPage() { 
    // Card container template
    _$cardContainder = $(
      [
        '<div class="component-container">',
          '<article class="intro-text">',
            '<h5>Column Chart</h5>',
            '<p class="intro padding hidden">',
              '<span class="desc"></span>',
              '<span class="text-link">more</span>',
            '</p>',
            '<div class="all hidden">',
              '<p class="padding">',
                '<span class="desc">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perferendis magni dolor veritatis saepe quis cum assumenda. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perferendis magni dolor veritatis saepe quis cum assumenda. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perferendis magni dolor veritatis saepe quis cum</span>',
                '<span class="text-link">less</span>',
              '</p>',
            '</div>',
          '</article>',
          '<div id="column-chart"></div>',
        '</div>'
      ].join('')
    );

    // Get page data
    getPageData().success(function(data) {
      _cards = data.cards;
      _datasetId = data.datasetId;
      _pageName = data.name;

      // Set page title
      document.title = _pageName;

      // Get dataset
      getPageDataset(_datasetId).done(function(){
        renderCards(_cards);  
      });
    });
  }

  setupPage();

  

  function renderCards(cards) {
    var newDate;

    $(cards).each(function(i, card) {
      switch (card.cardType) {
        case 'timeline':
          break;
        case 'feature':
          break;
        case 'column':
          // window.columnChart();

          break;
        default:
          break
      };
    });
  }

 
})(window);



$(function () {
  'use strict';

  var $article = $('article');
  var $intro = $('.intro');
  var $all = $('.all');
  var description = $('.all').find('.desc').html();
  var introText = description.substring(0, 85);

  $intro.find('.desc').html(introText);
  $intro.removeClass('hidden');

  $intro.find('.text-link').on('click', function() {
    // show all desc
    $(this).parents('.intro-text').find('.all').removeClass('hidden');
    $(this).parent('.intro').addClass('hidden');
  });

  $all.find('.text-link').on('click', function() {
    // show intro desc
    $(this).parents('.intro-text').find('.intro').removeClass('hidden');
    $(this).parents('.all').addClass('hidden');
  });

  var $window = $(window);
  var $navbar = $('.navbar');
  var lastScrollTop = 0;
  var wasScrollingDown = false;

  $window.scroll(function() {
    var stp = $window.scrollTop();

    if (stp > lastScrollTop) {
      if (!wasScrollingDown) {
        $navbar.
          removeClass('navbar-visible').
          addClass('navbar-hidden');
        $('#navbar').
          removeClass('in').
          attr('aria-expanded','false');

        wasScrollingDown = true;
      }
    } else {
      if (wasScrollingDown) {
        $navbar.
          removeClass('navbar-hidden').
          addClass('navbar-visible');

        wasScrollingDown = false;
      }
    }
    lastScrollTop = stp;
  });
});
