//= require ./vendor/tether.min
//= require ./vendor/shepherd.min

function TourFactory(element) {
  this.root = element;
  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-tour]'));
  this.tourOverlay = element.querySelector('.tour-overlay');
  this.initializeTour();
  this.addSteps();
  this.attachEvents();

  // Open tour immediately unless openers are specified
  if (this.openers.length === 0) {
    this.openTour();
  }
}

TourFactory.prototype = {
  initializeTour: function() {
    var that = this;

    this.tour = new Shepherd.Tour({
      defaults: {
        showCancelLink: true,
        buttons: [
          {
            text: that.tourOverlay.getAttribute('data-tour-skip'),
            classes: 'btn-default',
            action: function() {
              that.tour.cancel();
            }
          },
          {
            text: that.tourOverlay.getAttribute('data-tour-next'),
            classes: 'btn-primary',
            action: function() {
              that.clickNext();
            }
          }
        ]
      }
    });
  },
  addSteps: function() {
    var that = this;

    var steps = Array.prototype.slice.apply(document.querySelectorAll('[data-tour-step]'));
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
        title: step.getAttribute('data-title'),
        text: step.innerHTML,
      };

      var classes = step.getAttribute('data-classes');

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
            text: that.tourOverlay.getAttribute('data-tour-done'),
            classes: 'btn-primary',
            action: that.tour.complete
          }
        ];
      }

      that.tour.addStep(stepConfig);
    });
  },
  attachEvents: function() {
    var that = this;

    that.openers.forEach(function (opener) {
      opener.addEventListener('click', that.openTour.bind(that));
    }, that);

    document.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        that.tour.cancel();
      }
    });

    that.tourOverlay.addEventListener('click', function() {
      that.tour.cancel();
    });

    that.tour.on('active', function() {
      that.tourOverlay.classList.remove('overlay-hidden');
    });

    that.tour.on('inactive', function() {
      that.tourOverlay.classList.add('overlay-hidden');
    });
  },
  openTour: function() {
    this.tour.start();
    this.tourOverlay.classList.remove('tour-overlay-hidden');
  },
  clickNext: function() {
    document.dispatchEvent(new CustomEvent('next', { 'detail': this.tour.getCurrentStep() }));
    this.tour.next();
  }
};
