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

$.commaify = function(value)
{
  value = value + '';
  var pos = value.indexOf('.');
  if (pos == -1) { pos = value.length; }
  pos -= 3;
  while (pos > 0 && value.charAt(pos - 1) >= "0" && value.charAt(pos - 1) <= "9")
  {
    value = value.substring(0, pos) + "," + value.substring(pos);
    pos -= 3;
  }
  return value;
};

String.prototype.format = function()
{
  var txt = this,

    i = arguments.length;
  while (i--) {
    txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }
  return txt;
};
