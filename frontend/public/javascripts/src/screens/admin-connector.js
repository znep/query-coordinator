import $ from 'jquery';

$(document).ready(() => {
  $('.flyout-target').hover((e) => {
    $(e.target).closest('.flyout-container').find('.flyout').removeClass('flyout-hidden');
  }, (e) => {
    $(e.target).closest('.flyout-container').find('.flyout').addClass('flyout-hidden');
  });
});
