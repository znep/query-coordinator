class OpenSearchController < ApplicationController
  skip_before_filter :require_user

  def show
    @url_base = "//#{CurrentDomain.cname}"
    favicon = AppHelper.instance.theme_image_url(CurrentDomain.theme.images.favicon)
    @abs_favicon = favicon.start_with?('/') ? "#{@url_base}#{favicon}" : favicon
    render :layout => false, :content_type => 'text/xml'
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
