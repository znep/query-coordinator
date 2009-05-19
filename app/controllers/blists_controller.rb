class BlistsController < SwfController
  helper_method :get_title
  skip_before_filter :require_user, :only => [:show]

  def index
    @body_class = 'home'
    accept_keys = ['owner', 'owner_group', 'shared_to', 'shared_to_group',
      'shared_by', 'shared_by_group', 'type', 'untagged', 'tag']
    @args = params.reject {|k,v| !accept_keys.include?(k)}.inject({}) do |h,(k,v)|
      h[k] = CGI.unescape(v); h
    end
  end

  def show
    @body_id = 'lensBody'
    case params[:id]
    when 'new_blist'
      if !current_user
        return require_user
      end
      # show new blist in swf
      @body_class = 'editMode'
      @start_screen = 'new_blist'
    else
      @body_class = params[:mode] && params[:mode] == 'edit' ?
        'editMode' : 'readMode'
      begin
        @parent_view = @view = View.find(params[:id])
      rescue CoreServerError => e
        if e.error_code == 'authentication_required' ||
          e.error_code == 'permission_denied'
          return require_user(true)
        elsif e.error_code == 'not_found'
          flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' cannot be found, or has been deleted.'
          return (render 'shared/error')
        else
          flash[:error] = e.error_message
          return (render 'shared/error')
        end
      end

      if !@view.can_read()
        return require_user(true)
      end

      # See if it matches the authoritative URL; if not, redirect
      if request.path != @view.href
        # Log redirects in development
        if ENV["RAILS_ENV"] != 'production' &&
          request.path =~ /^\/blists\/\w{4}-\w{4}/
          logger.info("Doing a blist redirect from #{request.referrer}")
        end
        redirect_to(@view.href + '?' + request.query_string)
      end

      if !@view.is_blist?
        par_view = View.find({'blistId' => @view.blistId}, true).
          find {|v| v.is_blist?}
        if (!par_view.nil?)
          @is_child_view = true
          @parent_view = par_view
        end
      end
      @view.register_opening
    end

    @view_activities = Activity.find({:viewId => @view.id})
    @data_component = params[:dataComponent]
    @popup = params[:popup]

    @swf_url = swf_url('v3embed.swf')
  end

  def update
    blist_id = params[:id]

    blist = View.update_attributes!(blist_id, params[:view])

    respond_to do |format|
      format.html { redirect_to(blist.href) }
      format.data { render :json => blist.to_json() }
    end
  end

  def post_comment
    @is_child = !params[:comment][:parent].nil?
    @comment = Comment.create(params[:id], params[:comment])
    @view = View.find(params[:id])

    respond_to do |format|
      format.html { redirect_to(@view.href +
        '?metadata_pane=tabComments&comment=' + @comment.id.to_s) }
      format.data { render }
    end
  end

  def update_comment
    comment_id = params[:comment][:id]
    if (params[:comment][:rating])
      Comment.rate(params[:id], params[:comment][:id],
                   params[:comment].delete(:rating))
    end
    Comment.update(params[:id], params[:comment])

    respond_to do |format|
      format.html { redirect_to(View.find(params[:id]).href +
        '?metadata_pane=tabComments&comment=' + comment_id) }
      format.data { render :json => {} }
    end
  end


  def detail
    if (params[:id])
      @view = View.find(params[:id])
      @view_activities = Activity.find({:viewId => @view.id})
    elsif (params[:multi])
      args = Array.new
      multiParam = params[:multi]
      args = multiParam.split(':')
      @views = get_views_with_ids(args)
    elsif (params[:items])
      @item_count = params[:items]
    end
  end

  def create_favorite
    blist_id = params[:id]
    result = View.create_favorite(blist_id)

    respond_to do |format|
      format.html { redirect_to(View.find(blist_id).href) }
      format.data { render :text => "created" }
    end
  end

  def delete_favorite
    blist_id = params[:id]
    result = View.delete_favorite(blist_id)

    respond_to do |format|
      format.html { redirect_to(View.find(blist_id).href) }
      format.data { render :text => "deleted" }
    end
  end

private

  def get_views_with_ids(params = nil)
    cur_views = View.find_multiple(params)

    # Return this array in the order of the params so it'll match the DOM.
    hash_views = Hash.new
    cur_views.each do |v|
      hash_views[v.id] = v
    end

    ret_views = Array.new
    params.each do |p|
      ret_views << hash_views[p]
    end

    return ret_views
  end

  def get_name(user_id)
    return user_id == current_user.id ? 'me' : User.find(user_id).displayName
  end

  def get_title(params = nil)
    if params.nil?
      params = Hash.new
    end
    title = 'All '
    title_type = t(:blists_name)

    parts = Array.new
    if !params['owner'].nil?
      parts << 'owned by ' + get_name(params['owner'])
    end
    if !params['owner_group'].nil?
      parts << 'owned by ' + Group.find(params['owner_group']).name
    end

    if !params['shared_to'].nil?
      parts << 'shared to ' + get_name(params['shared_to'])
    end
    if !params['shared_to_group'].nil?
      parts << 'shared to ' + Group.find(params['shared_to_group']).name
    end

    if !params['shared_by'].nil?
      parts << 'shared by ' + get_name(params['shared_by'])
    end
    if !params['shared_by_group'].nil?
      parts << 'shared by ' + Group.find(params['shared_by_group']).name
    end

    if !params['untagged'].nil? && params['untagged'] == 'true'
      parts << 'with no tags'
    end
    if !params['untagged'].nil? && params['untagged'] == 'false'
      parts << 'with any tags'
    end

    if !params['tag'].nil?
      parts << 'tagged "' + params['tag'] + '"'
    end

    if !params['type'].nil?
      title_type =
        case params['type']
        when 'favorite'
          'my favorite ' + t(:blists_name)
        when 'filter'
          'filters'
        end
    end

    title += "#{title_type} " + parts.join(' and ')
    return title
  end

end
