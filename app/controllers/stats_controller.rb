class StatsController < ApplicationController
  skip_before_filter :require_user, :only => [:index, :popup, :screenshot]

  rescue_from ActionView::MissingTemplate do |exception|
    render 404
  end

  def index
    @dataset = View.find(params[:id])
    @show_search_form = false

    if (@dataset.createdAt.nil?)
      default_since = Time.now - 3.month
    else
      creation_date = Time.at(@dataset.createdAt)

      # Pick either a year ago or the creation date of the dataset.
      default_since = [creation_date, (Time.now - 3.month)].max
    end

    @since = params[:since] ? Time.parse(params[:since]) : default_since

    @stat = Stat.find_for_view(@dataset, {:since => @since.strftime("%m/%d/%Y")})
    if @stat.url_activity.nil?
      @total_players = 0
      @total_player_views = 0
    else
      @total_players = @stat.url_activity.size
      @total_player_views = @stat.url_activity.inject(0) {|total, v| total + v["count"]}
    end
  end
  
  def popup
    render(:layout => "splash")
  end
  
  def screenshot
    render(:layout => "screenshot")
  end
end
