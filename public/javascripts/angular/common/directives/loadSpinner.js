module.exports = function SpinnerDirective() {
  return {
    restrict: 'E',
    scope: {
      busy: '='
    },
    template: [
      '<div class="spinner" ng-class="{ busy: busy }">',
      '<svg width="25px" height="25px" viewBox="0 0 40 40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
      '<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">',
      '<circle id="outer" fill="#F1F1F1" cx="20" cy="20" r="20"></circle>',
      '<path d="M20,4 C28.836556,4 36,11.163444 36,20 C36,28.836556 28.836556,36 20,36 L20,30 C25.5228475,30 30,25.5228475 30,20 C30,14.4771525 25.5228475,10 20,10 L20,4 Z" id="inner" fill="#808080"></path>',
      '</g>',
      '</svg>',
      '</div>'
    ].join(''),
    link: function(/*scope, element, attrs*/) {
    }
  };
};