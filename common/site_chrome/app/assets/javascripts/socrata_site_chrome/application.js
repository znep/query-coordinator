// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require_tree .
//= require socrata-notifications/socrata-notifications.js
//= require autocomplete/build/socrata-autocomplete.js

/**
  NOTE! this file is only included for the default site chrome case. There is also a *custom* site chrome
  option for a very limited number of customers.

  If you add new files to the tree, or require new node_modules, you ALSO need to manually add those items
  to the custom site chrome case, if applicable.
  Do this in the `site_chrome_javascript_tag` method in lib/site_chrome_consumer_helpers.rb
*/
