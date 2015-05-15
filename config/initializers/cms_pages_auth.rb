module CmsPagesAuth
  def authenticate
    # If no current_user, send to main login page
    redirect_to "/login?referer_redirect=1&return_to=#{request.path}" unless current_user
  end
end
