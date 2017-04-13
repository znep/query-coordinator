import $ from 'jquery';

export var $transient = $('<div>');

beforeEach(function() {
  $(document.body).append($transient);
});

afterEach(function() {
  $transient.
    empty().
    replaceWith($('<div>')).
    remove();
});