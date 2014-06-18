$.fn.dimensions = function() {
  return {width: this.width(), height: this.height() };
};

// Yields an RX observable sequence of this selection's dimensions.
$.fn.observeDimensions = function() {
  var self = this;
  var dimensionsSubject = new Rx.BehaviorSubject(self.dimensions());
  self.resize(function() {
    dimensionsSubject.onNext(self.dimensions());
  });

  return dimensionsSubject;
};
