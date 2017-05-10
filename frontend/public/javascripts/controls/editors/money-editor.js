(function($) {
  $.blistEditor.addEditor('money', {
    currentValue: function() {
      var newVal = this.textValue();
      var adjVal = newVal && newVal.charAt(0) == '$' ?
        newVal.slice(1) : newVal;
      adjVal = blist.util.parseHumaneNumber(adjVal);
      return adjVal == parseFloat(adjVal) ? parseFloat(adjVal) : newVal;
    }
  }, 'number');

})(jQuery);
