const angular = require('angular');
const Shepherd = require('tether-shepherd');

function AggregationTourController($scope, $window, I18n, MixpanelService, ServerConfig, WindowState, rx) {
  var hasCookie = socrata.utils.getCookie('aggregationTourClosed');
  var isFeatureFlagEnabled = ServerConfig.get('enableDataLensAggregationTour');
  var $tourOverlay = $('.tour-overlay');

  function featureTourPayload(step) {
    return {
      'Tour': 'Aggregation Tour',
      'Step in Tour': step || '1',
      'Total Steps in Tour': '5'
    };
  }

  if (isFeatureFlagEnabled && !hasCookie) {
    var currentStep;

    var tour = new Shepherd.Tour({
      defaults: {
        showCancelLink: true,
        buttons: [
          {
            text: 'Skip',
            classes: 'btn-default',
            action: function() {
              tour.cancel();
            }
          },
          {
            text: 'Next',
            classes: 'btn-primary',
            action: function() {
              // TODO: Verify Mixpanel is enabled before sending payload
              currentStep = tour.getCurrentStep().id.replace('step-', '');
              MixpanelService.sendPayload('Clicked Next in Tour', featureTourPayload(currentStep));

              tour.next();
            }
          }
        ]
      }
    });

    tour.addStep({
      title: I18n.tour.aggregation.step1.title,
      text: I18n.tour.aggregation.step1.text,
      attachTo: {
        element: '.aggregation-tour-attachment'
      },
      tetherOptions: {
        targetAttachment: 'top left',
        attachment: 'bottom right'
      }
    });

    tour.addStep({
      title: I18n.tour.aggregation.step2.title,
      text: [
        I18n.tour.aggregation.step2.text,
        '<div class="aggregation-tour-image step-2">'
      ],
      classes: [ 'wide' ]
    });

    tour.addStep({
      title: I18n.tour.aggregation.step3.title,
      text: [
        I18n.tour.aggregation.step3.text,
        '<div class="aggregation-tour-image step-3">'
      ],
      classes: [ 'wide' ]
    });

    tour.addStep({
      title: I18n.tour.aggregation.step4.title,
      text: [
        I18n.tour.aggregation.step4.text,
        '<div class="aggregation-tour-image step-4">'
      ],
      classes: [ 'wide' ]
    });

    tour.addStep({
      title: I18n.tour.aggregation.step5.title,
      text: [
        I18n.tour.aggregation.step5.textOne,
        '<div class="aggregation-tour-image step-5">',
        I18n.tour.aggregation.step5.textTwo
      ],
      classes: [ 'wide' ],
      buttons: [
        {
          text: 'Done',
          classes: 'btn-primary',
          action: tour.next
        }
      ]
    });

    tour.on('active', function() {
      $tourOverlay.show();
      currentStep = '1';
    });

    tour.on('inactive', function() {
      $window.document.cookie = 'aggregationTourClosed=1';
      $tourOverlay.hide();

      // TODO: Don't talk to Mixpanel if it's not enabled
      if (_.isDefined(currentStep)) {
        MixpanelService.sendPayload('Closed Tour', featureTourPayload(currentStep));
      }
    });

    var $destroy = $scope.$destroyAsObservable();

    $destroy.subscribe(function() {
      tour.cancel();
      tour.off('active inactive');
    });

    rx.Observable.merge(
      rx.Observable.fromEvent($tourOverlay, 'click'),
      WindowState.escapeKey$
    ).takeUntil($destroy).
      subscribe(_.bind(tour.cancel, tour));

    $scope.$observe('editMode').
      filter(_.identity).
      take(1).
      subscribe(_.partial(_.defer, _.bind(tour.start, tour)));

    $scope.$observe('editMode').
      filter(_.negate(_.identity)).
      subscribe(_.bind(tour.cancel, tour));
  }
}

angular.
  module('dataCards.controllers').
  controller('AggregationTourController', AggregationTourController);
