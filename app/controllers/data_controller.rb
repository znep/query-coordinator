class DataController < ApplicationController
  caches_page :splash, :noie, :redirected
  skip_before_filter :require_user

  PAGE_SIZE = 10

  def redirect_to_root
    redirect_to root_path(params), :status => 301
  end

  def show
    # If they don't have the discover module or the community module, they can't
    # access this page. Redirect them to a login form or the /home page
    # TODO: We really should have some way of templatizing the home page to put
    # _something_ there...
    if !CurrentDomain.module_enabled? [:discovery_module, :community_module ]
      redirect_to home_path
    end

    # get filter options
    opts, tag_opts = parse_opts(params)

    # save us some work for no-JS versions
    @active_tab = :search if opts[:q]
    @active_tab ||= (params[:type] || :popular).to_sym

    # set up page params
    @body_class = 'discover'
    @show_search_form = false
    @page_size = PAGE_SIZE

    # TODO: Community activity needs to be filtered by domain
    @community_activity = Activity.find({:maxResults => 3}) unless CurrentDomain.revolutionize?

    # build current state string
    @current_state = { 'filter' => params[:filter], 'page' => opts[:page].to_i,
      'tag' => opts[:tags], 'sort_by' => opts[:sortBy], 'search' => opts[:q],
      'no_js' => params[:no_js] }

  # TODO: Tags should also allow filtering by org
    # "Top 100" tab
    if @active_tab == :popular
      mod_state = @current_state.merge(
        {'type' => 'popular', 'domain' => CurrentDomain.cname,
        'sort_by' => @current_state['sort_by'] || 'POPULARITY'})
      unless @popular_views_rendered = read_fragment(app_helper.cache_key("discover-tab", mod_state))
        @popular_views = View.find_filtered(opts.merge({ :top100 => true }))
        @popular_views_total = View.find(opts.merge({ :top100 => true, :count => true}), true).count
        @popular_views_tags = Tag.find(tag_opts.merge({ :top100 => true }))
        ensure_tag_in_list(@popular_views_tags, opts[:tags])
      end
    end

    # "All Views" tab
    if @active_tab == :all
      mod_state = @current_state.merge(
        {'type' => 'all', 'domain' => CurrentDomain.cname,
        'sort_by' => @current_state['sort_by'] || 'LAST_CHANGED'})
      unless @all_views_rendered = read_fragment(app_helper.cache_key("discover-tab", mod_state))
        @all_views = View.find(opts, true)
        @all_views_total = View.find(opts.merge({ :count => true }), true).count
        @all_views_tags = Tag.find(tag_opts)
        ensure_tag_in_list(@all_views_tags, opts[:tags])
      end
    end

    # "Featured Datasets" carousel
    unless @carousel_views_rendered = read_fragment("discover-carousel_#{CurrentDomain.cname}")
      @carousel_views = View.find_filtered({ :featured => true, :limit => 10 })
    end

    # "In Your Network" (Not Cached)
    @network_views = View.find_filtered({ :inNetwork => true, :limit => 5 })

    # If a search was specified
    if opts[:q]
      @search_term = opts[:q]
      begin
        search_results = SearchResult.search("views", opts)
        @search_views = search_results[0].results
        @search_views_total = search_results[0].count
      rescue CoreServer::CoreServerError => e
        # An error was encountered during the search, so we return an empty search
        @search_views = []
        @search_views_total = 0
      end
    end

    # get nominations if we need them
    if CurrentDomain.module_enabled?(:dataset_nomination) &&
        (@active_tab == :nominations || !params[:no_js])
      @nominations = Nomination.find_page(opts[:page], PAGE_SIZE)
      @nominations_count = Nomination.count
    end

    # Hide logo if theme specifies so
    @hide_logo = " style='display:none'" if CurrentDomain.theme.no_logo_on_discover
  end

  def filter
    # get filter options from params
    opts, tag_opts = parse_opts(params)

    # fetch the data for the page
    @page_size = PAGE_SIZE
    if params[:type] == 'search'
      @search_term = opts[:q]
      search_results = SearchResult.search("views", opts)
      @filtered_views = search_results[0].results
      @filtered_views_total = search_results[0].count
    else
      @filtered_views = View.find_filtered(opts)
      @filtered_views_total = View.find_filtered(opts.merge({ :count => true })).count

      @filtered_views_tags = Tag.find(tag_opts)
      ensure_tag_in_list(@filtered_views_tags, opts[:tags])
    end

    # build current state string
    @current_state = { 'filter' => params[:filter], 'page' => opts[:page],
      'tag' => opts[:tags], 'sort_by' => opts[:sortBy], 'search' => opts[:q] }

    # render the appropriate view
    respond_to do |format|
      format.html{ redirect_to(data_path(params)) }
      format.data do
        render(:partial => "data/cached_view_list_merged",
               :locals => { :tab_to_render => params[:type].to_sym })
      end
    end

  end

  def tags
    @type = params[:type]

    opts = Hash.new
    opts.update({ :method => "viewsTags" })

    if (@type == "popular")
      opts.update({:top100 => true})
    end

    unless(@current_filter.nil?)
      opts.update(@current_filter)
    end

    @tag_list = Tag.find(opts).sort_by{ |tag| tag.name }

    # build current state string
    @current_state = { 'filter' => params[:filter], 'page' => params[:page],
      'sort_by' => params[:sort_by], 'search' => params[:search], 'no_js' => params[:no_js] }

    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal") }
    end
  end

  def splash
    render(:layout => "splash")
  end

  def noie
    render(:layout => "splash")
  end

  def redirected
    render(:layout => "splash")
  end

  def suggest
    respond_to do |format|
      format.data { render(:partial => "suggest", :layout => "modal_dialog") }
    end
  end

  def nominations
    page = params["page"].nil? ? 1 : params["page"].to_i
    count = Nomination.count(params["status"])
    status = params["status"]
    @nominations = Nomination.find_page(page, PAGE_SIZE, params["status"])

    respond_to do |format|
      format.data { 
        render(:partial => "nominations", 
               :locals => {:current_page => page, :total => count, :page_size => PAGE_SIZE, :status => status}) 
      }
    end
  end

private
  def app_helper
    AppHelper.instance
  end

  def parse_opts(params)
    page = params[:page].present? ? params[:page].to_i : 1
    sort_by_selection = params[:sort_by] || (params[:type] == "popular" ? "POPULAR" : "LAST_CHANGED")
    sort_by = sort_by_selection

    is_asc = true
    case sort_by_selection
    when "ALPHA_DESC"
      sort_by = "ALPHA"
      is_asc = false
    when "NUM_OF_VIEWS", "AVERAGE_RATING", "COMMENTS", "LAST_CHANGED", "POPULAR"
      is_asc = false
    end

    opts = {:page => page, :limit => PAGE_SIZE}
    tag_opts = { :method => "viewsTags", :limit => 5 }

    if params[:type] == "popular"
      opts[:top100] = true
      tag_opts[:top100] = true
    end
    if (!params[:type].present? || (params[:type] == 'search')) && params[:search]
      opts[:q] = params[:search]
    end

    # the core server caches common queries. This causes the cache to be used
    if params[:type] == "popular" ? sort_by != "POPULAR" : sort_by != "LAST_CHANGED"
      opts[:sortBy] = sort_by
      opts[:isAsc] = is_asc
    end

    opts[:tags] = params[:tag] unless params[:tag].nil?
    opts.update(params[:filter]) unless params[:filter].blank?

    return opts, tag_opts
  end

  def ensure_tag_in_list(list, required_tag)
    if (!required_tag.nil? && !list.nil? && !list.any?{ |tag| tag.name == required_tag })
      new_tag = Tag.new
      new_tag.data['name'] = required_tag
      list << new_tag
    end
  end

protected
  # Discover controller is heavily cached. Don't bother with putting an
  # authenticity_token  anywhere on this page, since we'd just end up caching it
  # and breaking stuff.
  def protect_against_forgery?
    false
  end

end

class AppHelper
  include Singleton
  include ApplicationHelper
end
