(function () {
  'use strict';

  // Included from the frontend repo. Ex:
  // "Hello {0}".format('myName')
  // => "Hello myName"
  String.prototype.format = function () {
    var txt = this;
    var i;

    for (i = 0; i < arguments.length; i++) {
      txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }

    return txt;
  };

  /**
   * Temporary polyfills until we can come up with a better implementation.
   */

  String.prototype.visualSize = function(fontSize) {

    var $ruler = $('#ruler');
    var dimensions;

    if ($ruler.length < 1) {
      $('body').append('<span class="ruler" id="ruler"></span>');
      $ruler = $('#ruler');
    }
    if (!fontSize) {
      fontSize = '';
    }
    $ruler.css('font-size', fontSize);
    $ruler.text(this + '');
    dimensions = {width: $ruler.width(), height: $ruler.height()};
    $ruler.remove();

    return dimensions;
  };

  String.prototype.visualLength = function(fontSize) {
    return this.visualSize(fontSize).width;
  };
})();
