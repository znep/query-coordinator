module UserSessionsHelper

  def login_redirect_url
    CurrentDomain.properties.on_login_path_override ||
      (CurrentDomain.module_enabled?(:govStat) ? (CurrentDomain.feature?(:govstat_15) ? govstat_root_path : manage_path) : profile_index_path)
  end

end
