(function () {
  'use strict';

  // Create a new Auth0Lock with injected blist configration options
  // Options are injected from the login erb template.
  var widget = new Auth0Lock(blist.configuration.auth0.id, blist.configuration.auth0.uri);
  // Only use_auth0 configuration.
  // In this case, only use_auth0 is set internally, and no other options.
  if (document.getElementById('auth0login')) {
    widget.show({
      container: 'auth0login',
      callbackURL: blist.configuration.auth0.base_uri + '/auth/auth0/callback',
      focusInput: true,
      responseType: 'code',
      rememberLastLogin: false,
      icon: blist.configuration.auth0.base_uri + '/stylesheets/images/common/large_logo.png',
      authParams: {
        scope: 'openid profile'
      },
      resetLink: blist.configuration.auth0.base_uri + '/forgot_password',
      signupLink: blist.configuration.auth0.base_uri + '/signup'
    });
  }
  // Auth0 configuration with two or more buttons for selection.
  // Configuration is set to add enterprise login options.
  else {
    var auth0Login = function (connection) {
      return function (event) {
        // The socrata.com connection is rendered locally.
        if (connection === 'socrata.com') {
          document.querySelector('.authProvider.socrata').style.display = 'block';
          document.querySelector('.auth0login').style.display = 'none';
          return;
        }
        // Redirect to the connection's authorization path.
        else if (connection) {
          return widget.getClient().login({
            connection: connection,
            callbackURL: blist.configuration.auth0.base_uri + '/auth/auth0/callback',
            responseType: 'code',
            scope: 'openid profile'
          });
        }
      };
    };

    var links = document.querySelectorAll('.btn-login');
    var back = document.querySelector('.login-back');

    links = Array.prototype.slice.apply(links);
    links.forEach(function (link) {
      link.onclick = auth0Login(link.dataset.connection);
    });

    if (back) {
      back.onclick = function (event) {
        event.preventDefault();
        document.querySelector('.authProvider.socrata').style.display = 'none';
        document.querySelector('.auth0login').style.display = 'block';
      };
    }

    // If there is only one link, then no enterprise connections are present.
    // Just render the Socrata login immediately.
    if (links.length === 1) {
      document.querySelector('.authProvider.socrata').style.display = 'block';
      document.querySelector('.auth0login').style.display = 'none';
    }
  }
})();
