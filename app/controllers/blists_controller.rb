class BlistsController < SwfController
  helper_method :get_title
  skip_before_filter :require_user, :only => [:show, :about, :print, :email]
  
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
      redirect_to(:controller => 'blists', :action => 'new', :status => 301)
      # Use this to modal instead
      #if !current_user
      #  return require_user
      #end
      #@new_dataset = true;
    else
      @body_class = params[:mode] && params[:mode] == 'edit' ?
        'editMode' : 'readMode'
      begin
        @parent_view = @view = View.find(params[:id])
      rescue CoreServer::ResourceNotFound
          flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' cannot be found, or has been deleted.'
          return (render 'shared/error', :status => :not_found)
      rescue CoreServer::CoreServerError => e
        if e.error_code == 'authentication_required' ||
          e.error_code == 'permission_denied'
          return require_user(true)
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

      if !current_user
        @user_session = UserSession.new
      end

      # If we're displaying a single dataset, set the title to the description.
      @meta_description = help.meta_description(@view)
      
      # Shuffle the default tags into the keywords list
      @meta_keywords = help.meta_keywords(@view)
    end

    @data_component = params[:dataComponent]
    @popup = params[:popup]

    @swf_url = swf_url('v3embed.swf')
  end
  
  # To build a url to this action, use View.about_href.
  # Do not use about_blist_path (it doesn't exist).
  def about
    @body_class = 'aboutDataset'
    @view = View.find(params[:id])
    @view.columns.each do |column|
      pp column.flags
    end
  end

  def publish
    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
        flash[:error] = 'This ' + I18n.t(:blist_name).downcase +
          ' cannot be found, or has been deleted.'
        return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        return require_user(true)
      else
        flash[:error] = e.error_message
        return (render 'shared/error')
      end
    end
    
    if !@view.can_edit()
      return require_user(true)
    end
    
    # TODO[ORGS]: check if user is premium
    #if current_user.organization.nil?
    #  # TODO: forward to a marketing page?
    #  return require_user(true)
    #end

    # TODO[ORGS]:
    # We don't yet have a orgs service and we're not sure how we want to do it
    # just yet, so for now by default we are going to just go and create a new
    # template on behalf of the user the first time we load this page and then
    # automatically load the first template for them after that.
    # Eventually, we should be by default fetching the org's default template.
    @widget_customizations = WidgetCustomization.find
    if @widget_customizations.empty?
      @widget_customization = WidgetCustomization.create({
        'customization' => JSON.generate(WidgetCustomization.default_theme), 'name' => "Default" })
    else
      @widget_customization = @widget_customizations.first
    end
    @customization = WidgetCustomization.merge_theme_with_default(@widget_customization.customization)
  end

  def update_customization
    #save customization
  end

  def update
    blist_id = params[:id]

    begin
      blist = View.update_attributes!(blist_id, params[:view])
    rescue CoreServer::CoreServerError => e
      return respond_to do |format|
        format.data { render :json => {'error' => e.error_message}.to_json }
      end
    end

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

  def email
    @view = View.find(params[:id])
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def print
    @view = View.find(params[:id])
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def new
    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal_dialog") }
    end
  end
  
  def upload
    @is_upload = true
    respond_to do |format|
      format.html { render(:action => "new") }
      format.data { render(:action => "new", :layout => "modal_dialog") }
    end
  end
  
  def create
    new_view = params[:view].reject { |key,value| value.blank? }
    
    flags = Array.new
    case (params[:privacy])
    when "public_view"
      flags << "dataPublic"
    #when "public_edit"
    #  flags << "publicEdit"
    when "private"
      # Don't need to set any flags for private
    when "adult_content"
      flags << "adultContent"
    end  
    new_view[:flags] = flags
    
    # if there is CC license type selected then we need to
    # populate from the creative commons dropdown
    if new_view[:licenseId] == "CC"
      new_view[:licenseId] = params[:license_cc_type]
    end

    # if we have a datasetID then the user imported
    is_import = params.has_key?('datasetID') && !params[:datasetID].empty?
    begin
      if is_import
        view = View.find(params[:datasetID])
        view.update_attributes!(new_view)
      else
        view = View.create(new_view)
      end
    rescue CoreServer::CoreServerError => e
      return respond_to do |format|
        format.html do
          flash[:error] = e.error_message
          redirect_to :action => :new
        end
        format.data { render :json => {'error' => e.error_message}.to_json }
      end
    end

    respond_to do |format|
      format.html { redirect_to(view.href + (is_import ? '' : "?mode=edit")) }
      format.data { render :json => {'url' => view.href}.to_json }
    end
  end

  def destroy
      blist_id = params[:id]
      result = View.delete(blist_id)

      respond_to do |format|
        format.data { render :text => blist_id }
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

  def help
    Helper.instance
  end

end

class Helper
  include Singleton
  include ApplicationHelper
end
