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
    @need_to_render = [:popular, :all, :search, :nominations]
    @active_tab = (params[:type] || 'popular').downcase.to_sym
    if params[:no_js]
      @need_to_render = [@active_tab]
    end

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
    if @need_to_render.include?(:popular)
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
    if @need_to_render.include?(:all)
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
    if params[:search] && @need_to_render.include?(:search)
      @search_term = params[:search]
      @search_debug = params[:search_debug]
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
    if CurrentDomain.module_enabled?(:dataset_nomination) && @need_to_render.include?(:nominations)
      @nominations = Nomination.find_page(opts[:page], PAGE_SIZE)
      @nominations_count = Nomination.count
    end

    # Hide logo if theme specifies so
    @hide_logo = " style='display:none'" if CurrentDomain.theme.no_logo_on_discover
  end

  def filter
    # get filter options from params
    opts, tag_opts = parse_opts(params)

    # figure out the tab title text
    tab_title = (params[:type] || 'popular').titleize
    unless params[:filter].nil?
      if (params[:filter][:inNetwork])
        tab_title += " #{t(:blists_name)} in my network"
      elsif (params[:filter][:category])
        tab_title += " #{params[:filter][:category]} #{t(:blists_name)}"
      end
    else
      tab_title += " #{t(:blists_name)}"
    end
    tab_title += " tagged '#{opts[:tags]}'" unless(opts[:tags].nil?)

    # fetch the data for the page
    @page_size = PAGE_SIZE
    if params[:type] == 'search'
      tab_title = "Search Results for \"#{opts[:q]}\""
      search_results = SearchResult.search("views", opts)
      @filtered_views = search_results[0].results
      @filtered_views_total = search_results[0].count
    else
      @filtered_views = View.find_filtered(opts)
      @filtered_views_total = View.find_filtered(opts.merge({ :count => true })).count

      tag_list = Tag.find(tag_opts)
      ensure_tag_in_list(tag_list, opts[:tags])
    end

    # build current state string
    @current_state = { 'filter' => params[:filter], 'page' => opts[:page],
      'tag' => opts[:tags], 'sort_by' => opts[:sortBy], 'search' => opts[:q] }

    # render the appropriate view
    respond_to do |format|
      format.html{ redirect_to(data_path(params)) }
      format.data do
        if ((@filtered_views.length > 0) || (params[:type] != "SEARCH"))
          render(:partial => "data/view_list_tab",
                 :locals => {
                    :tab_title => tab_title,
                    :views => @filtered_views,
                    :views_total => @filtered_views_total,
                    :current_page => @current_state['page'].to_i,
                    :type => params[:type],
                    :current_filter => @current_state['filter'],
                    :sort_by => @current_state['sort_by'],
                    :tag_list => tag_list,
                    :current_tag => @current_state['tags'],
                    :search_term => @current_state['search'],
                    :page_size => @page_size
          })
        else
          render(:partial => "data/view_list_tab_noresult",
              :locals => { :term => opts[:q] })
        end
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
    page = params[:page] || 1
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
    elsif params[:type] == "search"
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
