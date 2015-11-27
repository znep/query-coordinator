(function(root) {
  'use strict';

  //var DOMAIN = window.location.hostname;
  var DOMAIN = 'dataspace.demo.socrata.com';
  //var DATASET_UID = window.location.pathname.match(/\w{4}\-\w{4}/)[0];
  var DATASET_UID = 'rewx-rnbf';

  function getPageData() {
    return $.get(window.location.protocol + '//' + DOMAIN + '/metadata/v1/page/' + DATASET_UID);
  }

  function setupPage() { 
    getPageData().success(function(data) {
      document.title = data.name;
      renderCards(data.cards);
    });
  }

  function getTemplate(containerID) {
    return $(
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
        '<div id="' + containerID + '"></div>',
        '</div>'
      ].join('')
    );
  }

  function renderCards(cards) {
    $.each(cards, function(i, card) {
      switch (card.cardType) {
        case 'timeline':
          var $cardContainer = getTemplate('timeline-chart').appendTo('#mobile-components');
          var values = {
            domain: DOMAIN,
            uid: DATASET_UID,
            columnName: card.fieldName
          };

          socrata.visualizations.MobileTimelineChart(values, $cardContainer.find('#timeline-chart'));
          break;
        case 'feature':
          var $cardContainer = getTemplate('feature-map').appendTo('#mobile-components');
          var values = {
            domain: DOMAIN,
            uid: DATASET_UID,
            columnName: card.fieldName
          };

          socrata.visualizations.TestMobileFeatureMap(values, $cardContainer.find('#feature-map'));
          break;
        case 'column':
          var $cardContainer = getTemplate('column-chart').appendTo('#mobile-components');
          var values = {
            domain: DOMAIN,
            uid: DATASET_UID,
            columnName: card.fieldName
          };

          socrata.visualizations.MobileColumnChart(values, $cardContainer.find('#column-chart'));
          break;
        default:
          break
      }
    });
  }

  $(setupPage);
})(window);
