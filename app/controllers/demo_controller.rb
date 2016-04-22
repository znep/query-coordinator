class DemoController < ApplicationController

  def index
    render 'fake_content', :layout => FeatureFlags.derive(nil, request)[:enable_unified_header_footer] ? 'unified' : 'plain'
  end

end
