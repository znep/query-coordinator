module CmsPagesAuth
  def authenticate
    if Rails.env.development?
      redirect_path = "#{Rails.application.config.frontend_uri}"
    end
    redirect_to "#{redirect_path}/login?referer_redirect=1" unless current_user
  end
end