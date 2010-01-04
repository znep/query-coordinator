class CommunitiesController < ApplicationController
  before_filter { |c| c.require_module! :community_module }
  skip_before_filter :require_user, :only => [:show, :activities, :filter, :tags]

  PAGE_SIZE = 10

  def show
    @body_class = 'community'
    @show_search_form = false

    @page_size = PAGE_SIZE

    @all_members_total = User.find({ :limit => PAGE_SIZE, :count => true }).count
    @all_members = User.find({ :limit => PAGE_SIZE })
    @all_members_tags = Tag.find({ :method => "usersTags", :limit => 5 })

    @top_members_total = 100
    @top_members = User.find({ :topMembers => true, :limit => PAGE_SIZE, :page => 1 });
    @top_members_tags = Tag.find({ :method => "usersTags", :topMembers => true, :limit => 5 })

    @top_uploaders_total = 100
    @top_uploaders = User.find({ :topUploaders => true, :limit => PAGE_SIZE, :page => 1 });
    @top_uploaders_tags = Tag.find({ :method => "usersTags", :topUploaders => true, :limit => 5 })

    @carousel_members = User.find({ :featured => true, :limit => 10 });

    @activities = Activity.find({ :maxResults => 5 })

    if (params[:search])
      @search_term = params[:search]
      @search_members_total = User.find({ :full => @search_term, :count => true }).count
      @search_members = User.find({ :full => @search_term, :limit => PAGE_SIZE, :page => 1 })
    end
  end

  def filter
    type = params[:type]
    filter = params[:filter]
    page = params[:page] || 1
    sort_by_selection = params[:sort_by]
    tag = params[:tag]
    search_term = params[:search]
    search_debug = params[:search_debug]

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
      when "SEARCH"
        opts.update({:q => search_term })
    end

    if !sort_by.nil?
      opts.update({:sortBy => sort_by, :isAsc => is_asc})
    end

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
    if type == "SEARCH"
      tab_title = "Search Results for \"#{search_term}\""
      search_results = SearchResult.search("users", opts)
      @filtered_members = search_results[0].results
      @filtered_members_total = search_results[0].count
    else
      @filtered_members = User.find(opts)
      @filtered_members_total = User.find(opts.update({:count => true})).count

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
      format.html { redirect_to(community_path(params)) }
      format.data { 
        if ((@filtered_members.length > 0) || (type != "SEARCH"))
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
              :current_tag => tag,
              :search_term => search_term,
              :search_debug => search_debug,
            })
        else
          render(:partial => "communities/member_list_tab_noresult", 
              :locals => { :term => search_term })
        end
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

    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal") }
    end
  end

end
