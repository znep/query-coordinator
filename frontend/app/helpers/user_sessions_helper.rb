module UserSessionsHelper

  def login_redirect_url
    url = CurrentDomain.properties.on_login_path_override
    url ||= session[:return_to]
    url ||= govstat_root_path if CurrentDomain.module_enabled?(:govStat) && CurrentDomain.member?(current_user)
    url ||= profile_index_path # Fallback to SOMEthing
  end

  def password_validation_error?(error)
    /Your password must satisfy three of the following four criteria/.match(error).present?
  end
end
