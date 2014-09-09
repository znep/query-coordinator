(function() {
  // We're getting occasional missing (or maybe out-of-order) scripts in our BrowserStack runs.
  // This file was added temporarily to help debug this. In addition, a support ticket was dispatched
  // to BrowserStack for help.
  console.log('These are all the scripts we are loading from <SCRIPT> tags. See BrowserstackDebugHelper.js for the reason we are doing this.');
  var scripts = document.getElementsByTagName("SCRIPT");
  for (var i=0; i < scripts.length; i++) {
    console.log(scripts[i].getAttribute('src'));
  }
  console.log('End of script listing');

})();
