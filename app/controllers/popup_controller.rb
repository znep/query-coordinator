class PopupController < ApplicationController
  skip_before_filter :require_user
  
  def stats
    render(:layout => "splash")
  end
  
  def stats_screenshot
    render(:layout => "screenshot")
  end
  
  def api
    render(:layout => "splash")
  end
  
  def premium
    render(:layout => "splash")
  end
end
