(function() {
  'use strict';

  // Create a new Auth0Lock with injected blist configration options
  // Options are injected from the login erb template.
  //
  // Auth0Lock is exported by https://cdn.auth0.com/js/lock-7.14.min.js,
  // sourced in _login_form.html.erb — we can switch this to an import
  // when we get around to updating old UX code.
  var widget = new window.Auth0Lock(blist.configuration.auth0.id, blist.configuration.auth0.uri);
  if (document.getElementById('auth0login')) {
    // Only use_auth0 configuration.
    // In this case, only use_auth0 is set internally, and no other options.
    widget.show({
      container: 'auth0login',
      callbackURL: blist.configuration.auth0.base_uri + '/auth/auth0/callback',
      focusInput: true,
      responseType: 'code',
      rememberLastLogin: false,
      authParams: {
        scope: 'openid profile'
      },
      resetLink: blist.configuration.auth0.base_uri + '/forgot_password',
      signupLink: blist.configuration.auth0.base_uri + '/signup'
    });
  } else {
    // Auth0 configuration with two or more buttons for selection.
    // Configuration is set to add enterprise login options.
    var auth0Login = function(connection) {
      return function() {
        if (connection === 'socrata.com') {
          // The socrata.com connection is rendered locally.
          document.querySelector('.authProvider.socrata').style.display = 'block';
          document.querySelector('.auth0login').style.display = 'none';
          return;
        } else if (connection) {
          // Redirect to the connection's authorization path.
          return widget.getClient().login({
            connection: connection,
            callbackURL: blist.configuration.auth0.base_uri + '/auth/auth0/callback',
            responseType: 'code',
            scope: 'openid profile'
          });
        }
      };
    };

    var links = document.querySelectorAll('.auth0login .button');
    var back = document.querySelector('.login-back');

    links = Array.prototype.slice.apply(links);
    links.forEach(function(link) {
      var connection = link.dataset ? link.dataset.connection : link.getAttribute('data-connection');
      link.onclick = auth0Login(connection);
    });

    if (back) {
      back.onclick = function(event) {
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
