class CommunitiesController < ApplicationController
  before_filter { |c| c.require_module! :community_module }
  skip_before_filter :require_user, :only => [:show, :activities, :filter, :tags]

  PAGE_SIZE = 10

  def show
    # get filter options
    opts, tag_opts = parse_opts(params)

    # save us some work for no-JS versions
    @active_tab = (params[:type] || :topMembers).to_sym

    # set up page params
    @body_class = 'community'
    @show_search_form = false
    @page_size = PAGE_SIZE

    if @active_tab == :allMembers
      @all_members_total = User.find(opts.merge({ :count => true })).count
      @all_members = User.find(opts)
      @all_members_tags = Tag.find(tag_opts)
      ensure_tag_in_list(@all_members_tags, opts[:tags])
    end

    if @active_tab == :topMembers
      @top_members_total = 100
      @top_members = User.find(opts.merge({ :topMembers => true }))
      @top_members_tags = Tag.find(tag_opts.merge({ :topMembers => true }))
      ensure_tag_in_list(@top_members_tags, opts[:tags])
    end

    if @active_tab == :topUploaders
      @top_uploaders_total = 100
      @top_uploaders = User.find(opts.merge({ :topUploaders => true }))
      @top_uploaders_tags = Tag.find(tag_opts.merge({ :topUploaders => true }))
      ensure_tag_in_list(@top_uploaders_tags, opts[:tags])
    end

    unless @carousel_members_rendered = read_fragment("community-carousel_#{CurrentDomain.cname}")
      @carousel_members = User.find({ :featured => true, :limit => 10 })
    end

    @activities = Activity.find({ :maxResults => 5 })

    if opts[:q]
      search_results = SearchResult.search("users", opts)
      @search_members_total = search_results[0].results
      @search_members = search_members[0].count
    end

    # build current state string
    @current_state = { :filter => params[:filter], :page => opts[:page].to_i,
      :tag => opts[:tags], :sort_by => params[:sort_by], :search => opts[:q],
      :no_js => params[:no_js] }
  end

  def filter
    opts, tag_opts = parse_opts(params)

    tab_title = case params[:type]
      when "allMembers" then "All Members"
      when "topMembers" then "Top Members"
      else "Top Uploaders"
    end
    if (!params[:filter].nil? && params[:filter][:publicOnly])
      tab_title += " with public #{t(:blists_name)}"
    end

    @page_size = PAGE_SIZE
    if params[:type] == "search"
      tab_title = "Search Results for \"#{opts[:q]}\""
      search_results = SearchResult.search("users", opts)
      @filtered_members = search_results[0].results
      @filtered_members_total = search_results[0].count
    else
      @filtered_members = User.find(opts)
      @filtered_members_total = User.find(opts.merge({:count => true})).count

      tag_list = Tag.find(tag_opts)
      ensure_tag_in_list(tag_list, opts[:tags])
    end

    # build current state string
    @current_state = { :filter => params[:filter], :page => opts[:page],
      :tag => opts[:tags], :sort_by => params[:sort_by], :search => opts[:q],
      :no_js => params[:no_js] }

    respond_to do |format|
      format.html { redirect_to(community_path(params)) }
      format.data {
        if ((@filtered_members.length > 0) || (params[:type] != "search"))
          render(:partial => "communities/member_list_tab",
            :locals =>
            {
              :tab_title => tab_title,
              :members => @filtered_members,
              :members_total => @filtered_members_total,
              :current_page => @current_state[:page],
              :type => params[:type],
              :current_filter => @current_state[:filter],
              :sort_by => @current_state[:sort_by],
              :tag_list => tag_list,
              :current_tag => opts[:tags],
              :search_term => opts[:q]
            })
        else
          render(:partial => "communities/member_list_tab_noresult",
              :locals => { :term => opts[:q] })
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

    # build current state string
    @current_state = { :filter => params[:filter], :page => params[:page],
      :sort_by => params[:sort_by], :search => params[:search], :no_js => params[:no_js] }

    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal") }
    end
  end

private
  def parse_opts(params)
    sort_by = params[:sort_by]
    is_asc = false
    case params[:sort_by]
    when "ALPHA"
      is_asc = true
    when "ALPHA_DESC"
      sort_by = "ALPHA"
    end 

    opts = {:page => (params[:page].present? ? params[:page].to_i : 1), :limit => PAGE_SIZE}
    tag_opts = { :method => "usersTags", :limit => 5 }

    case params[:type]
      when "topMembers"
        opts[:topMembers] = true
        tag_opts[:topMembers] = true
      when "topUploaders"
        opts[:topUploaders] = true
        tag_opts[:topUploaders] = true
      when "search"
        opts[:q] = params[:search]
    end

    unless sort_by.nil?
      opts[:sortBy] = sort_by
      opts[:isAsc] = is_asc
    end

    opts[:tags] = params[:tag] unless params[:tag].nil?
    opts.update(params[:filter]) unless params[:filter].nil?

    return opts, tag_opts
  end

  def ensure_tag_in_list(list, required_tag)
    if (!required_tag.nil? && !list.nil? && !list.any?{ |tag| tag.name == required_tag })
      new_tag = Tag.new
      new_tag.data['name'] = required_tag
      list << new_tag
    end
  end
end
