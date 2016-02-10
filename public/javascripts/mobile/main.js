(function() {
  'use strict';

  //var DOMAIN = window.location.hostname;
  var DOMAIN = 'dataspace.demo.socrata.com'; // For local development
  //var PAGE_UID = window.location.pathname.match(/\w{4}\-\w{4}/)[0];
  var PAGE_UID = 'rewx-rnbf';
  var DATASET_UID;
  var cardsData;
  var cardsMetaData;

  function getPageData() {
    return $.get(window.location.protocol + '//' + DOMAIN + '/views/' + PAGE_UID);
  }

  function setupPage() {
    getPageData().success(function(data) {
      document.title = data.name;
      DATASET_UID = data.displayFormat.data_lens_page_metadata.datasetId;
      cardsData = data.displayFormat.data_lens_page_metadata.cards;
      cardsMetaData = data.columns;

      var aFilterOps = [];
      for (var key in cardsMetaData) {
        var filterOption = {};
        switch (cardsMetaData[key].dataTypeName) {
          case 'text':
            filterOption = {
              filterName: cardsMetaData[key].name,
              name: cardsMetaData[key].fieldName,
              id: cardsMetaData[key].position,
              type: 'string'
            };
            aFilterOps.push(filterOption);
            break;
          case 'number':
            filterOption = {
              filterName: cardsMetaData[key].name,
              name: cardsMetaData[key].fieldName,
              id: cardsMetaData[key].position,
              type: 'int'
            };
            aFilterOps.push(filterOption);
            break;
          default:
            break;
        }
      }

      var filterOptions = {
        filterOps: aFilterOps
      };
      $(document).trigger('socrata/qfb/filterOps',[filterOptions, DOMAIN, DATASET_UID]);

      renderCards(cardsData, cardsMetaData);
    });
  }

  function getTemplate(options) {
    return $(
      [
        '<div class="component-container ' + options.containerClass + '">',
        '<article class="intro-text">',
        '<h5>' + options.metaData.name + '</h5>',
        '<p class="intro padding hidden">',
        '<span class="desc"></span>',
        '<span class="text-link">more</span>',
        '</p>',
        '<div class="all hidden">',
        '<p class="padding">',
        '<span class="desc">' + options.metaData.description + '</span>',
        '<span class="text-link">less</span>',
        '</p>',
        '</div>',
        '</article>',
        '<div id="' + options.id + '"></div>',
        '</div>'
      ].join('')
    );
  }

  function renderCards(cards) {
    var $cardContainer;
    var values;

    $.each(cards, function(i, card) {
      var cardOptions = {
        id: '',
        metaData: _.find(cardsMetaData, { fieldName: card.fieldName }),
        containerClass: ''
      };

      switch (card.cardType) {
        case 'timeline':
          cardOptions.id = 'timeline-chart';
          cardOptions.containerClass = 'timeline-chart-container';
          $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
          values = {
            domain: DOMAIN,
            uid: DATASET_UID,
            columnName: card.fieldName
          };

          socrata.visualizations.mobileTimelineChart(values, $cardContainer.find('#timeline-chart'));
          break;
        // case 'feature':
        //   cardOptions.id = 'feature-map';
        //   cardOptions.containerClass = 'map-container';
        //   $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
        //   values = {
        //     domain: DOMAIN,
        //     uid: DATASET_UID,
        //     columnName: card.fieldName
        //   };

        //   socrata.visualizations.mobileFeatureMap(values, $cardContainer.find('#feature-map'));
        //   break;
        // case 'choropleth':
        //   cardOptions.id = 'choropleth';
        //   $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
        //   values = {
        //     domain: DOMAIN,
        //     uid: DATASET_UID,
        //     columnName: card.fieldName
        //   };

        //   socrata.visualizations.mobileChoroplethMap(values, $cardContainer.find('#choropleth'));
        //   break;
        // case 'column':
        //   cardOptions.id = 'column-chart';
        //   $cardContainer = getTemplate(cardOptions).appendTo('#mobile-components');
        //   values = {
        //     domain: DOMAIN,
        //     uid: DATASET_UID,
        //     columnName: card.fieldName
        //   };

        //   socrata.visualizations.mobileColumnChart(values, $cardContainer.find('#column-chart'));
        //   break;
        default:
          break;
      }
    });
    socrata.mobileCardViewer();
  }

  $(setupPage);
})(window);

socrata.mobileCardViewer = function() {
  'use strict';

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
};
