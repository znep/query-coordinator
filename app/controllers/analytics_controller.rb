class AnalyticsController < ApplicationController
  skip_before_filter :require_user

  def index
    if !CurrentDomain.feature? :public_site_metrics
      return render_404
    end
  end

end
