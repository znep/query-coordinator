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
    @blists = get_blists(@args)
    @title = get_title(@args)
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
          request.path =~ /^\/dataset\/\w{4}-\w{4}/
          logger.info("Doing a dataset redirect from #{request.referrer}")
        end
        redirect_to(@view.href + '?' + request.query_string)
      end

      if !@view.is_blist?
        par_view = View.find({'tableId' => @view.tableId,
          'method' => 'getByTableId'}, true).
          find {|v| v.is_blist?}
        if (!par_view.nil?)
          @is_child_view = true
          @parent_view = par_view
        end
      end
      @view.register_opening
      @view_activities = Activity.find({:viewId => @view.id})

      # If we're displaying a single dataset, set the title to the description.
      if @view.description.blank?
        @meta_description = "View this dataset"
        updated_at = help.blist_long_date(@view.rowsUpdatedAt)
        if updated_at
          @meta_description += ", last updated #{updated_at}"
        end
      else
        @meta_description = @view.description
      end
      @meta_keywords = @view.tags
    end

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

  def notify_all_of_changes
    blist_id = params[:id]
    result = View.notify_all_of_changes(blist_id)
    render :text => {"result" => "success"}.to_json
  end

  def create
    begin
      view = View.create(params[:view])
    rescue CoreServerError => e
      return respond_to do |format|
        format.html do
          flash[:error] = e.error_message
          render 'shared/error'
        end
        format.data { render :json => {'error' => e.error_message}.to_json }
      end
    end

    respond_to do |format|
      format.html { redirect_to(view.href) }
      format.data { render :json => {'url' => view.href}.to_json }
    end
  end

  def destroy
      blist_id = params[:id]
      result = View.delete(blist_id)

      respond_to do |format|
        format.data { render :text => "deleted" }
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

  def get_blists(params = nil)
    if params.nil?
      params = Hash.new
    end

    opts = Hash.new
    if !params['shared_to'].nil? && params['shared_to'] != current_user.id
      opts['sharedTo'] = params['shared_to']
    end
    cur_views = View.find(opts)

    if !params['owner'].nil?
      cur_views = cur_views.find_all {|v| v.owner.id == params['owner']}
    end
    if !params['owner_group'].nil?
      group = Group.find(params['owner_group'])
      cur_views = cur_views.find_all {|v| group.users.any? {|u|
        u.id == v.owner.id}}
    end

    if !params['shared_to'].nil? && params['shared_to'] == current_user.id
      cur_views = cur_views.find_all {|v|
        v.owner.id != params['shared_to'] && v.flag?('shared')}
    end
    if !params['shared_to_group'].nil?
      cur_views = cur_views.find_all {|v| v.grants.any? {|g|
        g.groupId == params['shared_to_group']}}
    end

    if !params['shared_by'].nil?
      cur_views = cur_views.find_all {|v|
        v.owner.id == params['shared_by'] && v.is_shared?}
    end
    if !params['shared_by_group'].nil?
      group = Group.find(params['shared_by_group'])
      cur_views = cur_views.find_all {|v| group.users.any? {|u|
        u.id == v.owner.id && v.flag?('shared')}}
    end

    if params['type'] == 'filter'
      cur_views = cur_views.find_all {|v| !v.flag?('default')}
    elsif params['type'] == 'favorite'
      cur_views = cur_views.find_all {|v| v.flag?('favorite')}
    end

    if !params['untagged'].nil? && params['untagged'] == 'true'
      cur_views = cur_views.find_all {|v| v.tags.length < 1}
    end
    if !params['untagged'].nil? && params['untagged'] == 'false'
      cur_views = cur_views.find_all {|v| v.tags.length > 0}
    end
    if !params['tag'].nil?
      cur_views = cur_views.find_all {|v| v.tags.any? {|t|
        t.data == params['tag']}}
    end


    # First, sort by name.
    cur_views = cur_views.sort_by { |view| view.name }

    # Re-organize the views with children under their parents. Maintain overall sorting.
    # Stash all parent blists.
    view_parents = Hash.new
    # First loop, create a hash of parents, keyed on tableId.
    cur_views.each do |v1|
      if (v1.is_blist?)
        view_parents[v1.tableId] = {
          :rows_updated => v1.last_activity,
          :views => [v1]
        }
      end
    end
    
    # Second loop, if parent found in view_parents, add to the views array in the hash, otherwise create a new entry.
    cur_views.each do |v2|
      unless (v2.is_blist?)
        if (view_parents.has_key?(v2.tableId))
          view_parents[v2.tableId][:views] << v2
        else
          view_parents[v2.id] = {
            :rows_updated => v2.last_activity,
            :views => [v2]
          }
        end
      end
    end
    return view_parents.sort do |a,b|
      if b[1][:rows_updated] && a[1][:rows_updated]
        b[1][:rows_updated] <=> a[1][:rows_updated]
      else
        1
      end
    end
  end

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

  def help
    Helper.instance
  end

end

class Helper
  include Singleton
  include ApplicationHelper
end
