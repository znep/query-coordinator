module UserSessionsHelper

  def login_redirect_url
    CurrentDomain.properties.on_login_path_override ||
      (CurrentDomain.module_enabled?(:govStat) ? manage_path : profile_index_path)
  end

end
