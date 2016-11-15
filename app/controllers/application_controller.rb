class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  DEMO_USER = {
    'displayName' => 'Demo User',
    'profileImageUrlMedium' => 'http://cdn.dailypainters.com/paintings/boxer_dog_portrait_realistic_animal_painting_by_li_dogs__animals__765aad3231c665c25e24f9ddd307bc4c.jpg'
  }

  ADMIN_USER = {
    'displayName' => 'Admin User',
    'roleName' => 'administrator'
  }

  SUPERADMIN_USER = {
    'displayName' => 'Admin User',
    'flags' => [ 'admin' ]
  }

  def current_user_json
    case params[:logged_in]
      when 'true' then DEMO_USER
      when 'admin' then ADMIN_USER
      when 'superadmin' then SUPERADMIN_USER
      else nil
    end
  end

  layout 'unified'
end
