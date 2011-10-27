class DatasetsController < ApplicationController
  include DatasetsHelper
  skip_before_filter :require_user, :only => [:show, :blob, :alt, :widget_preview, :contact, :math_validate, :form_success, :form_error, :external, :external_download, :download, :about]

# collection actions
  def new
    if (!CurrentDomain.user_can?(current_user, :create_datasets) &&
        !CurrentDomain.module_enabled?(:community_creation))
      # User doesn't have access to create new datasets
      render 'shared/error', :status => :not_found
      return nil
    end
  end

# member actions
  def show
    # adjust layout to thin versions (rather than '_full')
    @page_custom_header = 'header'
    @page_custom_footer = 'footer'
    @page_custom_chrome = ''
    @suppress_content_wrapper = true

    if is_mobile? && (params[:no_mobile] != 'true')
      return(redirect_to :controller => 'widgets', :action => 'show', :id => params[:id])
    end

    @view = get_view(params[:id])
    return if @view.nil?

    # We definitely don't want to have to look up the row index
    # ever again, as that causes a full scan. Persist the
    # index across calls, and make it part of the URL we generate
    # for SEO.
    unless params[:row_index].nil?
      @row_index = params[:row_index].to_i rescue 0
    end

    if !params[:row_id].nil? || !params[:row_index].nil?
      @row = !params[:row_id].nil? ? @view.get_row(params[:row_id]) :
        @view.get_row_by_index(params[:row_index])
      if @row.nil?
        flash.now[:error] = 'This row cannot be found, or has been deleted.'
        render 'shared/error', :status => :not_found
        return nil
      end
    end

    if !current_user
      @user_session = UserSession.new
    end

    href = @view.href
    href += '/' + @row['sid'].to_s if !@row.nil?
    # See if it matches the authoritative URL; if not, redirect
    if request.path != href
      # Log redirects in development
      if Rails.env.production? && request.path =~ /^\/dataset\/\w{4}-\w{4}/
        logger.info("Doing a dataset redirect from #{request.referrer}")
      end
      return redirect_to(href + '?' + request.query_string)
    end

    # If we're displaying a single dataset, set the meta tags as appropriate.
    @meta[:title] = @meta['og:title'] = "#{@view.name} | #{CurrentDomain.strings.site_title}"
    @meta[:description] = @meta['og:description'] = @view.meta_description
    @meta['og:url'] = request.url.to_s
    # TODO: when we support a dataset image, allow that here if of appropriate size

    # Shuffle the default tags into the keywords list
    @meta[:keywords] = @view.meta_keywords

    # get stuff the js needs
    needs_view_js @view.id, @view
    if @view.has_modifying_parent_view?
      begin
        parent_view = @view.parent_view
      rescue CoreServer::CoreServerError => e
        if e.error_code == 'permission_denied' || e.error_code == 'authentication_required'
          parent_view = false
        end
      end
      needs_view_js @view.modifyingViewUid, parent_view
    end
  end

  def blob
    @view = get_view(params[:id])
    respond_to do |format|
      format.data { render :partial => 'displays/blob' }
    end
  end

# bare version of the page, w/o chrome, for screenshotting
  def bare
    @view = get_view(params[:id])
    return if @view.nil?
    # if the core server requests a specific timeout, rather than
    # letting the js decide when it's rendered
    if params[:timeout].present?
      if params[:timeout].to_i < 60
        @snapshot_timeout = params[:timeout]
      else
        Rails.logger.info("Ignoring snapshot request, over 60 second limit (#{params[:timeout]})")
      end
    end

    @snapshot_name = params[:name]

    if !current_user
      @user_session = UserSession.new
    end

    needs_view_js @view.id, @view
    render :layout => false
  end

# alt actions
  def alt
    @view = get_view(params[:id])
    return if @view.nil?

    if !current_user && params[:force_login]
      return require_user(true)
    end

    @conditions = parse_alt_conditions(params)

    # build state for the sake of the pager
    @state_param = {}
    [:filter, :sort, :search_string].each{ |key| @state_param[key] = params[key] unless params[key].nil? }
    @state_param = @state_param.to_param

    if @view.is_tabular?
      begin
        # get rows
        @per_page = 50
        @data, @viewable_columns, @aggregates, @row_count = @view.find_data(@per_page, @page, @conditions)
      rescue CoreServer::CoreServerError => e
        if e.error_code == 'invalid_request'
          flash.now[:error] = e.error_message
          return (render 'shared/error', :status => :invalid_request)
        end
      end
    end

    @view.register_opening(request.referrer)
  end

# other actions
  def external
    view = View.find_external(params[:id])

    if !view.blank?
      redirect_to view[0].href
    else
      render_404
    end
  end

  def external_download
    view = View.find_external(params[:id])
    type = params[:type]

    if !view.blank? && !type.blank?
      redirect_to metric_redirect_path(:type => type.upcase, :id => view[0].id)
    else
      render_404
    end
  end

  def save_filter
    begin
      @view = View.find(params[:id])
    rescue
      flash.now[:error] = 'An error occurred processing your request. Please try again in a few minutes.'
      return (render 'shared/error')
    end

    conditions = parse_alt_conditions(params)

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

  def modify_permission
    view = View.find(params[:id])
    view.set_permission(params[:permission_type])
    respond_to do |format|
      format.html { redirect_to view.alt_href + '#sharing' }
    end
  end

  def post_comment
    @is_child = !params[:comment][:parent].nil?

    if params[:comment][:viewRating].present?
      begin
        # Note: No type is specified, use default
        @rating = Rating.create(params[:id], {:rating => params[:comment][:viewRating]})
      rescue
        # They already posted a rating for this category, ignore...
      end
      params[:comment].delete(:viewRating)
    end
    @comment = Comment.create(params[:id], params[:comment])
    @view = View.find(params[:id])

    redirect_path = params[:redirect_to]

    respond_to do |format|
      format.html { redirect_to(@view.href + redirect_path) }
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
  end

  def append
    @view = View.find(params[:id])
    @error_type = @view.columns.any?{ |column| !column.flag?('hidden') && column.client_type.match(
      /(document|photo|document_obsolete|photo_obsolete|location|nested_table)/) }
    @type = params[:type] == 'replace' ? 'replace' : 'append'
  end

  def contact
    @view = View.find(params[:id])
  end

# end alt actions

  def math_validate
    return if params['equation_token'].blank?

    @view = get_view(params[:id])
    return if @view.nil?

    equation_parts = ActiveSupport::Base64.decode64(params['equation_token']).strip.split(/\s+/)
    str_to_num = {
      'zero'  => 0,
      'one'   => 1,
      'two'   => 2,
      'three' => 3,
      'four'  => 4,
      'five'  => 5,
      'six'   => 6,
      'seven' => 7,
      'eight' => 8,
      'nine'  => 9,
      'ten'   => 10
    }
    num1 = str_to_num[equation_parts[0]]
    num2 = str_to_num[equation_parts[2]]
    operator = equation_parts[1]

    if(operator == 'plus')
      answer = num1 + num2
    elsif(operator == 'minus')
      answer = num1 - num2
    end

    success = false
    if answer==str_to_num[params['user_answer'].strip.downcase]
      flag_params = {}
      keys = [:id, :type, :subject, :message, :from_address]
      keys.each do |key|
        flag_params[key] = params[key]
        success = false if params[key].nil?
      end

      @view.flag(flag_params)
      success = true
    end

    respond_to do |format|
      format.html do
        if success
          flash[:notice] = 'Your message has been sent'
          return (redirect_to @view.alt_href)
        else
          flash[:error] = 'Please fill in all fields'
          return (redirect_to contact_dataset_path(@view.id))
        end
      end
      format.data { render :json => { :success => success } }
    end
  end

  def widget_preview
    @view = get_view(params[:id])
    return if @view.nil?

    @customization_id = params[:customization_id]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?

    render :layout => 'plain'
  end

  def edit
    @view = get_view(params[:id])
    return if @view.nil?

    return render_404 if @view.published?

    unless @view.can_modify_data? || @view.is_blobby?
      flash.now[:error] = "You do not have permission to modify this dataset."
      return render_forbidden
    end
  end

  def edit_metadata
    @view = get_view(params[:id])
    return if @view.nil?
    if !params[:view].nil?
      begin
        if parse_attachments() && parse_meta(@view) && parse_external_sources() && parse_image()
          @view = View.update_attributes!(params[:id], params[:view])
          flash.now[:notice] = "The metadata has been updated."
        end
      rescue CoreServer::CoreServerError => e
        flash.now[:error] = "An error occurred during your request: #{e.error_message}"
      end
    end
  end

  def edit_rr
    @view = get_view(params[:id])
    return if @view.nil?

    if @current_user.nil? || !(@current_user.has_right?('create_datasets') &&
      @view.has_rights?('update_view'))
      return render_forbidden
    end
  end

  def thumbnail
    @view = get_view(params[:id])
    return if @view.nil?

    unless @view.has_rights?('update_view')
      return render_forbidden
    end

    needs_view_js @view.id, @view
  end

  def stats
    @view = get_view(params[:id])
    return if @view.nil?

    if !(@view.user_granted?(current_user) || \
        CurrentDomain.user_can?(current_user, :edit_others_datasets))
      return render_forbidden
    end

    needs_view_js @view.id, @view
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

  def download
    view = get_view(params[:id])
    return if view.nil?

    type = CGI.unescape(params[:type])
    return render_404 if view.blobs.nil?

    blob = view.blobs.detect {|b| b['type'] == type}
    return render_404 if blob.nil? || blob['href'].blank?

    MetricQueue.instance.push_metric(params[:id], 'files-downloaded')
    redirect_to blob['href']
  end

  def about
    @view = get_view(params[:id])
    @user_session = UserSession.new if !current_user

    @page_custom_chrome = ''
    @suppress_content_wrapper = true
    @page_custom_header = 'header'
    @page_custom_footer = 'footer'
  end

protected
  def get_view(id)
    begin
      view = View.find(id)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This dataset or view cannot be found, or has been deleted.'
      render 'shared/error', :status => :not_found
      return nil
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return nil
      elsif e.error_code == 'permission_denied'
        render_forbidden(e.error_message)
        return nil
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return nil
      end
    end

    if (view.is_form? ? !view.can_add? : !view.can_read?)
      render_forbidden("You do not have permission to view this dataset")
      return nil
    end

    return view
  end

  def parse_alt_conditions(params)
    # parse params
    @conditions = {}
    #   page params
    @page = (params[:page] || 1).to_i
    #   filter params
    unless params[:filter].nil?
      filters = []
      params[:filter].each do |column_id, filter|
        next if filter[:operator].blank?
        filter_condition = {
          'type' => 'operator',
          'value' => filter[:operator],
          'children' => [ {
            'type' => 'column',
            'columnId' => column_id
          } ]
        }
        filter_condition['children'].push({
            'type' => 'literal',
            'value' => filter[:value]
        }) if !filter[:value].nil?
        filters.push(filter_condition)
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

  def file_extension(url)
      base = url[/\.([^\.\/]+)$/]
      base[1..-1] if base
  end

  def parse_meta(view)
    if !view.metadata.nil?
      # Make sure required fields are filled in
      domain_meta = CurrentDomain.property(:fieldsets, :metadata)
      unless domain_meta.blank?
        error_fields = []
        domain_meta.each do |fieldset|
          unless fieldset.fields.blank?
            fieldset.fields.each do |field|
              if field.required.present?
                if (field.private.present? &&
                    params[:view][:privateMetadata][:custom_fields][fieldset.name][field.name].blank?) ||
                  (field.private.blank? &&
                    params[:view][:metadata][:custom_fields][fieldset.name][field.name].blank?)
                  error_fields << field.name
                end
              end
            end
          end
        end
        unless error_fields.empty?
          flash.now[:error] = error_fields.length == 1 ?
            "The field '#{error_fields.first}' is required." :
            "The fields '#{error_fields[0..-2].join("', '")}' and '#{error_fields[-1]}' are required."
          return false
        end
      end
      if params[:view][:metadata].present? && params[:view][:metadata][:rdfClass] =~ /^_.*/
        params[:view][:metadata][:rdfClass] = nil
      end
      params[:view][:metadata] = (view.data['metadata'] || {}).
        deep_merge(params[:view][:metadata] || {})
      params[:view][:privateMetadata] = (view.data['privateMetadata'] || {}).
        deep_merge(params[:view][:privateMetadata] || {})
    end
    true
  end

  def parse_external_sources
    if params[:external_sources].present?
      accessPoints = {}
      params[:external_sources].each do |source|
        next if source['name'].blank?
        extension = source['extension']
        extension = file_extension(source['name']) if extension.blank?
        if extension.nil?
          flash.now[:error] = "The url '#{source['name']}' does not appear to be valid " +
            "for downloading. Please specify file type or fix the URL."
          return false
        end
        if !accessPoints[extension.downcase].nil?
          flash.now[:error] = "Multiple external datasets with the same " +
            "extension are not allowed. Please remove one of the '.#{extension}' files."
          return false
        end
        accessPoints[extension.downcase] = source['name']
      end
      if accessPoints.size < 1
        flash.now[:error] = "You must have at least one source for this external dataset."
        return false
      end
      params[:view][:metadata][:accessPoints] = accessPoints
    end
    true
  end

  def parse_attachments
    if params[:view][:metadata] && params[:view][:metadata][:attachments]
      params[:view][:metadata][:attachments].delete_if { |a| a[:delete].present? }
    end
    # This sucks, but is necessary for the accessible version
    if params[:attachment_new]
      if (params[:view][:metadata].nil? || params[:view][:metadata][:attachments].nil?)
        params[:view].deep_merge!({ :metadata => { :attachments => []} } )
      end

      attachment = post_asset params[:attachment_new]

      params[:view][:metadata][:attachments] << {:blobId => attachment['id'],
        :filename => attachment['nameForOutput'],
        :name => attachment['nameForOutput']}
    end
    true
  end

  def parse_image
    if params[:delete_custom_image].present?
      params[:view][:iconUrl] =  nil
    elsif params[:custom_image].present?
      unless ['image/png','image/x-png','image/gif','image/jpeg','image/pjpeg']
        .include? params[:custom_image].content_type
        flash[:error] = "Please select a valid image type (PNG, JPG, or GIF)"
        return
      end
      image = post_asset params[:custom_image]
      params[:view][:iconUrl] = image['id']
    end
    true
  end

  def post_asset(file)
    JSON.parse(CoreServer::Base.connection.multipart_post_file('/assets', file))
  end
end
