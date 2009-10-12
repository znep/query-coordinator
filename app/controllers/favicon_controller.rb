class FaviconController < ApplicationController
  skip_before_filter :require_user, :set_user
  ssl_allowed :show

  def show
    filename = File.join(Rails.root, 'public/images/themes', Theme.active, 'favicon.ico')
    if File.exist?(filename)
      response.header['Cache-Control'] = 'max-age=2592000'
      send_file filename, :type => 'image/x-icon', :disposition => 'inline'
    else
      render :nothing => true, :status => :not_found
    end
  end
end
