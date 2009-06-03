class DataController < ApplicationController
  skip_before_filter :require_user
  
  PAGE_SIZE = 10

  def show
    @body_class = 'discover'
    @show_search_form = false
    @show_splash = !current_user.nil? ? false :
                      (cookies[:show_splash].nil? ? true : cookies[:show_splash][:value])

    @page_size = PAGE_SIZE
    factory = RequestFactory.new(:timeout => 10)

    EventMachine.run do
      multi = EventMachine::MultiRequest.new
      unless @all_views_rendered = read_fragment("discover-tab-all")
        multi.add(@all_views_total = factory.views('limit' => PAGE_SIZE, 'count' => true))
        multi.add(@all_views = factory.views('limit' => PAGE_SIZE))
        multi.add(@all_views_tags = factory.tags('method' => 'viewsTags', 'limit' => 5))
      end
      unless @popular_views_rendered = read_fragment("discover-tab-popular")
        multi.add(@popular_views = factory.views('top100' => true, 'limit' => PAGE_SIZE, 'page' => 1))
        multi.add(@popular_views_tags = factory.tags('method' => 'viewsTags', 'top100' => true, 'limit' => 5))
      end
      unless @carousel_views_rendered = read_fragment("discover-carousel")
        multi.add(@carousel_views = factory.views('featured' => true, 'limit' => 10))
      end
      multi.add(@network_views = factory.views('inNetwork' => 'true', 'limit' => 5))

      multi.callback do
        if multi.responses[:failed].length > 0
          EventMachine.stop
          return render_500
        else

          unless @all_views_rendered
            @all_views_total = View.parse(@all_views_total.response).count
            @all_views = View.parse(@all_views.response)
            @all_views_tags = Tag.parse(@all_views_tags.response)
          end

          unless @popular_views_rendered
            @popular_views = View.parse(@popular_views.response)
            @popular_views_tags = Tag.parse(@popular_views_tags.response)
            @popular_views_total = 100
          end

          unless @carousel_views_rendered
            @carousel_views = View.parse(@carousel_views.response)
          end
          @network_views = View.parse(@network_views.response)
          EventMachine.stop
        end
      end
    end


    if (params[:search])
      @search_term = params[:search]
      @search_views_total = View.find_filtered({ :full => @search_term, :count => true }).count
      @search_views = View.find_filtered({ :full => @search_term, :limit => PAGE_SIZE, :page => 1 })
    end
  end
  
  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || (type == "POPULAR" ? "POPULAR" : "LAST_CHANGED")
    tag = params[:tag]
    is_clear_filter = params[:clearFilter]
    is_clear_tag = params[:clearTag]
    search_term = params[:search]
    
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
      opts.update({:full => search_term })
    end
    
    if (is_clear_tag)
      tag = nil
    end
    
    opts.update({:sortBy => sort_by, :isAsc => is_asc})
    if (!tag.nil?)
      opts.update({:tags => tag})
    end
    
    if (is_clear_filter)
      filter = nil
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
    
    if type == "SEARCH"
      tab_title = "Search Results for \"#{search_term}\""
    end
    
    @page_size = PAGE_SIZE
    @filtered_views = View.find_filtered(opts)
    @filtered_views_total = View.find_filtered(opts.update({:count => true})).count
    
    tag_list = Tag.find(tag_opts)
    if (tag && !tag_list.nil? && !tag_list.any? {|itag| itag.name == tag })
      new_tag = Tag.new
      new_tag.data['name'] = tag
      tag_list << new_tag
    end
    
    respond_to do |format|
      format.html { redirect_to(data_path(params)) }
      format.data { 
        if (@filtered_views.length > 0)
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
              :search_term => search_term
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
    @current_filter = params[:filter]
    
    opts = Hash.new
    opts.update({ :method => "viewsTags" })
    
    if (@type == "POPULAR")
      opts.update({:top100 => true})
    end
        
    unless(@current_filter.nil?)
      opts.update(@current_filter)
    end
    
    @tag_list = Tag.find(opts).sort_by{ |tag| tag.name }
    
    render(:layout => "modal")
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
