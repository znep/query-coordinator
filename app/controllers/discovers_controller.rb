class DiscoversController < SwfController
  skip_before_filter :require_user, :only => [:show]

  def show
    @body_class = 'discover'
    @show_search_form = false

    opts = Hash.new
    opts['limit'] = 10
    @all_views = View.find(opts, true)

    @popular_views = View.find_popular()
    @carousel_views = View.find_featured()
    @network_views = View.find_recent(5, true)

  end

  def swf
    @body_id = 'discoverBody'
    @body_class = 'discover'
    @start_screen = 'discover'
    @discover_search = params[:search]
    @swf_url = swf_url('v3embed.swf')

    render(:template => "discovers/show_swf")
  end

end
