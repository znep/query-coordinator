var Shepherd = require('tether-shepherd');

// CustomEvent polyfill for IE10/11 (from frontend-utils)
var CustomEvent = function(eventName, params) {
  var eventParams = { bubbles: false, cancelable: false, detail: undefined };

  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      eventParams[key] = params[key];
    }
  }

  var customEvent = document.createEvent('CustomEvent');

  customEvent.initCustomEvent(
    eventName,
    eventParams.bubbles,
    eventParams.cancelable,
    eventParams.detail
  );

  return customEvent;
};

var TourFactory = module.exports = function(element) {
  this.root = element;
  this.tourElements = Array.prototype.slice.apply(element.querySelectorAll('[data-tour]'));

  if (this.tourElements.length > 0) {
    this.tours = {};
    this.currentTourName = null;

    this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-tour-opener]'));

    var tourOverlayElement = document.createElement('div');
    tourOverlayElement.classList.add('tour-overlay', 'overlay-hidden');
    this.tourOverlay = element.body.appendChild(tourOverlayElement);

    this.initialize();

    // Open all tours without openers immediately
    if (this.openers.length < this.tourElements.length) {
      var that = this;
      var openerNames = that.openers.map(function(opener) { return opener.getAttribute('data-tour-opener'); });

      that.tourElements.forEach(function(tourElement) {
        var tourName = tourElement.getAttribute('data-tour-name');
        if (!openerNames.includes(tourName)) {
          that.openTour(tourName);
        }
      });
    }
  }
}

TourFactory.prototype = {
  initialize: function() {
    var that = this;

    that.tourElements.forEach(function(tourElement) {
      that.initializeTour(tourElement);
    });

    that.attachEvents();
  },
  initializeTour: function(tourElement) {
    var that = this;
    var tourName = tourElement.getAttribute('data-tour-name');

    var tour = new Shepherd.Tour({
      defaults: {
        showCancelLink: true,
        buttons: [
          {
            text: tourElement.getAttribute('data-tour-skip'),
            classes: 'btn-default',
            action: function() {
              that.closeTour(tourName);
            }
          },
          {
            text: tourElement.getAttribute('data-tour-next'),
            classes: 'btn-primary',
            action: function() {
              that.clickNext(tourName);
            }
          }
        ]
      }
    });

    that.tours[tourName] = {
      tour: tour,
      name: tourName
    };
    that.addSteps(tour, tourElement);
  },
  addSteps: function(tour, tourElement) {
    var that = this;

    var steps = Array.prototype.slice.apply(tourElement.querySelectorAll('[data-tour-step]'));
    var sortedSteps = steps.sort(function(a, b) {
      var stepA = parseInt(a.getAttribute('data-step-number'));
      var stepB = parseInt(b.getAttribute('data-step-number'));

      if (stepA > stepB) {
        return 1;
      } else if (stepA < stepB) {
        return -1;
      } else {
        return 0;
      }
    });

    sortedSteps.forEach(function(step, index) {
      var stepConfig = {
        title: step.getAttribute('data-title') || '',
        text: step.innerHTML
      };

      var classes = step.getAttribute('data-classes') || '';

      var attachToElement = step.getAttribute('data-attach-to-element');
      var attachToPosition = step.getAttribute('data-attach-to-position');
      var positionOffset = {
        left: '0 25px',
        right: '0 -25px',
        top: '25px 0',
        bottom: '-25px 0'
      }[attachToPosition];

      if (classes) {
        stepConfig.classes = classes.split(' ');
      }

      if (attachToElement && attachToPosition && positionOffset) {
        stepConfig.attachTo = {
          element: attachToElement,
          on: attachToPosition
        };

        stepConfig.tetherOptions = {
          offset: positionOffset
        }
      }

      if (sortedSteps.length - 1 === index) {
        stepConfig.buttons = [
          {
            text: tourElement.getAttribute('data-tour-done'),
            classes: 'btn-primary',
            action: tour.complete
          }
        ];
      }

      tour.addStep(stepConfig);

      tour.on('active', function() {
        that.tourOverlay.classList.remove('overlay-hidden');
      });

      tour.on('inactive', function() {
        that.tourOverlay.classList.add('overlay-hidden');
      });
    });
  },
  attachEvents: function() {
    var that = this;

    that.openers.forEach(function (opener) {
      opener.addEventListener('click', that.openTour.bind(that, opener.getAttribute('data-tour-opener')));
    }, that);

    document.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      if (that.currentTourName === null) {
        return;
      }

      // ESC
      if (key === 27) {
        that.closeTour(that.currentTourName);
      }
    });

    that.tourOverlay.addEventListener('click', function() {
      that.closeTour(that.currentTourName);
    });
  },
  openTour: function(tourName) {
    var tourObject = this.tours[tourName];

    this.currentTourName = tourObject.name;

    tourObject.tour.start();
    this.tourOverlay.classList.remove('tour-overlay-hidden');
  },
  clickNext: function(tourName) {
    var tourObject = this.tours[tourName];
    var payload = {
      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
      tourName: tourObject.name
    };

    document.dispatchEvent(new CustomEvent('next', { 'detail': payload }));
    tourObject.tour.next();
  },
  closeTour: function(tourName) {
    var tourObject = this.tours[tourName];
    var payload = {
      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
      tourName: tourObject.name
    };

    document.dispatchEvent(new CustomEvent('cancel', { 'detail': payload }));
    tourObject.tour.cancel();
  }
};
