class RobotsTxtController < ApplicationController
  skip_before_filter :require_user

  def show
    render :layout => false, :content_type => 'text/plain'
  end
end
