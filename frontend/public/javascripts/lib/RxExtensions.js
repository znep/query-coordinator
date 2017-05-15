const Rx = require('rx');

(function() {
  'use strict';

  // The combination of combineLatest and subscribe. Allows terse
  // expression of side-effects that require notification if any
  // observables change.
  // This is akin to combineLatest with guaranteed side effects.
  // The subscription function (always the last argument) gets
  // called with 'this' set to the array of observables.
  Rx.Observable.subscribeLatest = function() {
    var args = _.toArray(arguments);
    var resultSubscription = args.pop();

    if (_.isArray(args[0])) {
      args = args[0];
    }

    return Rx.Observable.combineLatest(args, function() {
      return arguments;
    }).subscribe(function(vals) {
      resultSubscription.apply(args, vals);
    });
  };

  Rx.Observable.prototype.subscribeLatest = function() {
    return Rx.Observable.subscribeLatest.apply(this, [this].concat(_.toArray(arguments)));
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

  // Catch the error terminating this sequence and presents
  // the error itself as a new single-element sequence.
  Rx.Observable.prototype.errors = function() {
    return this.filter(_.constant(false)).catchException(function(error) {
      return Rx.Observable.returnValue(error);
    });
  };

  // Catches all errors in the sequence and ignores them.
  Rx.Observable.prototype.ignoreErrors = function() {
    return this.catchException(Rx.Observable.never());
  };

  // Subscribes and prints out the activity of the sequence
  // to the console for debugging purposes. Can pass in an optional name
  // for this sequence to help clarify the output.
  Rx.Observable.prototype.dump = function(optionalName) {
    var name = optionalName ?
      (optionalName + ' ') :
      '';

    return this.subscribe(
      function(value) {
        console.log(name + 'onNext: ', value);
      },
      function(error) {
        console.log(name + 'onError: ', error);
      },
      function() {
        console.log(name + 'completed');
      }
    );
  };

  // Prints out the activity of the sequence to the console.
  // For debugging purposes. Can pass in an optional name
  // for this sequence to help clarify the output.
  // Note, does not subscribe (uses doAction);
  Rx.Observable.prototype.doDump = function(optionalName) {
    var name = optionalName ?
      (optionalName + ' ') :
      '';

    return this.doAction(
      function(value) {
        console.log(name + 'onNext: ', value);
      },
      function(error) {
        console.log(name + 'onError: ', error);
      },
      function() {
        console.log(name + 'completed');
      }
    );
  };

  // Ensure the first element in the sequence takes at least windowMsec
  // to show up.
  Rx.Observable.prototype.imposeMinimumDelay = function(windowMsec, scheduler) {
    var self = this;
      // Subscription is shared, so only one timer will be made.
    var timeout = Rx.Observable.timer(windowMsec, scheduler).share();

    return Rx.Observable.mergeAllAndGiveSource(timeout, self). // Surface the sequence which reacts first.
      take(1).
      map(function(reaction) {
        // Depending on which sequence reacted first, figure out when to tell the user success happened.
        if (reaction.cause === timeout) {
          // Timeout happened, which means the minimum delay was reached. Just use the real success.
          return self;
        } else {
          // Success happened too fast. Return success when the timeout completes.
          return timeout.map(_.constant(reaction.value));
        }
      }).
      switchLatest(); // Use the sequence from the map above.
  };

  // Returns an observable sequence that contains only the false to true
  // transitions of the source observable sequence.
  // Example:
  // var seq = new Rx.Observable.subject();
  // seq.risingEdge().subscribe(function(value) { console.log(value); })
  // seq.onNext(true);  // Prints 'true'
  // seq.onNext(true);  // Nothing printed
  // seq.onNext(false); // Nothing printed
  // seq.onNext(true);  // Prints 'true'
  Rx.Observable.prototype.risingEdge = function() {
    return this.distinctUntilChanged().filter(_.identity);
  };


  // Returns an observable sequence that contains only the true to false
  // transitions of the source observable sequence.
  // Example:
  // var seq = new Rx.Observable.subject();
  // seq.fallingEdge().subscribe(function(value) { console.log(value); })
  // seq.onNext(false); // Prints 'false'
  // seq.onNext(true);  // Nothing printed
  // seq.onNext(false); // Prints 'false'
  // seq.onNext(false); // Nothing printed
  // seq.onNext(true);  // Nothing printed
  Rx.Observable.prototype.fallingEdge = function() {
    return this.distinctUntilChanged().filter(_.negateValue);
  };

  Rx.Observable.prototype.incrementalFallbackRetry = function(tries, onRetryStart) {
    return this.retryWhen(function(errors) {
      if (_.isFunction(onRetryStart)) {
        errors.take(1).subscribe(onRetryStart);
      }
      return Rx.Observable.range(1, tries).
        zip(errors, function(i) { return i; }).
        flatMap(function(i) { return Rx.Observable.timer(i * 5000, Rx.Scheduler.timeout); });
    });
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
    return Rx.Observable.mergeAllAndGiveSource.apply(Rx.Observable, arguments).
      take(1). // Note that first() throws an error if the sequence closes without emitting anything.
      pluck('cause');
  };

  // Similar to Rx.Observable.merge, but also gives you the sequence
  // that caused the message.
  // Example:
  // var seqA = new Rx.Subject();
  // var seqB = new Rx.Subject();
  //
  // Rx.Observable.mergeAllAndGiveSource(seqA, seqB).dump();
  //
  // seqA.onNext();
  // seqB.onNext();
  //
  // Output:
  // onNext: { cause: seqA, value: 'A first' }
  // onNext: { cause: seqB, value: 'B first' }
  // complete
  Rx.Observable.mergeAllAndGiveSource = function() {
    var mappedToSelf = _.map(arguments, function(sequence) {
      return sequence.map(function(value) {
        return {
          cause: sequence,
          value: value
        };
      });
    });

    return Rx.Observable.merge.apply(Rx.Observable, mappedToSelf).share();
  };
})();
