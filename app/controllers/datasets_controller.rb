class DatasetsController < ApplicationController

  include ApplicationHelper
  include DatasetsHelper
  include CommonMetadataMethods

  prepend_before_filter :check_chrome, :only => [:show, :alt]
  skip_before_filter :require_user, :only => [:show, :blob, :alt, :widget_preview, :contact, :validate_contact_owner, :form_success, :form_error, :external, :external_download, :download, :about]
  skip_before_filter :disable_frame_embedding, :only => [:form_success, :form_error]
  # When CSRF token validation is skipped for this method (see skip_before_filter above), the
  # verify_recaptcha test in the 'create' method is our only protection against abuse.
  skip_before_filter :verify_authenticity_token,
    :if => lambda { |controller|
      controller.action_name == 'validate_contact_owner'
    }

# collection actions
  def new
    if (!CurrentDomain.user_can?(current_user, UserRights::CREATE_DATASETS) &&
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

    if is_mobile?
      return(redirect_to :controller => 'widgets', :action => 'show', :id => params[:id])
    end

    if params['$$store']
      @view = View.find_in_store(params[:id], params['$$store'])
    else
      @view = get_view(params[:id])
    end

    return if @view.nil?

    dsmtime = VersionAuthority.get_core_dataset_mtime(@view.id)[@view.id]
    user = @current_user.nil? ? "ANONYMOUS" : @current_user.id

    if @view.new_backend?
      destination_url = view_redirection_url

      if show_nbe_redirection_warning?
        flash[:notice] = I18n.t('screens.ds.new_ux_nbe_warning', url: "<a href=#{destination_url}>#{destination_url}</a>").html_safe
      end

      if !is_admin? && !FeatureFlags.derive(@view, request).disable_obe_redirection && !@view.is_geospatial?
        if FeatureFlags.derive(@view, request).force_redirect_to_data_lens === true
          begin
            pages = fetch_pages_for_dataset(@view.id).fetch(:publisher, [])
            return redirect_to "/view/#{pages.first[:pageId]}" unless pages.empty?
          rescue AuthenticationRequired, UnauthorizedDatasetMetadataRequest,
                 DatasetMetadataNotFound, UnknownRequestError
            # Do nothing.
          end
        end
        if destination_url == '/'
          flash[:notice] = I18n.t('screens.ds.unable_to_find_dataset_page')
        end
        return redirect_to destination_url
      end

    end

    etag = "#{dsmtime}-#{user}"
    ConditionalRequestHandler.set_etag(response, etag)
    ConditionalRequestHandler.set_cache_control_headers(response, @current_user.nil?)
    if @current_user.nil?
      if ConditionalRequestHandler.etag_matches_hash?(request, etag)
        render :nothing => true, :status => 304
        return true
      end
    end


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

    # If a user sticks .json or similar at the end of a URL, redirect them to the API endpoint
    if params[:format].present?
      return redirect_to(resource_url(
        { :id => @view.id, :format => params[:format] }.merge(params.except('controller')))
      )
    end

    @view.searchString = params[:q] if params[:q]

    @user_session = UserSession.new unless current_user

    if @row.nil?
      href = Proc.new { |params| view_path(@view.route_params.merge(params || {})) }
    else
      href = Proc.new { |params| view_row_path(@view.route_params.merge(row_id: @row['sid']).merge(params || {})) }
    end

    # See if it matches the canonical URL; if not, redirect
    unless request.path == href.call( locale: nil )
      # Log redirects in production
      if Rails.env.production? && request.path =~ /^\/dataset\/\w{4}-\w{4}/
        logger.info("Doing a dataset redirect from #{request.referrer}")
      end
      flash.keep

      locale = CurrentDomain.default_locale == I18n.locale.to_s ? nil : I18n.locale
      canonical_path = href.call(locale: locale)
      canonical_path += "?#{request.query_string}" unless request.query_string.empty?
      return redirect_to canonical_path
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

    # add parent information if this view is a child layer
    if @view.is_geospatial? && @view.metadata.geo['parentUid'].present?
      @view.geoParent = get_view(@view.metadata.geo['parentUid'])
      if @view.geoParent.nil?
        Rails.logger.error("Unable to fetch parent geo dataset #{@view.metadata.geo['parentUid']} from child layer #{@view.id}")
        flash.now[:error] = 'This layer has been dissociated from its parent geospatial dataset.'
        render 'shared/error', :status => :not_found
        return nil
      end
    end

    if FeatureFlags.derive(@view, request).swap_in_nbe_view === true && !@view.newBackend?
      begin
        @view.nbe_view_id = @view.nbe_view.id
        @view.default_ds_id = @view.parent_view.id
        needs_view_js @view.nbe_view.id, @view.nbe_view
        needs_view_js @view.parent_view.id, @view.parent_view
      rescue CoreServer::ResourceNotFound
        # Migration is missing; therefore there is no nbe view and this code block is irrelevant.
      end
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

    # Taken from `show` method, allows alt pages to have name expansions
    # /d/abcd-1234/alt  becomes:  /dataset/My-test-data/abcd-1234/alt

    href = Proc.new { |params| alt_view_path(@view.route_params.merge(params || {})) }

    # See if it matches the authoritative URL; if not, redirect
    unless request.path == href.call( locale: nil )
      # Log redirects in development
      if Rails.env.production? && request.path =~ /^\/dataset\/\w{4}-\w{4}/
        logger.info("Doing a dataset redirect from #{request.referrer}")
      end
      flash.keep
      return redirect_to "#{href.call}?#{request.query_string}"
    end

    @conditions = parse_alt_conditions(params)

    # build state for the sake of the pager
    @state_param = {}
    [:filter, :sort, :search_string].each{ |key| @state_param[key] = params[key] unless params[key].nil? }
    @state_param = @state_param.to_param

    if @view.is_tabular? && !@view.is_form?
      begin
        # get rows
        @per_page = 50
        @data, @viewable_columns, @aggregates, @row_count = @view.find_data(@per_page, @page, @conditions)
        @viewable_columns ||= []
      rescue CoreServer::CoreServerError => e
        case e.error_code
        when 'invalid_request'
          flash.now[:error] = e.error_message
          return (render 'shared/error', :status => :invalid_request)
        when 'permission_denied'
          return render_forbidden
        end
      end
    end

    @view.register_opening(request.referrer)
  end

  def flag_check
    @view = get_view(params[:id])
    return if @view.nil?

    respond_to do |format|
      format.data { render :json => FeatureFlags.derive(@view, request) }
    end
  end

# other actions
  def external
    view = View.find_external(params[:id])

    if !view.blank?
      redirect_to view_path(view[0])
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
    redirect_to alt_view_path(@result)
  end

  def modify_permission
    view = View.find(params[:id])
    view.set_permission(params[:permission_type])
    respond_to do |format|
      format.html { redirect_to alt_view_path(view) + '#sharing' }
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
      format.html { redirect_to(view_path(@view) + redirect_path) }
    end
  end

  def update_rating
    view = View.find(params[:id])
    view.update_rating(params[:starsRating].to_i * 20, params[:ratingType])

    respond_to do |format|
      format.html { redirect_to(view_path(view)) }
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

  def working_copy
    view = View.find(params[:id])
    unpub_ds = view.unpublished_dataset
    if unpub_ds.blank?
      # make copy
      unpub_ds = view.make_unpublished_copy
    end
    redirect_to alt_view_path(unpub_ds)
  end

  def publish
    view = View.find(params[:id])
    while !view.can_publish?
      sleep(10)
    end
    pub_ds = view.publish
    redirect_to alt_view_path(pub_ds)
  end

  def delete_working_copy
    view = View.find(params[:id])
    pub_ds = view.published_dataset
    view.delete
    redirect_to (pub_ds.nil? ? profile_index_path : alt_view_path(pub_ds))
  end

# end alt actions

  # This puzzlingly named method is the target for the route 'datasets/four-four/validate_contact_owner'
  # which sends an email to the dataset owner from 'About This Dataset' panel.
  # NOTE: Even though we're skipping the CSRF token verification, there is still the 'verify_captcha' test
  # before the 'respond_to' block, but without the CSRF token, this is our only protection.
  def validate_contact_owner
    @view = get_view(params[:id])
    return (render :nothing => true) if @view.nil?

    success = false
    # When CSRF token validation is skipped for this method (see skip_before_filter above), this
    # verify_recaptcha test is our only protection against abuse.
    if verify_recaptcha
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
          return (redirect_to alt_view_path(@view))
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

    return render_404 if (@view.is_published? && @view.is_blist?)

    unless @view.can_replace?
      return render_forbidden("You do not have permission to modify this dataset.")
    end
  end

  def edit_metadata
    @view = get_view(params[:id])
    return if @view.nil?
    if !params[:view].nil?
      begin
        if parse_attachments() && parse_meta(@view) && parse_external_sources() && parse_image()
          @view = View.update_attributes!(params[:id], params[:view])

          # if this is a data lens or standalone viz, update the inner metadata blob too
          # so that name/description changes aren't out of sync
          if @view.data_lens? || @view.standalone_visualization?
            metadata_update_url = "/views/#{params[:id]}.json"
            payload = {
              :displayFormat => @view.displayFormat.as_json.with_indifferent_access
            }

            if @view.standalone_visualization?
              vif = JSON.parse(payload[:displayFormat][:visualization_interchange_format_v1])
              vif['title'] = @view.name
              vif['description'] = @view.description || ''
              payload[:displayFormat][:visualization_interchange_format_v1] = JSON.dump(vif)
            elsif @view.data_lens?
              payload[:displayFormat][:data_lens_page_metadata][:name] = @view.name
              payload[:displayFormat][:data_lens_page_metadata][:description] = @view.description
            end

            CoreServer::Base.connection.update_request(metadata_update_url, JSON.dump(payload))
          end

          flash.now[:notice] = "The metadata has been updated."
        end
      rescue CoreServer::CoreServerError => e
        flash.now[:error] = "An error occurred during your request: #{e.error_message}"
      end
    end

    @isPublishedNBEView = @view.publicationStage == 'published' && @view.newBackend
  end

  def edit_rr
    @view = get_view(params[:id])
    return if @view.nil?

    if @current_user.nil? || !(@current_user.has_right?(UserRights::CREATE_DATASETS) &&
      @view.has_rights?(ViewRights::UPDATE_VIEW))
      return render_forbidden
    end
  end

  def thumbnail
    @view = get_view(params[:id])
    return if @view.nil?

    unless @view.has_rights?(ViewRights::UPDATE_VIEW)
      return render_forbidden
    end

    needs_view_js @view.id, @view
  end

  def stats
    @view = get_view(params[:id])
    return if @view.nil?

    if !(@view.user_granted?(current_user) || \
        CurrentDomain.user_can?(current_user, UserRights::EDIT_OTHERS_DATASETS))
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
    MetricQueue.instance.push_metric("views-downloaded-#{CurrentDomain.domain.id}", "view-#{params[:id]}")
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

  # Make sure that the url provided actually returns a layer of some kind.
  def verify_layer_url
    response = fetch_layer_info(params[:url])
    respond_to do |format|
      format.data { render :json => response.to_json }
    end
  end

  # Convert a wkt to a wkid.
  def wkt_to_wkid
    json = JSON.parse(Net::HTTP.get(
      URI("http://prj2epsg.org/search.json?mode=wkt&terms=#{CGI.escape params[:wkt]}")))
    respond_to do |format|
      format.data { render :json => json }
    end
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
        next if filter.try(:[], :operator).blank?
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
        next unless sort[:direction].respond_to? :to_str
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
      params[:view] = params[:view].fix_key_encoding if params && params[:view]
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
      new_feature_flags = {}
      if params[:view][:metadata].present?
        if params[:view][:metadata][:rdfClass] =~ /^_.*/
          params[:view][:metadata][:rdfClass] = nil
        end
        if params[:view][:metadata][:feature_flags].present?
          params[:view][:metadata][:feature_flags].keys.each do |flag|
            new_feature_flags[flag] = FeatureFlags.process_value(params[:view][:metadata][:feature_flags][flag]).to_s
          end
        else
          new_feature_flags = nil
        end
      end
      params[:view][:metadata] = (view.data['metadata'] || {}).
        deep_merge(params[:view][:metadata] || {})
      if new_feature_flags.nil?
        params[:view][:metadata].delete(:feature_flags)
      else
        params[:view][:metadata][:feature_flags] = new_feature_flags
      end
      if params[:view][:metadata][:custom_fields].present?
        params[:view][:metadata][:custom_fields].delete_if do |_, fieldset|
          fieldset.delete_if { |_, value| value.empty? }
          fieldset.empty?
        end
      end
      params[:view][:privateMetadata] = (view.data['privateMetadata'] || {}).
        deep_merge(params[:view][:privateMetadata] || {})
    end
    true
  end

  def parse_external_sources
    if params[:external_sources].present?
      additionalAccessPoints = []
      params[:external_sources].each do |source|
        title = source[:title]
        description = source[:description]
        entry = { :title => title, :description => description, :urls => {} }
        if source[:urls].present?
          source[:urls].each do |endpoint|
            extension = compute_extension(endpoint[:extension], endpoint[:url])
            if entry[:urls][extension].present?
              flash.now[:error] = I18n.t('screens.edit_metadata.multiple_extensions')
              return false
            end
            entry[:urls][extension] = endpoint[:url]
          end
        else
          extension = compute_extension(source[:extension], source[:name])
          entry[:urls][extension] = source[:name]
        end
        additionalAccessPoints.push(entry)
      end
      # Store the first accessPoints url as metadata accessPoint
      accessPoints = additionalAccessPoints[0][:urls] if additionalAccessPoints[0]
      params[:view][:metadata][:accessPoints] = accessPoints
      params[:view][:metadata][:additionalAccessPoints] = additionalAccessPoints
    else
      flash.now[:error] = I18n.t('screens.edit_metadata.missing_external_dataset')
      return false
    end
    true
  end

  # Helper to return a downcased extension if provided, else fallback to the URL extension
  def compute_extension(extension, url)
    (extension.present? ? extension : File.extname(url)[1..-1].to_s).downcase
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

  private

  def fetch_layer_info(layer_url)
    begin
      uri = URI.parse(URI.extract(layer_url).first)
      uri.query = "f=json"
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true if uri.scheme == 'https'
      layer_info = JSON.parse(http.get(uri.request_uri).body)
    rescue SocketError, URI::InvalidURIError, JSON::ParserError
      error = "url invalid"
    end
    error = 'url invalid' if layer_info && (layer_info['error'] \
                                          || !layer_info['spatialReference'])

    if error
      return { 'error' => error }
    else
      title = layer_info['documentInfo']['Title'] if layer_info['documentInfo']
      title = uri.path.slice(uri.path.index('services')+8..-1) if title.blank?

      layer = {}
      layer['text']  = "#{title} (#{uri.host})"
      layer['value'] = uri.to_s.sub /\?.*$/, ''
      layer['data']  = { 'type' => layer_info['tileInfo'] ? 'tile' : 'dynamic' }

      return layer
    end
  end

  def view_redirection_url
    #
    # ONCALL-2309
    #
    # On 2015-04-20 we became aware of a certain type of request that caused
    # Phidippides to decide core servers were dead when they were not, with
    # the eventual effect of it deciding that there were no core servers
    # available and therefore responding to legitimate metadata requests
    # with 500 errors.
    #
    # The cause was determined to be requests for federated datasets that
    # triggered malformed redirects to the 'official' dataset sources that in
    # turn caused circular redirects.
    #
    # In order to avoid these circular redirects while we are investigating
    # and deploying a more permanent solution, and because the commented-out
    # code below was already up for replacement with simpler logic, we are
    # temporarily forgoing the logic used to determine a redirect destination
    # that depends on a dataset's metadata.
    #
    # Instead, we will rely only on the presence or absence of a view's
    # migration and its old-back-end four-by-four.

    # dataset_metadata_response = phidippides.fetch_dataset_metadata(
    #   params[:id],
    #   :request_id => request_id,
    #   :cookies => forwardable_session_cookies
    # )

    # if dataset_metadata_response[:status] == '200'
    #   default_page = dataset_metadata_response.fetch(:body, {})[:defaultPage]
    # end

    # if default_page.present? && default_page_accessible?(default_page)
    #   return "/view/#{default_page}"
    # end

    begin
      obeId = @view.migrations['obeId']
    # This seems a little suspicious since other types of errors are not
    # handled elsewhere. As a result, we are changing the below line to
    # rescue all errors and then return '/' by default.
    #
    #rescue CoreServer::ResourceNotFound => ignored
    rescue => error
    end
    if obeId.present?
      return "/d/#{obeId}"
    end

    '/'
  end

  def default_page_accessible?(default_page)
    begin
      DataLensManager.new.fetch(default_page)
    rescue DataLensManager::ViewAccessDenied
      return false
    end

    true
  end

end
