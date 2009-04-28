class DiscoversController < SwfController
  skip_before_filter :require_user, :only => [:show, :filter]

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

  def filter
    type = params[:type]
    filter = params[:filter]
    
    opt_string = type == "POPULAR" ? "sortBy=POPULAR&" : ""
    opt_string += filter.to_param
    @filtered_views = View.find_filtered(opt_string)
    
    tab_title = type == "POPULAR" ? "Popular" : "All"
    if (filter[:inNetwork])
      tab_title += " #{t(:blists_name)} in my network"
    elsif (filter[:publicOnly])
      tab_title += " Public #{t(:blists_name)}"
    elsif (filter[:privateOnly])
      tab_title += " Private #{t(:blists_name)}"
    elsif (filter[:category])
      tab_title += " #{filter[:category]} #{t(:blists_name)}"
    end
    
    respond_to do |format|
      format.html { redirect_to(discover_url(params)) }
      format.data { 
        render(:partial => "discovers/view_list_tab", 
          :locals => 
          {
            :tab_title => tab_title, 
            :views => @filtered_views, 
            :type => type
          })
      }
    end
    
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
