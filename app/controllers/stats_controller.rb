class StatsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]

  rescue_from ActionView::MissingTemplate do |exception|
    render 404
  end

  def index
    @dataset = View.find(params[:id])
    @show_search_form = false

    if (!current_user.is_domain_publisher? || !CurrentDomain.module_available?(:advanced_metrics))
      # Current user is not a member of the org or the org doesn't have metrics
      return upsell_or_404
    end

    if (@dataset.createdAt.nil?)
      default_since = Time.now - 1.year
    else
      creation_date = Time.at(@dataset.createdAt)

      # Pick either a year ago or the creation date of the dataset.
      default_since = [creation_date, (Time.now - 1.year)].max
    end

    @since = params[:since] ? Time.parse(params[:since]) : default_since

    @stat = Stat.find_for_view(@dataset, {:since => @since.strftime("%m/%d/%Y")})

    if @stat.publish_activity.nil?
      @total_players = 0
      @total_player_views = 0
    else
      @total_players = @stat.publish_activity.size
      @total_player_views = @stat.publish_activity.values.inject(0) {|total, v| total + v}
    end

    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal_dialog") }
    end
  end
end
