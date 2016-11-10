require 'request_store'

class DemoController < ApplicationController
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

  def index
    ::RequestStore.store[:current_user] =
      case params[:logged_in]
        when 'true' then DEMO_USER
        when 'admin' then ADMIN_USER
        when 'superadmin' then SUPERADMIN_USER
        else nil
      end

    render 'fake_content', :layout => 'unified'
  end

end
