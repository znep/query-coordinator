class DataController < ApplicationController
  caches_page :splash, :noie, :redirected
  skip_before_filter :require_user

  PAGE_SIZE = 10

  def redirect_to_root
    redirect_to root_path(:search => params[:search]), :status => 301
  end

  def show
    @body_class = 'discover'
    @show_search_form = false
    @page_size = PAGE_SIZE

    # TODO: We shouldn't bother retrieving nominations if it isn't enabled for
    # this domain
    @nominations = Nomination.find_page(1, PAGE_SIZE)
    @nominations_count = Nomination.count()

    # TODO: Community activity needs to be filtered by domain
    @community_activity = Activity.find({:maxResults => 3}) unless CurrentDomain.revolutionize?

    # "All Views" tab
    unless @all_views_rendered = read_fragment("discover-tab-all_#{CurrentDomain.cname}")
      opts = {:limit => PAGE_SIZE}

      @all_views_total = View.find(opts.merge({:count => true }), true).count
      @all_views = View.find(opts, true)

      # TODO: Tags should also allow filtering by org
      @all_views_tags = Tag.find({ :method => "viewsTags", :limit => 5 })
    end

    # "Top 100" tab
    unless @popular_views_rendered = read_fragment("discover-tab-popular_#{CurrentDomain.cname}")
      opts = {:top100 => true, :limit => PAGE_SIZE, :page => 1}

      @popular_views = View.find_filtered(opts)
      @popular_views_total = @popular_views.size
      @popular_views_tags = Tag.find({ :method => "viewsTags", :top100 => true, :limit => 5 })
    end

    # "Featured Datasets" carousel
    unless @carousel_views_rendered = read_fragment("discover-carousel_#{CurrentDomain.cname}")
      @carousel_views = View.find_filtered({ :featured => true, :limit => 10 })
    end

    # "In Your Network" (Not Cached)
    @network_views = View.find_filtered({ :inNetwork => true, :limit => 5 })

    # If a search was specified
    if (params[:search])
      @search_term = params[:search]
      @search_debug = params[:search_debug]
      begin
        search_results = SearchResult.search("views", { :q => @search_term, :limit => PAGE_SIZE, :page => 1 })
        @search_views = search_results[0].results
        @search_views_total = search_results[0].count
      rescue CoreServer::CoreServerError => e
        # An error was encountered during the search, so we return an empty search
        @search_views = []
        @search_views_total = 0
      end
    end

    # Hide logo if theme specifies so
    @hide_logo = " style='display:none'" if CurrentDomain.theme.no_logo_on_discover

    # build current state string
    @current_state = { :search => @search_term , :search_debug => @search_debug}
  end

  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || (type == "POPULAR" ? "POPULAR" : "LAST_CHANGED")
    tag = params[:tag]
    search_term = params[:search]
    search_debug = params[:search_debug]

    sort_by = sort_by_selection
    is_asc = true
    case sort_by_selection
    when "ALPHA_DESC"
      sort_by = "ALPHA"
      is_asc = false
    when "NUM_OF_VIEWS", "AVERAGE_RATING", "COMMENTS", "LAST_CHANGED", "POPULAR"
      is_asc = false
    end

    opts = Hash.new
    opts.update({:page => page, :limit => PAGE_SIZE})
    tag_opts = Hash.new
    tag_opts.update({ :method => "viewsTags", :limit => 5 })

    if (type == "POPULAR")
      opts.update({:top100 => true})
      tag_opts.update({:top100 => true})
    elsif (type == "SEARCH")
      opts.update({:q => search_term })
    end

    # the core server caches common queries. This causes the cache to
    # be used
    if type == "POPULAR" ? sort_by != "POPULAR" : sort_by != "LAST_CHANGED"
      opts.update({:sortBy => sort_by, :isAsc => is_asc})
    end

    if (!tag.nil?)
      opts.update({:tags => tag})
    end

    tab_title = type == "POPULAR" ? "Popular" : "All"
    unless(filter.nil?)
      opts.update(filter)

      if (filter[:inNetwork])
        tab_title += " #{t(:blists_name)} in my network"
      elsif (filter[:category])
        tab_title += " #{filter[:category]} #{t(:blists_name)}"
      end
    else
      tab_title += " #{t(:blists_name)}"
    end

    unless(tag.nil?)
      tab_title += " tagged '#{tag}'"
    end

    @page_size = PAGE_SIZE
    if type == "SEARCH"
      tab_title = "Search Results for \"#{search_term}\""
      search_results = SearchResult.search("views", opts)
      @filtered_views = search_results[0].results
      @filtered_views_total = search_results[0].count
    else
      @filtered_views = View.find_filtered(opts)
      @filtered_views_total = View.find_filtered(opts.update({:count => true})).count

      tag_list = Tag.find(tag_opts)
      if (tag && !tag_list.nil? && !tag_list.any? {|itag| itag.name == tag })
        new_tag = Tag.new
        new_tag.data['name'] = tag
        tag_list << new_tag
      end
    end

    # build current state string
    @current_state = { :filter => filter, :page => page, :tag => tag,
      :sort_by => sort_by_selection, :search => search_term, 
      :search_debug => search_debug }

    respond_to do |format|
      format.html { redirect_to(data_path(params)) }
      format.data { 
        if ((@filtered_views.length > 0) || (type != "SEARCH"))
          render(:partial => "data/view_list_tab", 
            :locals => 
            {
              :tab_title => tab_title, 
              :views => @filtered_views, 
              :views_total => @filtered_views_total,
              :current_page => page.to_i,
              :type => type,
              :current_filter => filter,
              :sort_by => sort_by_selection,
              :tag_list => tag_list,
              :current_tag => tag,
              :search_term => search_term,
              :search_debug => search_debug,
              :page_size => @page_size
            })
        else
          render(:partial => "data/view_list_tab_noresult",
              :locals => { :term => search_term })
        end
      }
    end

  end

  def tags
    @type = params[:type]

    opts = Hash.new
    opts.update({ :method => "viewsTags" })

    if (@type == "POPULAR")
      opts.update({:top100 => true})
    end

    unless(@current_filter.nil?)
      opts.update(@current_filter)
    end

    @tag_list = Tag.find(opts).sort_by{ |tag| tag.name }

    # build current state string
    @current_state = { :filter => params[:filter], :page => params[:page],
      :sort_by => params[:sort_by], :search => params[:search] }

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

  protected
  # Discover controller is heavily cached. Don't bother with putting an
  # authenticity_token  anywhere on this page, since we'd just end up caching it
  # and breaking stuff.
  def protect_against_forgery?
    false
  end

end
