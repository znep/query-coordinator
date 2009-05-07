class CommunitiesController < ApplicationController
  skip_before_filter :require_user, :only => [:show, :activities, :filter]

  PAGE_SIZE = 10
  
  def show
    @body_class = 'community'
    @show_search_form = false
    
    @page_size = PAGE_SIZE
    
    @all_members_total = User.find({ :limit => PAGE_SIZE, :count => true }, true).count
    @all_members = User.find({ :limit => PAGE_SIZE }, true)
    
    @top_members_total = 100
    @top_members = User.find({ :topMembers => true, :limit => PAGE_SIZE, :page => 1 }, true);
    
    @top_uploaders_total = 100
    @top_uploaders = User.find({ :topUploaders => true, :limit => PAGE_SIZE, :page => 1 }, true);
    
    @carousel_members = User.find({ :featured => true, :limit => 10 }, true);
    
    @activities = Activity.find(5)
  end
  
  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by] || "ACTIVITY"
    
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
    case type
      when "TOPMEMBERS" then opts.update({:topMembers => true})
      when "TOPUPLOADERS"then opts.update({:topUploaders => true})
    end
    
    opts.update({:sortBy => sort_by, :isAsc => is_asc})
    
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
            :sort_by => sort_by_selection
          })
      }
    end
  end
  
  def activities
    @community_activity = Activity.find({:maxResults => 13})
    @contacts_activity = Activity.find({:maxResults => 13, :inNetwork => true})
  end

end
