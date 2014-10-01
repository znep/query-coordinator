//TODO button this up somewhere else...

// Projects each element of an observable sequence into a new sequence of observable sequences by retrieving the value of the
// specified property, and then transforms that observable sequence of observable sequences into an observable sequence producing
// values only from the most recent observable sequence.
Rx.Observable.prototype.pluckSwitch = function(prop) {
  return this.pluck(prop).switchLatest();
};

// The combination of combineLatest and subscribe. Allows terse
// expression of side-effects that require notification if any
// observables change.
// This is akin to combineLatest with guaranteed side effects.
// The subscription function (always the last argument) gets
// called with 'this' set to the array of observables.
Rx.Observable.subscribeLatest = function() {
    var args = _.toArray(arguments);
    var resultSubscription = args.pop();

    return Rx.Observable.combineLatest(args, function() {
      return arguments;
    }).subscribe(function(vals) {
      resultSubscription.apply(args, vals);
    });
};

// Maps this observable sequence of objects to a new sequence of observable sequences by invoking
// observe() on each object, then switches to that sequence.
Rx.Observable.prototype.observeOnLatest = function(prop) {
  return this.map(function(model) {
    if (model) {
      if (!model.observe) {
        throw new Error('Tried to observeOnLatest on a non-model.');
      }
      return model.observe(prop);
    } else {
      return Rx.Observable.never();
    }
  }).switchLatest();
};

// Returns a single-element sequence containing the first sequence to produce an element.
// Similar to Rx.Observable.amb, but it creates a sequence of sequences instead of a sequence
// of values.
// Example:
// var seqA = new Rx.Subject();
// var seqB = new Rx.Subject();
//
// var first = Rx.Observable.firstToReact(seqA, seqB);
// first.subscribe(function(seq) {
//   console.log(seq === seqA ? 'A first' : 'B first');
// }, undefined, function() {
//   console.log('complete');
// });
//
// seqA.onNext();
// seqB.onNext();
//
// Output:
// A first
// complete
Rx.Observable.firstToReact = function() {
  var mappedToSelf = _.map(arguments, function(sequence) {
    return sequence.map(_.constant(sequence));
  });

  return Rx.Observable.merge.apply(Rx.Observable, mappedToSelf).first().share();
};
