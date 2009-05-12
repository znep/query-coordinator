class DiscoversController < ApplicationController
  skip_before_filter :require_user, :only => [:show, :filter, :tags]
  
  PAGE_SIZE = 10

  def show
    @body_class = 'discover'
    @show_search_form = false
    
    @page_size = PAGE_SIZE

    @all_views_total = View.find({ :limit => PAGE_SIZE, :count => true }, true).count
    @all_views = View.find({ :limit => PAGE_SIZE }, true)
    @all_views_tags = Tag.find({ :method => "viewsTags", :limit => 5 })
    
    @popular_views_total = 100
    @popular_views = View.find_filtered({ :top100 => true, :limit => PAGE_SIZE, :page => 1 });
    @popular_views_tags = Tag.find({ :method => "viewsTags", :top100 => true, :limit => 5 })
    
    @carousel_views = View.find_filtered({ :featured => true, :limit => 10 })
    @network_views = View.find_filtered({ :inNetwork => true, :limit => 5 })
  end

  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || (type == "POPULAR" ? "POPULAR" : "LAST_CHANGED")
    tag = params[:tag]
    is_clear_filter = params[:clearFilter]
    is_clear_tag = params[:clearTag]
    
    sort_by = sort_by_selection
    is_asc = true
    case sort_by_selection
    when "ALPHA_DESC"
      sort_by = "ALPHA"
      is_asc = false
    when "NUM_OF_VIEWS", "AVERAGE_RATING", "COMMENTS"
      is_asc = false
    end
    
    opts = Hash.new
    opts.update({:page => page, :limit => PAGE_SIZE})
    tag_opts = Hash.new
    tag_opts.update({ :method => "usersTags", :limit => 5 })
    
    if (type == "POPULAR")
      opts.update({:top100 => true})
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
    
    tag_list = Tag.find(tag_opts)
    if (tag && !tag_list.nil? && !tag_list.any? {|itag| itag.name == tag })
      new_tag = Tag.new
      new_tag.data['name'] = tag
      tag_list << new_tag
    end
    
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
            :current_filter => filter,
            :sort_by => sort_by_selection,
            :tag_list => tag_list,
            :current_tag => tag
          })
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

end
