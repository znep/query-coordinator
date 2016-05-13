/* global socrataConfig */
(function() {
  // Header

  var $navbar = $('.navbar');
  var $logo = $('.navbar-brand img');
  var $navigation = $('.navbar ul.nav');

  var theme = socrataConfig.themeV3 || {};
  var routes = {
    user: [{
      title: 'Sign Out',
      url: '/logout'
    }],
    visitor: [{
      title: 'Sign In',
      url: '/login?referer_redirect=1'
    }, {
      title: 'Sign Up',
      url: '/signup?referer_redirect=1'
    }]
  };

  $navbar.css('background-color', theme.header_background_color || 'white');
  $logo.attr('src', theme.logo_url);

  (currentUser ? routes.user : routes.visitor).forEach(function(route) {
    $navigation.append(
      '<li><a href="' + route.url + '">' + route.title + '</a></li>'
    );
  });
})();
