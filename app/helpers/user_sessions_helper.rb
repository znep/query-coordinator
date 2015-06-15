module UserSessionsHelper

  def login_redirect_url
    url = CurrentDomain.properties.on_login_path_override
    url ||= if CurrentDomain.module_enabled?(:govStat)
      if CurrentDomain.member?(current_user) # Forbidden to users without roles.
        govstat_root_path
      else
        session[:return_to]
      end
    end
    url ||= profile_index_path # Fallback to SOMEthing
  end

  ##
  # Sets use_auth0 template variable.
  # Detects if automatic redirect is set and performs that redirect safely.
  #
  # If automatic redirect is not set, configured connections are set as
  # template variables.
  def auth0
    @use_auth0 = FeatureFlags.derive.use_auth0 && AUTH0_CONFIGURED
    properties = CurrentDomain.configuration('auth0').try(:properties)

    if @use_auth0
      # Auth0 Redirection when auth0 configuration is set
      auth0_redirect_connection = properties.try(:auth0_always_redirect_connection)
      auth0_callback_uri = properties.try(:auth0_callback_uri)

      # Booleans to determine validity of redirect request
      connection_is_present = auth0_redirect_connection.present?
      connection_is_valid = connection_exists(auth0_redirect_connection)
      is_fresh_login = !flash[:notice].present?

      # Only redirect if this isn't a redirect from /logout.
      if connection_is_present && connection_is_valid && is_fresh_login
        uri = generate_authorize_uri(auth0_redirect_connection, auth0_callback_uri)
        return redirect_to(uri)
      else
        if connection_is_present && !connection_is_valid
          Rails.logger.error("A non-working connection string, #{auth0_redirect_connection}, has been specified in Auth0 configuration.")
        end

        # If auth0 redirection is not possible/configured
        # we send the auth0_connections to the template and render
        # out appropriate buttons.
        @auth0_connections = properties.try(:auth0_connections) || {}
      end
    end
  end
end
