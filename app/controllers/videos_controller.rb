class VideosController < ApplicationController
  skip_before_filter :require_user, :only => [ :index ]

  def index
    # most. pointless. controller. ever.
  end

  def popup
    # gasp! something not pointless!
    @popup = true
    render :action => :index
  end
end