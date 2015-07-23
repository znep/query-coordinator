(function(){
  'use strict';

  // Included from the frontend repo. Ex:
  // "Hello {0}".format('myName')
  // => "Hello myName"
  String.prototype.format = function() {
    var txt = this,
    i = arguments.length;
    while (i--) {
      txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return txt;
  };
})();
