class RobotsTxtController < ApplicationController
  skip_before_filter :require_user

  def show
    return render_404 if CurrentDomain.truthy? 'suppress_robots'
    render :layout => false, :content_type => 'text/plain'
  end
end
