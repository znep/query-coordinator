class AnalyticsController < ApplicationController

  def index
    if !CurrentDomain.feature? :public_site_metrics
      return render_404
    end
  end

end
