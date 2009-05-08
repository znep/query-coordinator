class CommunitiesController < ApplicationController
  skip_before_filter :require_user, :only => [:show, :activities, :filter, :tags]

  PAGE_SIZE = 10
  
  def show
    @body_class = 'community'
    @show_search_form = false
    
    @page_size = PAGE_SIZE
    
    @all_members_total = User.find({ :limit => PAGE_SIZE, :count => true }, true).count
    @all_members = User.find({ :limit => PAGE_SIZE }, true)
    @all_members_tags = Tag.find({ :method => "usersTags", :limit => 5 })
    
    @top_members_total = 100
    @top_members = User.find({ :topMembers => true, :limit => PAGE_SIZE, :page => 1 }, true);
    @top_members_tags = Tag.find({ :method => "usersTags", :topMembers => true, :limit => 5 })
    
    @top_uploaders_total = 100
    @top_uploaders = User.find({ :topUploaders => true, :limit => PAGE_SIZE, :page => 1 }, true);
    @top_uploaders_tags = Tag.find({ :method => "usersTags", :topUploaders => true, :limit => 5 })
    
    @carousel_members = User.find({ :featured => true, :limit => 10 }, true);
    
    @activities = Activity.find({ :maxResults => 5 })
  end
  
  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || "ACTIVITY"
    tag = params[:tag]
    
    sort_by = sort_by_selection
    is_asc = false
    case sort_by_selection
    when "ALPHA"
      is_asc = true
    when "ALPHA_DESC"
      sort_by = "ALPHA"
    when "LAST_LOGGED_IN"
      is_asc = true
    end 
    
    opts = Hash.new
    opts.update({:page => page, :limit => PAGE_SIZE})
    tag_opts = Hash.new
    tag_opts.update({ :method => "usersTags", :limit => 5 })
    
    case type
      when "TOPMEMBERS"
        opts.update({:topMembers => true})
        tag_opts.update({:topMembers => true})
      when "TOPUPLOADERS"
        opts.update({:topUploaders => true})
        tag_opts.update({:topUploaders => true})
    end
    
    opts.update({:sortBy => sort_by, :isAsc => is_asc})
    if (!tag.nil?)
      opts.update({:tags => tag})
    end
    
    tab_title = type == "ALLMEMBERS" ? "All Members" : (type == "TOPMEMBERS" ? "Top Members" : "Top Uploaders")
    unless(filter.nil?)
      opts.update(filter)
      
      if (filter[:publicOnly])
        tab_title += " with public #{t(:blists_name)}"
      end
    end
    
    @page_size = PAGE_SIZE
    @filtered_members = User.find(opts, true)
    @filtered_members_total = User.find(opts.update({:count => true})).count
    
    tag_list = Tag.find(tag_opts)
    
    respond_to do |format|
      format.html { redirect_to(community_url(params)) }
      format.data { 
        render(:partial => "communities/member_list_tab", 
          :locals => 
          {
            :tab_title => tab_title, 
            :members => @filtered_members, 
            :members_total => @filtered_members_total,
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
  
  def activities
    @community_activity = Activity.find({:maxResults => 13})
    if (current_user)
      @contacts_activity = Activity.find({:maxResults => 13, :inNetwork => true})
    end
  end
  
  def tags
    @type = params[:type]
    @current_filter = params[:filter]
    
    opts = Hash.new
    opts.update({ :method => "usersTags" })
    case @type
      when "TOPMEMBERS"
        opts.update({:topMembers => true})
      when "TOPUPLOADERS"
        opts.update({:topUploaders => true})
    end
    
    unless(@current_filter.nil?)
      opts.update(@current_filter)
    end
    
    @tag_list = Tag.find(opts).sort_by{ |tag| tag.name }
    
    render(:layout => "modal")
  end

end
