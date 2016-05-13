require 'request_store'

class DemoController < ApplicationController
  DEMO_USER = {
    'displayName' => 'Demo User'
  }

  def index
    RequestStore.store[:current_user] = params[:logged_in] == 'true' ? DEMO_USER : nil

    render 'fake_content', :layout => FeatureFlags.derive(nil, request)[:enable_unified_header_footer] ? 'unified' : 'plain'
  end

end
