class BlistsController < ApplicationController
  include BlistsHelper
  helper_method :get_title
  skip_before_filter :require_user, :only => [:help_me, :show, :alt, :alt_filter, :about, :print, :email, :flag, :republish, :about_sdp, :form_success, :form_error, :map, :visualization, :calendar]

  def index
    @body_class = 'home'
    accept_keys = ['owner', 'owner_group', 'shared_to', 'shared_to_group',
      'shared_by', 'shared_by_group', 'type', 'untagged', 'tag']
    @args = params.reject {|k,v| !accept_keys.include?(k)}.inject({}) do |h,(k,v)|
      h[k] = CGI.unescape(v); h
    end
    @title = get_title(@args)
  end

  def alt_index
    @body_class ='home'
    @views = View.find

    # TODO: The core server doesn't support sortby params here.
    #       Refactor when they do.
    @sort_by = params[:sort_by] || 'updated'
    case @sort_by
      when 'updated'
        @views.sort!{ |a, b| b.viewLastModified.to_i <=> a.viewLastModified.to_i }
        # {:sortBy => 'LAST_CHANGED', :isAsc => false}
      when 'name'
        @views.sort!{ |a, b| a.name <=> b.name }
        # {:sortBy => 'ALPHA', :isAsc => true}
    end
  end

  def show
    @body_id = 'lensBody'
    begin
      @parent_view = @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' or view cannot be found, or has been deleted.'
            return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        return require_user(true)
      elsif e.error_code == 'permission_denied'
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :forbidden)
      else
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    if (@view.is_form? ? !@view.can_add : !@view.can_read())
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

    @data_component = params[:dataComponent]
    @popup = params[:popup]
    @display = @view.display
  end

  def alt
    @body_id = 'lensBody'

    begin
      @parent_view = @view = View.find(params[:id])
      # @aggregates = @view.aggregates
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
            ' or view cannot be found, or has been deleted.'
            return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' 
        return require_user(true)
      elsif e.error_code == 'permission_denied'
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :forbidden)
      else
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    if !@view.can_read() || (!current_user && params[:force_login])
      return require_user(true)
    end

    @conditions = parse_conditions(params)

    # build state for the sake of the pager
    @state_param = {}
    [:filter, :sort, :search_string].each{ |key| @state_param[key] = params[key] unless params[key].nil? }
    @state_param = @state_param.to_param

    if @view.is_tabular?
      # get rows
      @per_page = 50
      @data, @viewable_columns, @aggregates, @row_count = @view.find_data(@per_page, @page, @conditions)
    end

    @view.register_opening
    @view_activities = Activity.find({:viewId => @view.id})
  end
  
  def save_filter
    begin
      @view = View.find(params[:id])
    rescue
      flash.now[:error] = 'An error occurred processing your request. Please try again in a few minutes.'
      return (render 'shared/error')
    end

    conditions = parse_conditions(params)

    begin
      @result = @view.save_filter(params[:name], conditions)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'invalid_request'
        flash.now[:error] = 'A view with that name already exists. Please use the back button on your browser and pick a different name.'
      else
        flash.now[:error] = 'An error occurred processing your request. Please try again in a few minutes.'
      end
      return (render 'shared/error')
    end
    redirect_to @result.alt_href
  end

  # To build a url to this action, use View.about_href.
  # Do not use about_blist_path (it doesn't exist).
  def about
    @body_class = 'aboutDataset'
    @view = View.find(params[:id])
  end

  def about_edit
    @view = View.find(params[:id])
  end

  def publish
    begin
      @view = View.find(params[:id])
    rescue CoreServer::ResourceNotFound
        flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
          ' cannot be found, or has been deleted.'
        return (render 'shared/error', :status => :not_found)
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required' ||
        e.error_code == 'permission_denied'
        return require_user(true)
      else
        flash.now[:error] = e.error_message
        return (render 'shared/error', :status => :internal_server_error)
      end
    end

    if !@view.can_edit() && !CurrentDomain.user_can?(current_user, :edit_sdp)
      return require_user(true)
    end

    unless CurrentDomain.user_can?(current_user, :edit_sdp) && CurrentDomain.module_available?(:sdp_customizer)
      # Not a member of the org or the org doesn't have SDP customization
      return upsell_or_404
    end

    # TODO[ORG SETUP]:
    # When we have an orgs setup process, move this into there instead of here
    # so that orgs don't default to the basic level theme.

    @widget_customizations = WidgetCustomization.find.select{ |w| !w.hidden }

    @widget_customization = @widget_customizations.find{ |w|
        w.uid == CurrentDomain.default_widget_customization_id}

    if @widget_customization.nil?
      begin
        @widget_customization = WidgetCustomization.create({
          'customization' => WidgetCustomization.default_theme(1), 'name' => "Default Socrata" })
      rescue CoreServer::CoreServerError => e
        @widget_customization = WidgetCustomization.create({
          'customization' => WidgetCustomization.default_theme(1), 'name' => "Default Socrata New" })
      end
    end
    @customization = @widget_customization.customization

    # TEMPORARY HACK!
    # If a domain has a v0 template default, we can't really render this thing.
    # Remove this once all domains have been upgraded.
    unless @customization.has_key?(:version)
      @widget_customization = WidgetCustomization.create({
        'customization' => WidgetCustomization.default_theme(1), 'name' => "New Default" })
      @customization = @widget_customization.customization
    end
  end

  def new_customization
    @widget_customizations = WidgetCustomization.find.select {|w| !w.hidden}
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def create_customization
    from = WidgetCustomization.find(params[:new_customization][:from])
    from.customization[:description] = params[:new_customization][:description]

    begin
      new_customization = WidgetCustomization.create({
        'customization' => from.customization, 'name' => params[:new_customization][:name] })
    rescue CoreServer::CoreServerError => e
      return respond_to do |format|
        format.data { render :json => {'error' => e.error_message}.to_json }
      end
    end
    respond_to do |format|
      format.data { render :json => new_customization.to_json() }
    end
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
      format.html { redirect_to(params[:redirect_to] || blist.href) }
      format.data { render :json => blist.to_json() }
    end
  end

  def post_comment
    @is_child = !params[:comment][:parent].nil?
    @comment = Comment.create(params[:id], params[:comment])
    @view = View.find(params[:id])

    redirect_path = params[:redirect_to] ||
                    ('?metadata_pane=tabComments&comment=' + @comment.id.to_s)

    respond_to do |format|
      format.html { redirect_to(@view.href + redirect_path) }
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

  def form_success
    begin
      @view = View.find(params[:id])
    rescue
      # Do nothing; if there is no view, render a generic message
    end

    respond_to do |format|
      format.html { render(:layout => "plain") }
    end
  end

  def form_error
    @view = View.find(params[:id])
    @error_message = params[:errorMessage]
    respond_to do |format|
      format.html { render(:layout => "plain") }
    end
  end

  def detail
    if (params[:id])
      @view = View.find(params[:id])
      @view_activities = Activity.find({:viewId => @view.id})
      render(:partial => "blists/info_for_single.html", :locals => { :view => @view, :page_single => false })
    elsif (params[:multi])
      @views = get_views_with_ids(params[:multi].split(':'))
      render(:partial => "blists/info_for_multi.html", :locals => { :views => @views })
    elsif (params[:items])
      @item_count = params[:items].to_i
      render(:partial => "blists/info_for_list.html", :locals => { :item_count => @item_count })
    end
  end

  def notify_all_of_changes
    blist_id = params[:id]
    result = View.notify_all_of_changes(blist_id)
    respond_to do |format|
      format.data { render :text => {"result" => "success"}.to_json }
    end
  end

  def modify_permission
    view = View.find(params[:id])
    view.set_permission(params[:permission_type])
    respond_to do |format|
      format.html { redirect_to view.alt_href + '#sharing' }
    end
  end

  def email
    @view = View.find(params[:id])

    emails = params[:emails]
    if !emails.nil?
      # Send our emails
      if emails.is_a?(String)
        # Single field, comma separated
        emails = emails.split(/,/).collect {|e| e.strip}
      elsif emails.is_a?(Array)
        emails.collect!{|e| e.strip}
      end

      @bad_addresses = {}
      emails.each do |email|
        begin
          @view.email(email)
        rescue Exception => e
          @bad_addresses[email] = e
        end
      end
    end

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
      format.html { render }
    end
  end

  def print
    @view = View.find(params[:id])
    respond_to do |format|
      format.html do
        @accessible = true
        render
      end
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def republish
    @view = View.find(params[:id])
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def about_sdp
    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def new
    if (!CurrentDomain.user_can?(current_user, :create_datasets) && !CurrentDomain.module_enabled?(:community_creation))
      # User doesn't have access to create new datasets
      return upsell_or_404
    end

    respond_to do |format|
      format.html { render }
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def upload
    if (!CurrentDomain.user_can?(current_user, :create_datasets) && !CurrentDomain.module_enabled?(:community_creation))
      # User doesn't have access to create new datasets
      return upsell_or_404
    end

    @is_upload = true
    respond_to do |format|
      format.html { render(:action => "new") }
      format.data { render(:action => "new", :layout => "modal_dialog") }
    end
  end

  def upload_alt
  end

  def create
    new_view = params[:view].reject { |key,value| value.blank? }

    flags = Array.new
    case (params[:privacy])
    when "public_view"
      flags << "dataPublicRead"
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
          redirect_to :action => (params[:original_action] || 'new')
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

      redirect_path = params[:redirect_to] || blists_path
      redirect_path = View.find(params[:redirect_id]).href unless params[:redirect_id].nil?

      respond_to do |format|
        format.html { redirect_to(redirect_path) }
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

  def flag
    @view = View.find(params[:id])
    @type = params[:type]

    # Pick our subject line
    @subject = "A visitor has sent you a message about your \"#{CGI::escapeHTML(@view.name)}\" #{CurrentDomain.strings.company} #{t(:blist_name)}"
    case @type
    when 'copyright_violation'
      @subject = "Your \"#{CGI::escapeHTML(@view.name)}\" #{t(:blist_name)} has been flagged for copyright violation"
    when 'offensive_content'
      @subject = "Your \"#{CGI::escapeHTML(@view.name)}\" #{t(:blist_name)} has been flagged for offensive content"
    when 'spam'
      @subject = "Your \"#{CGI::escapeHTML(@view.name)}\" #{t(:blist_name)} has been flagged as potential SPAM"
    when 'personal_information'
      @subject = "Your \"#{CGI::escapeHTML(@view.name)}\" #{t(:blist_name)} has been flagged for containing personal information"
    end

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def bulk
    @view = View.find(params[:id])
    @type = params[:type]

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def append
    @view = View.find(params[:id])
    @error_type = @view.columns.any?{ |column| !column.flag?('hidden') && column.client_type.match(
      /(document|photo|document_obsolete|photo_obsolete|location|nested_table)/) }
  end

  def replace
    @view = View.find(params[:id])
    @error_type = @view.columns.any?{ |column| !column.flag?('hidden') && column.client_type.match(
      /(document|photo|document_obsolete|photo_obsolete|location|nested_table)/) }
  end

  def share
    @view = View.find(params[:id])

    # TODO: Make @contacts_json of existing contacts.
    contacts_values = []
    current_user.friends.each do |friend|
      contacts_values << { :id => friend.id, :label => CGI.escapeHTML(friend.displayName) }
    end
    @contact_combo_values = contacts_values.to_json

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def create_share
    message = params[:message] || ""
    recipientArray = params[:recipients]

    errors = Array.new

    if (recipientArray)
      recipientArray.each do |r|
        recipient = JSON.parse(r)

        grant = Hash.new
        unless recipient["email"].blank?
          grant[:userEmail] = recipient["email"]
        end
        unless recipient["userId"].blank?
          grant[:userId] = recipient["userId"]
        end
        grant[:type] = recipient["type"]
        grant[:message] = message

        begin
          Grant.create(params[:id], grant)
        rescue CoreServer::CoreServerError => e
          errors << { :removeId => recipient["id"] }
        end
      end
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success",
      :errors => errors
    }
  end

  def delete_share
    errors = Array.new

    grant = Hash.new
    if params[:email]
      grant[:userEmail] = params[:email]
    end
    if params[:userId]
      grant[:userId] = params[:userId]
    end
    grant[:type] = params[:type].downcase

    begin
      Grant.delete(params[:id], grant)
    rescue CoreServer::CoreServerError => e
      errors << { :grant => grant.to_json }
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success"
    }
  end

  def calendar
    @view = View.find(params[:id])

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def create_calendar
    errors = []
    begin
      view = View.create({'name' => params[:viewName],
                         'originalViewId' => params[:id],
                         'query' => CGI.unescapeHTML(params[:view_query])})

      fmt = {:startDateId => view.columns.select {|c|
        c.tableColumnId.to_s == params[:startDate].to_s}[0].id,
          :titleId => view.columns.select {|c|
          c.tableColumnId.to_s == params[:eventTitle].to_s}[0].id}
      if !params[:endDate].blank?
        fmt[:endDateId] = view.columns.select {|c|
          c.tableColumnId.to_s == params[:endDate].to_s}[0].id
      end
      if !params[:eventDescription].blank?
        fmt[:descriptionId] = view.columns.select {|c|
          c.tableColumnId.to_s == params[:eventDescription].to_s}[0].id
      end
      view.update_attributes!({:displayType => 'calendar', :displayFormat => fmt})
    rescue CoreServer::CoreServerError => e
      errors << e.error_message
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success",
      :errors => errors,
      :newViewId => view.nil? ? '' : view.id
    }
  end

  def visualization
    @view = View.find(params[:id])
    @is_edit = params[:edit] == 'true'

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def create_visualization
    errors = []
    options = params[:options]
    options = JSON.parse(options) if !options.blank?
    columns = params[:columns] || nil
    columns = JSON.parse(columns) if !columns.blank?
    columnIds = params[:columnIds] || nil
    if !columnIds.blank?
      columnIds = JSON.parse(columnIds)
    elsif !columns.blank?
      columnIds = columns.map {|c| c['id']}
    end

    begin
      if params[:edit] == 'true'
        batch_reqs = []

        view_req = {'url' => '/views/' + params[:id], 'requestType' => 'PUT',
          'body' => {'displayType' => params[:vizType],
            'query' => JSON.parse(CGI.unescapeHTML(params[:view_query])),
            'displayFormat' => options}, 'class' => View}

        # TODO: It would be nice to make some convenience methods for generating
        # these requests
        if !columnIds.blank?
          columnIds.each do |cId|
            batch_reqs << {'url' => '/views/' + params[:id] + '/columns/' + cId,
              'requestType' => 'PUT', 'body' => {'hidden' => false},
              'class' => Column}
          end

          view_req['body']['columns'] = columns
        end

        batch_reqs << view_req
        Model.batch(batch_reqs)
      else
        view = View.create({'name' => params[:viewName],
                           'columns' => columns,
                           'displayType' => params[:vizType],
                           'displayFormat' => options,
                           'query' => CGI.unescapeHTML(params[:view_query]),
                           'originalViewId' => params[:id]})
      end
    rescue CoreServer::CoreServerError => e
      errors << e.error_message
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success",
      :errors => errors,
      :newViewId => view.nil? ? '' : view.id
    }
  end

  def form
    @view = View.find(params[:id])
    @is_edit = params[:edit] == 'true'

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def create_form
    errors = []
    begin
      if params[:edit] == 'true'
        view = View.update_attributes!(params[:id], {'displayFormat' =>
                                  {'successRedirect' => params[:successRedirect]}})
        perm_value = params[:publicAdd] == 'true' ? 'public.add' : 'private'
        view.set_permissions(perm_value)
      else
        flags = []
        flags << 'dataPublicAdd' if params[:publicAdd] == 'true'
        view = View.create({'name' => params[:viewName],
                          'originalViewId' => params[:id],
                          'displayType' => 'form',
                          'flags' => flags,
                          'displayFormat' =>
                            {'successRedirect' => params[:successRedirect]}})
      end
    rescue CoreServer::CoreServerError => e
      errors << e.error_message
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success",
      :errors => errors,
      :newViewId => view.nil? ? '' : view.id
    }
  end

  def map
    @view = View.find(params[:id])
    @is_edit = params[:edit] == 'true'

    respond_to do |format|
      format.data { render(:layout => "modal_dialog") }
    end
  end

  def meta_tab_header
     if (!params[:tab])
       return
     end

     @tabKey = params[:tab]
     @view = View.find(params[:id])
     render(:layout => 'main.data')
   end

   def meta_tab
     if (!params[:tab])
       return
     end

     @tabKey = params[:tab]
     @view = View.find(params[:id])
     if (@tabKey == "activity")
       @view_activities = Activity.find({:viewId => @view.id})
     end
     render(:layout => 'main.data')
   end


private

  def parse_conditions(params)
    # parse params
    @conditions = {}
    #   page params
    @page = (params[:page] || 1).to_i
    #   filter params
    unless params[:filter].nil?
      filters = []
      params[:filter].each do |column_id, filter|
        next if filter[:operator].blank?
        f = {
          'type' => 'operator',
          'value' => filter[:operator],
          'children' => [ {
            'type' => 'column',
            'columnId' => column_id
          } ]
        }
        f['children'].push({
            'type' => 'literal',
            'value' => filter[:value]
        }) if !filter[:value].nil?
        filters.push(f)
      end
      unless filters.empty?
        @conditions['filterCondition'] = {
          'type' => 'operator',
          'value' => 'AND',
          'children' => filters
        }
      end
    end
    #   sort params
    unless params[:sort].nil?
      sorts = []
      params[:sort].each do |idx, sort|
        next if sort[:field].blank?
        sorts.push({
          'ascending' => (sort[:direction].downcase == 'ascending'),
          'expression' => {
            'type' => 'column',
            'columnId' => sort[:field]
          }
        })
      end
      @conditions['orderBys'] = sorts unless sorts.empty?
    end
    # search params
    @conditions['searchString'] = params[:search_string] unless params[:search_string].blank?

    return @conditions
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

  def get_name(user_id, obj)
    return user_id == current_user.id ? 'me' :
      (obj || User.find(user_id)).displayName
  end

  def get_group_name(group_id, obj)
    return (obj || Group.find(group_id)).name
  end

  def get_title(params = nil)
    if params.nil?
      params = Hash.new
    end
    title = 'All '
    title_type = t(:blists_name)

    parts = Array.new
    if !params['owner'].nil?
      parts << 'owned by ' + get_name(params['owner'], params['object'])
    end
    if !params['owner_group'].nil?
      parts << 'owned by ' +
        get_group_name(params['owner_group'], params['object'])
    end

    if !params['shared_to'].nil?
      parts << 'shared to ' + get_name(params['shared_to'], params['object'])
    end
    if !params['shared_to_group'].nil?
      parts << 'shared to ' +
        get_group_name(params['shared_to_group'], params['object'])
    end

    if !params['shared_by'].nil?
      parts << 'shared by ' + get_name(params['shared_by'], params['object'])
    end
    if !params['shared_by_group'].nil?
      parts << 'shared by ' +
        get_group_name(params['shared_by_group'], params['object'])
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
        when 'calendar'
          'calendar views'
        when 'favorite'
          'my favorite ' + t(:blists_name)
        when 'filter'
          'filters'
        when 'form'
          'forms'
        when 'grouped'
          'roll ups'
        when 'map'
          'maps'
        when 'visualization'
          'visualizations'
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
