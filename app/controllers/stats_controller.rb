class StatsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]

  rescue_from ActionView::MissingTemplate do |exception|
    render 404
  end

  def index
    @dataset = View.find(params[:id])
    @show_search_form = false

    # TODO: In 45 days (around July 15th, 2009) change the sliding window from 
    # 1 year ago to default to a month.
    creation_date = Time.at(@dataset.createdAt)

    # Pick either a year ago or the creation date of the dataset.
    default_since = [creation_date, (Time.now - 1.year)].max
    @since = params[:since] ? Time.parse(params[:since]) :  default_since

    @stat = Stat.find_for_view(@dataset, {:since => @since.strftime("%m/%d/%Y")})
    if @stat.url_activity.nil?
      @total_players = 0
      @total_player_views = 0
    else
      @total_players = @stat.url_activity.size
      @total_player_views = @stat.url_activity.inject(0) {|total, v| total + v["count"]}
    end
  end
end
