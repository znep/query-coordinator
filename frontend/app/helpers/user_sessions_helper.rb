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

  def load_core_session(env)
    fake_core_session = CoreSession.new(self, @env)
    fake_core_session.pretend_loaded
    controller.request.core_session = fake_core_session
  end

  def password_validation_error?(error)
    /Your password must satisfy three of the following four criteria/.match(error).present?
  end
end
