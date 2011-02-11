class VideosController < ApplicationController
  skip_before_filter :require_user, :only => [ :index ]

  def index
    # most. pointless. controller. ever.
  end
end