class DataController < ApplicationController
  skip_before_filter :require_user
  
  PAGE_SIZE = 10

  def redirect_to_root
    redirect_to root_path(:search => params[:search]), :status => 301
  end

  def show
    @body_class = 'discover'
    @show_search_form = false
    @show_splash = !current_user.nil? ? false :
                      (cookies[:show_splash].nil? ? true : cookies[:show_splash][:value])

    @page_size = PAGE_SIZE

    unless @all_views_rendered = read_fragment("discover-tab-all")
      @all_views_total = View.find({ :limit => PAGE_SIZE, :count => true }, true).count
      @all_views = View.find({ :limit => PAGE_SIZE }, true)
      @all_views_tags = Tag.find({ :method => "viewsTags", :limit => 5 })
    end
    unless @popular_views_rendered = read_fragment("discover-tab-popular")
      @popular_views_total = 100
      @popular_views = View.find_filtered({ :top100 => true, :limit => PAGE_SIZE, :page => 1 })
      @popular_views_tags = Tag.find({ :method => "viewsTags", :top100 => true, :limit => 5 })
    end
    unless @carousel_views_rendered = read_fragment("discover-carousel")
      @carousel_views = View.find_filtered({ :featured => true, :limit => 10 })
    end
    @network_views = View.find_filtered({ :inNetwork => true, :limit => 5 })

    if (params[:search])
      @search_term = params[:search]
      @search_views_total = View.find_filtered({ :full => @search_term, :count => true }).count
      @search_views = View.find_filtered({ :full => @search_term, :limit => PAGE_SIZE, :page => 1 })
    end

    @search_type = params[:search_type]

    # build current state string
    @current_state = { :search => @search_term }
  end
  
  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || (type == "POPULAR" ? "POPULAR" : "LAST_CHANGED")
    tag = params[:tag]
    search_term = params[:search]
    use_lucene_search = (!params[:search_type].nil? && params[:search_type] == "lucene" && type == "SEARCH")

    # <HACK>
    #   <reason>testing lucene</reason>
    #   <details>enabling lucene for staging environment (QA), kevin, kostub, and chris</details>
    #   <am_i_sorry>true</am_i_sorry>
      if (ENV['RAILS_ENV'] == 'staging' ||
        (current_user &&
         (current_user.login == 'kmerritt' ||
          current_user.login == 'kostub' ||
          current_user.login == 'chris.metcalf'))) && type == "SEARCH"
        use_lucene_search = true
      end
    # </HACK>

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
    elsif (use_lucene_search)
      opts.update({:q => search_term })
    elsif (type == "SEARCH")
      opts.update({:full => search_term })
    end
    
    opts.update({:sortBy => sort_by, :isAsc => is_asc})
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
    end

    if use_lucene_search
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
      :sort_by => sort_by_selection, :search => search_term }

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
              :search_type => params[:search_type]
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
    cookies[:show_splash] = { :value => false, :expires => 10.years.from_now };
    
    render(:layout => "splash")
  end
  
  def noie
    render(:layout => "splash")
  end
  
  def redirected
    cookies[:show_splash] = { :value => false, :expires => 10.years.from_now };
    render(:layout => "splash")
  end

  protected
  # Discover controller is heavily cached. Don't bother with putting an
  # authenticity_token  anywhere on this page, since we'd just end up caching it
  # and breaking stuff.
  def protect_against_forgery?
    false
  end

end
