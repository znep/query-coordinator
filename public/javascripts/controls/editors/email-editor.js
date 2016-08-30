(function($) {
  $.blistEditor.addEditor('email', {
    isValid: function() {
      var curVal = this.currentValue();
      // Derived from code at:
      // http://www.stimuli.com.br/, Arthur Debert
      // permissive, will allow quite a few non matching email addresses
      return curVal === null || curVal.match(blist.util.patterns.core.emailValidator);
    }
  }, 'text');

})(jQuery);
