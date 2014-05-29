//TODO button this up somewhere else...

// Projects each element of an observable sequence into a new sequence of observable sequences by retrieving the value of the
// specified property, and then transforms that observable sequence of observable sequences into an observable sequence producing
// values only from the most recent observable sequence.
Rx.Observable.prototype.pluckSwitch = function(prop) {
  return this.pluck(prop).switchLatest();
};
