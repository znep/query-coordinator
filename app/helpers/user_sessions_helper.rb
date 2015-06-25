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
  # Check to see if auth0 is available.
  def use_auth0?
    AUTH0_CONFIGURED && FeatureFlags.derive.use_auth0
  end
end
