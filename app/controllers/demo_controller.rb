require 'request_store'

class DemoController < ApplicationController
  DEMO_USER = {
    'displayName' => 'Demo User'
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
    RequestStore.store[:current_user] =
      case params[:logged_in]
        when 'true' then DEMO_USER
        when 'admin' then ADMIN_USER
        when 'superadmin' then SUPERADMIN_USER
        else nil
      end

    render 'fake_content', :layout => FeatureFlags.derive(nil, request)[:enable_unified_header_footer] ? 'unified' : 'plain'
  end

end
