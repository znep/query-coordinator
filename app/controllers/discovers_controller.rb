class DiscoversController < SwfController
  skip_before_filter :require_user, :only => [:show, :filter]
  
  PAGE_SIZE = 10

  def show
    @body_class = 'discover'
    @show_search_form = false
    
    @page_size = PAGE_SIZE

    @all_views_total = View.find({ :limit => PAGE_SIZE, :count => true }, true).count
    @all_views = View.find({ :limit => PAGE_SIZE }, true)
    
    @popular_views_total = 100
    @popular_views = View.find_filtered({ :top100 => true, :limit => PAGE_SIZE, :page => 1 });
    
    @carousel_views = View.find_filtered({ :featured => true, :limit => 10 })
    @network_views = View.find_filtered({ :inNetwork => true, :limit => 5 })

  end

  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    
    opts = Hash.new
    opts.update({:page => page, :limit => PAGE_SIZE})
    if (type == "POPULAR")
      opts.update({:top100 => true})
    end
    
    tab_title = type == "POPULAR" ? "Popular" : "All"
    unless(filter.nil?)
      opts.update(filter)
      
      if (filter[:inNetwork])
        tab_title += " #{t(:blists_name)} in my network"
      elsif (filter[:publicOnly])
        tab_title += " Public #{t(:blists_name)}"
      elsif (filter[:privateOnly])
        tab_title += " Private #{t(:blists_name)}"
      elsif (filter[:category])
        tab_title += " #{filter[:category]} #{t(:blists_name)}"
      end
    else
      tab_title += " #{t(:blists_name)}"
    end
    
    @page_size = PAGE_SIZE
    @filtered_views = View.find_filtered(opts)
    @filtered_views_total = View.find_filtered(opts.update({:count => true})).count
    
    respond_to do |format|
      format.html { redirect_to(discover_url(params)) }
      format.data { 
        render(:partial => "discovers/view_list_tab", 
          :locals => 
          {
            :tab_title => tab_title, 
            :views => @filtered_views, 
            :views_total => @filtered_views_total,
            :current_page => page.to_i,
            :type => type,
            :current_filter => filter
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
