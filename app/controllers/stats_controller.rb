class StatsController < ApplicationController
  caches_page :index

  rescue_from ActionView::MissingTemplate do |exception|
    render 404
  end

  def index
    @dataset = View.find(params[:id])
    @show_search_form = false

    @since = params[:since] ? Time.parse(params[:since]) :  (Time.now - 1.month)

    @stat = Stat.find_for_view(@dataset, {:since => @since.strftime("%m/%d/%Y")})
  end
end
