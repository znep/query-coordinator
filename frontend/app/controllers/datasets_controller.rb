class DatasetsController < ApplicationController
  include ApplicationHelper
  include DatasetsHelper
  include DataLensHelper
  include CommonMetadataMethods
  include ViewsHelper

  prepend_before_filter :check_chrome, :only => [:show, :alt]
  skip_before_filter :require_user, :only => [
    :show, :blob, :alt, :widget_preview, :contact, :validate_contact_owner, :contact_dataset_owner,
    :form_success, :external, :external_download, :download, :about, :create_visualization_canvas
  ]
  skip_before_filter :disable_frame_embedding, :only => [:form_success]
  # When CSRF token validation is skipped for this method (see skip_before_filter above), the
  # verify_recaptcha test in the 'create' method is our only protection against abuse.
  skip_before_filter :verify_authenticity_token,
    :if => lambda { |controller|
      controller.action_name == 'validate_contact_owner'
    }

  # collection actions
  def new
    unless CurrentDomain.user_can?(current_user, UserRights::CREATE_DATASETS) || CurrentDomain.module_enabled?(:community_creation)
      # User doesn't have access to create new datasets
      return render_forbidden('You do not have permission to create new datasets')
    end
    if FeatureFlags.derive(nil, request).enable_dataset_management_ui && params[:beta]
      @data_asset = params[:data_asset].nil? ? nil : params[:data_asset].downcase == "true"
      @il8n_prefix = @data_asset ? "dataset_management_ui.create.data_asset" : "dataset_management_ui.create.dataset"
      render 'datasets/new-dsmui', layout: 'styleguide'
    else
      render 'new' # jquery wizard
    end
  end

  def create
    view = View.create(
      :name => params[:new_dataset_name],
      :owner => current_user,
      :displayType => 'draft',
      :nbe => FeatureFlags.derive(nil, request).ingress_strategy == 'nbe'
    )

    respond_to do |format|
      format.html { redirect_to(view_path(view)) }
    end
  end

# member actions

  def show
    if params['$$store']
      @view = View.find_in_store(params[:id], params['$$store'])
    else
      @view = get_view(params[:id])
    end

    return if @view.nil?

    # adjust layout to thin versions (rather than '_full')
    @page_custom_header = 'header'
    @page_custom_footer = 'footer'
    @page_custom_chrome = ''
    @suppress_content_wrapper = true

    if enable_2017_grid_view_refresh_for_current_request?
      @render_styleguide_on_legacy_pages = true
    end

    # NBE/OBE redirect & flash messages
    if @view.new_backend? && !permitted_nbe_view?
      destination_url = view_redirection_url

      if show_nbe_redirection_warning?
        flash.now[:notice] = I18n.t('screens.ds.new_ux_nbe_warning', url: "<a href=#{destination_url}>#{destination_url}</a>").html_safe
      end

      if !is_superadmin?
        if FeatureFlags.derive(@view, request).disable_obe_redirection
          # EN-16067: even if OBE redirection is disabled,
          # still redirect to OBE if it's not an NBE-only dataset
          if has_nbe_migrations_entry?
            return redirect_to destination_url
          end
        else
          if destination_url == '/'
            flash.now[:notice] = I18n.t('screens.ds.unable_to_find_dataset_page')
          end
          return redirect_to destination_url
        end
      end
    end

    # Dataset landing page case
    return if render_as_dataset_landing_page

    # Visualization Canvas case
    return if render_as_visualization_canvas

    # Storyteller case
    return if render_as_story

    # OP Measures case
    return if render_as_op_measure

    # We're going to some version of the grid/classic viz page

    # Mobile case
    if is_mobile?
      return(redirect_to :controller => 'widgets', :action => 'show', :id => params[:id])
    end

    # TODO: Remove this after DSLP launch
    if @view.has_landing_page?
      display_dataset_landing_page_notice
    end

    user = @current_user.nil? ? 'ANONYMOUS' : @current_user.id

    etag = "#{@view.mtime_according_to_core}-#{user}-#{get_revision}"
    ConditionalRequestHandler.set_etag(response, etag)
    ConditionalRequestHandler.set_cache_control_headers(response, @current_user.nil?)
    unless current_user
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
      # EN-6285 - Address Frontend app Airbrake errors
      #
      # This fix wraps the pre-existing code so that we can rescue potential
      # CoreServerErrors leaking from @view.get_row and/or
      # @view.get_row_by_index and cut down on the number of non-actionable
      # exceptions that get sent to Airbrake.
      #
      # In this instance, we also assign nil to @row in case the behavior here
      # does not match what we expect based on testing using the Rails console.
      begin
        @row = !params[:row_id].nil? ?
          @view.get_row(params[:row_id]) :
          @view.get_row_by_index(params[:row_index])
      rescue CoreServer::CoreServerError
        @row = nil
      end

      if @row.nil?
        flash.now[:error] = 'This row cannot be found, or has been deleted.'
        render 'shared/error', :status => :not_found
        return nil
      end
    end

    # If a user sticks .json or similar at the end of a URL, redirect them to the API endpoint
    if params[:format].present?
      return redirect_to(resource_url({ :id => @view.id, :format => params[:format] }.
        merge(params.except('controller')).symbolize_keys))
    end

    @view.searchString = params[:q] if params[:q]

    @user_session = UserSessionProvider.klass.new unless current_user

    # See if the user is accessing the canonical URL; if not, redirect
    unless using_canonical_url?
      # when setting flash messages and redirectly to datasets#show, we fall through
      # here, so persist any previously set flash messages (like timeout errors from bootstrap)
      flash.keep
      return redirect_to canonical_path
    end

    # If we're displaying a single dataset, set the meta tags as appropriate.
    @meta[:title] = @meta['og:title'] = "#{@view.name} | #{get_site_title}"
    @meta[:description] = @meta['og:description'] = view_meta_description
    @meta['og:url'] = request.url.to_s

    display_name = @view.display.name.to_s
    page_name = display_name.split.map(&:capitalize).join(' ')
    @meta[:page_name] = page_name
    # TODO: when we support a dataset image, allow that here if of appropriate size

    @meta[:keywords] = view_meta_keywords

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

    # fake geo metadata if this view has been ingressed to NBE via API
    # but should behave as a normally-ingressed geo dataset (see EN-3889)
    if @view.is_api_geospatial?

      # attempt to get an extent for the data, falling back to nil if
      # the calculation query can't be processed for any reason
      begin
        # (this shouldn't fail because it's one of the is_api_geospatial? conditions)
        geo_column = (@view.columns || []).select do |column|
          column.dataTypeName =~ /(polygon|line|point)$/i
        end.first

        # the response is an array containing an extent object containing a multipolygon,
        # so we drill down into the nested structure and stringify opposing corners
        extent_response = get_extent({dataset_id: @view.id, field: geo_column.fieldName}, @view.rowsUpdatedAt)
        extent_coordinates = extent_response[:body][0][:extent][:coordinates][0][0]
        bbox = [extent_coordinates[0], extent_coordinates[2]].join(',')

        # (e.g. '-122.3099497,41.883846,-87.632322,47.601338')
        unless bbox =~ /^(-?\d+\.\d+,){3}-?\d+\.\d+$/
          raise "Malformed bbox generated from extent_response with body #{extent_response[:body]}"
        end
      rescue StandardError => ex
        Rails.logger.warn("Failed to calculate bbox for #{@view.id}: #{ex}")
        bbox = nil
      end

      @view.displayType = 'map'
      @view.metadata = Metadata.new({
        'geo' => {
          'bbox' => bbox,
          'bboxCrs' => 'EPSG:4326', # we always reproject to this reference system
          'isNbe' => true,
          'isApiGeospatial' => true,
          'layers' => @view.id, # "I'm my own grandpa..."
          'namespace' => "_#{@view.id}",
          'owsUrl' => "/api/geospatial/#{@view.id}"
        },
        'availableDisplayTypes' => %w(map table fatrow page),
        'renderTypeConfig' => { 'visible' => { 'map' => true } }
      }.deep_merge(@view.metadata.try(:data) || {}))
    end

    # add geo parent information if this view is a child layer
    if @view.is_geospatial? && !@view.metadata.nil? && @view.metadata['geo'].present? &&
       @view.metadata.geo['parentUid'].present?
      @view.geoParent = get_view(@view.metadata.geo['parentUid'])
      if @view.geoParent.nil?
        Rails.logger.error("Unable to fetch parent geo dataset #{@view.metadata.geo['parentUid']} from child layer #{@view.id}")
        flash.now[:error] = 'This layer has been dissociated from its parent geospatial dataset.'
        return render 'shared/error', :status => :not_found
      end
    end
  end

  def show_revision
    if dataset_management_page_enabled?
      @view = get_view(params[:id])
      return if @view.nil?
      unless using_canonical_url?
        flash.keep
        canonical_url = "#{canonical_path_proc.call}#{params[:rest_of_path]}"
        return redirect_to(canonical_url)
      end

      @websocket_token = DatasetManagementAPI.get_websocket_token(@view.id, cookies)

      render 'datasets/dataset_management_ui', :layout => 'styleguide'
    else
      render_404
    end
  end

  def current_revision
    if dataset_management_page_enabled?
      # ask dsmapi for the list of revisions
      open_revisions = DatasetManagementAPI.get_open_revisions(params[:id], cookies)
      if open_revisions.length > 0
        # get the first one and redirect to that path
        revision_seq = open_revisions.first['revision_seq']
        return redirect_to :action => 'show_revision', :revision_seq => revision_seq, :rest_of_path => params[:rest_of_path]
      end
    end
    return render_404
  end

  def blob
    @view = get_view(params[:id])
    respond_to do |format|
      format.data { render :partial => 'displays/blob' }
    end
  end

# alt actions
  def alt
    @view = get_view(params[:id])
    return if @view.nil?

    if !current_user && params[:force_login]
      return require_user(true)
    end

    # See if the user is accessing the canonical URL; if not, redirect
    unless using_canonical_url?
      return redirect_to canonical_path
    end

    @conditions = parse_alt_conditions(params)

    # EN-6665 - Prevent query strings with invalid column ids from 500ing
    #
    # See method implementation for why we do this.
    if request_includes_non_existent_column_ids
      return render_invalid
    end

    # EN-6665 - Prevent query strings with invalid column ids from 500ing
    #
    # See method implementation for why we do this one too.
    if request_includes_url_filter_value_on_unsupported_column
      return render_invalid
    end

    # build state for the sake of the pager
    @state_param = {}
    [:filter, :sort, :search_string].each{ |key| @state_param[key] = params[key] unless params[key].nil? }
    @state_param = @state_param.to_param

    if @view.is_tabular? && !@view.is_form?

      begin
        # get rows
        @per_page = 50
        @data, @viewable_columns, @aggregates, @row_count = @view.find_data(@per_page, @page, @conditions)
      rescue CoreServer::CoreServerError => e
        case e.error_code
        when 'invalid_request'
          flash.now[:error] = e.error_message
          return render_invalid
        when 'permission_denied'
          return render_forbidden
        else
          # Guarantee that this variable responds to the correct methods. =/
          # Lots of Airbrake noise is generated otherwise.
          @viewable_columns ||= []
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
      redirect_to view_path(view.first)
    else
      render_404
    end
  end

  def external_download
    view = View.find_external(params[:id])
    type = params[:type]

    if !view.blank? && !type.blank?
      redirect_to metric_redirect_path(:type => type.upcase, :id => view.first.id)
    else
      render_404
    end
  end

  def save_filter
    begin
      @view = View.find(params[:id])
    rescue
      flash.now[:error] = 'An error occurred processing your request. Please try again in a few minutes.'
      return render 'shared/error'
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
      return render 'shared/error'
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
    return if params[:emails].blank?

    @view = View.find(params[:id])

    recipients = params[:emails]  # Default is an Array of email addresses
    recipients = recipients.split(',') if recipients.is_a?(String) # Single field, comma separated
    recipients.map!(&:strip)

    @bad_addresses = {}
    recipients.each do |recipient|
      begin
        @view.email(recipient)
      rescue Exception => e
        @bad_addresses[recipient] = e
      end
    end
  end

  def append
    @view = View.find(params[:id])
    @error_type = @view.columns.any?{ |column| !column.flag?('hidden') && column.client_type.match(
      /(document|photo|location|nested_table)/) }
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
    return render :nothing => true if @view.nil?

    success = false
    # When CSRF token validation is skipped for this method (see skip_before_filter above), this
    # verify_recaptcha test is our only protection against abuse.
    if SocrataRecaptcha.valid(params['g-recaptcha-response'])
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
          return redirect_to alt_view_path(@view)
        else
          flash[:error] = 'Please fill in all fields'
          return redirect_to contact_dataset_path(@view)
        end
      end
      format.data { render :json => { :success => success } }
    end
  end

  # This method sends a request to Core's ViewsService#flag, which in turn sends an
  # email to either the view's contact email or the dataset owner if no contact email
  # is available. Like DatasetsController#validate_contact_owner, this validates the
  # form's recaptcha response and ensures that the response came from one of our domains.
  def contact_dataset_owner
    @view = get_view(params[:id])

    # Return early if we can't find this view
    if @view.nil?
      return render :json => {
        :success => false,
        :message => "Can't find view: #{params[:id]}"
      }, :status => :bad_request
    end

    # Return early if there are any missing params
    flag_params = {}
    keys = [:id, :type, :subject, :message, :from_address]
    keys.each do |key|
      if params[key].nil?
        return render :json => {
          :success => false,
          :message => "Missing key: #{key}"
        }, :status => :bad_request
      else
        flag_params[key] = params[key]
      end
    end

    # Return early if the Recaptcha response is invalid
    unless SocrataRecaptcha.valid(params[:recaptcha_response_token])
      return render :json => {
        :success => false,
        :message => 'Invalid Recaptcha'
      }, :status => :bad_request
    end

    # Pass the request on to Core to actually send the email
    @view.flag(flag_params)
    render :json => { :success => true }
  end

  def widget_preview
    @view = get_view(params[:id])
    return if @view.nil?

    @customization_id = params[:customization_id]
    @customization_id = CurrentDomain.default_widget_customization_id if @customization_id.blank?

    @suppress_chrome = true
    render :layout => 'plain'
  end

  def edit
    @view = get_view(params[:id])
    return if @view.nil?

    return if render_as_visualization_canvas(true)

    return if render_as_op_measure(true)

    return render_404 if @view.is_published? && @view.is_blist?

    unless @view.can_replace?
      return render_forbidden('You do not have permission to modify this dataset.')
    end
  end

  def edit_metadata
    @view = get_view(params[:id])
    return if @view.nil?

    if params[:view].present?
      begin
        if parse_attachments() && parse_meta(@view) && parse_external_sources() && parse_image()
          @view = ::View.update_attributes!(params[:id], params[:view])

          # if this is a data lens, update the inner metadata blob too so that name/description
          # changes aren't out of sync
          if @view.data_lens?
            metadata_update_url = "/views/#{params[:id]}.json"
            payload = {
              :displayFormat => @view.displayFormat.as_json.with_indifferent_access
            }

            payload[:displayFormat][:data_lens_page_metadata][:name] = @view.name
            payload[:displayFormat][:data_lens_page_metadata][:description] = @view.description

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

    needs_view_js(@view.id, @view)
  end

  def stats
    @view = get_view(params[:id])
    return if @view.nil?

    unless @view.can_see_stats?
      return render_forbidden
    end

    needs_view_js(@view.id, @view)
  end

  def form_success
    @suppress_chrome = true
    begin
      @view = ::View.find(params[:id])
    rescue
      # Do nothing; if there is no view, render a generic message
    end

    respond_to do |format|
      format.html { render(:layout => 'plain') }
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
    @meta[:page_name] = 'Classic Metadata'
    return if @view.nil?

    if dataset_landing_page_enabled? && view.has_landing_page?
      result = DatasetLandingPage.fetch_all(
        view,
        current_user,
        forwardable_session_cookies,
        request_id,
        request
      )

      @related_views = result[:related_views]
      @featured_content = result[:featured_content]
      @dataset_landing_page_view = result[:dataset_landing_page_view]

      RequestStore[:current_user] = current_user.try(:data)

      render 'dataset_landing_page', :layout => 'styleguide'

      return
    end

    @user_session = UserSessionProvider.klass.new unless current_user

    @page_custom_chrome = ''
    @suppress_content_wrapper = true
    @page_custom_header = 'header'
    @page_custom_footer = 'footer'
  end

  def create_visualization_canvas
    return render_404 unless visualization_canvas_enabled?

    @parent_view = get_view(params[:id])
    return if @parent_view.nil? # this will do an implicit render, apparently :(
    return render_404 unless @parent_view.blist_or_derived_view_but_not_data_lens?

    # EN-13491: If users reach endpoint OBE-4x4/visualization
    # they need to be re-routed to the NBE 4x4
    # because visualization_canvas is only applicable on NBE datasets
    if !@parent_view.new_backend?
      @parent_view = @parent_view.nbe_view rescue nil
      # if there is no nbe view, throw an internal error
      return render_500 if @parent_view.nil?
      return redirect_to create_visualization_canvas_path(id: @parent_view.id)
    end

    @view = @parent_view.new_visualization_canvas

    @body_classes = 'hide-site-chrome'
    @site_chrome_admin_header_options = {size: 'small'}
    @display_placeholder_edit_bar = true

    render 'visualization_canvas', :layout => 'styleguide'
  end

  # Poke spandex to create autocomplete results
  def setup_autocomplete
    response = PageMetadataManager.new.request_soda_fountain_secondary_index(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )
    status = response['status'].to_i rescue :no_content # "204 No Content"
    render text: nil, status: status
  end

  # Convert a wkt to a wkid.
  def wkt_to_wkid
    json = JSON.parse(Net::HTTP.get(URI("http://prj2epsg.org/search.json?mode=wkt&terms=#{CGI.escape params[:wkt]}")))
    respond_to do |format|
      format.data { render :json => json }
    end
  end

  protected

  def get_view(id)
    begin
      view = ::View.find(id)
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This dataset or view cannot be found, or has been deleted.'
      render 'shared/error', :status => :not_found
      return
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return
      elsif e.error_code == 'permission_denied'
        render_forbidden(e.error_message)
        return
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return
      end
    end

    if view.is_form? ? !view.can_add? : !view.can_read?
      render_forbidden('You do not have permission to view this dataset')
      return
    end

    view
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
        # EN-6285 - Address Frontend app Airbrake errors
        #
        # It appears that filter can sometimes be a non-object (maybe a number
        # or a string?) and this caused the expression filter.try(...) to raise
        # an error that eventually ended up in Airbrake. Based on the user
        # agents associated with these notifications, it appears that this code
        # path is usually executed as a result of a robot request.
        #
        # This change adds the 'rescue true' clause to the end of the line,
        # which I believe is consistent with the original intent of the code
        # (which I assume to be "skip things that we cannot process").
        next if filter.try(:[], :operator).blank? rescue true
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
        sorts.push(
          'ascending' => sort[:direction].downcase == 'ascending',
          'expression' => {
            'type' => 'column',
            'columnId' => sort[:field]
          }
        )
      end
      @conditions['orderBys'] = sorts unless sorts.empty?
    end
    # search params
    @conditions['searchString'] = params[:search_string] unless params[:search_string].blank?

    return @conditions
  end

  # EN-6665 - Prevent query strings with invalid values from 500ing
  #
  # If there are column ids in the query string that do not exist in the actual
  # view, then we should consider this request to be bogus and not bother
  # passing it along to Core Server.
  def request_includes_non_existent_column_ids
    column_ids_from_filter_condition = []
    column_ids_from_order_bys = []
    view_column_ids = []

    if @conditions['filterCondition']
      filter_condition_children = (@conditions.try(:dig, 'filterCondition', 'children') || [])

      column_ids_from_filter_condition = filter_condition_children.flat_map do |child|
        (child['children'] || []).map do |grandchild|
          grandchild.is_a?(Hash) ? grandchild['columnId'] : nil
        end.compact
      end.compact
    end

    if @conditions['orderBys']
      order_bys = @conditions['orderBys'].is_a?(Array) ? @conditions['orderBys'] : []
      column_ids_from_order_bys = order_bys.map do |order_by|
        order_by.is_a?(Hash) ? order_by.dig('expression', 'columnId') : nil
      end.compact
    end

    query_string_column_ids = column_ids_from_filter_condition.
      concat(column_ids_from_order_bys).
      map(&:to_i)

    view_column_ids = @view.columns.map {|column| column.id }

    # Subtraction on arrays is overloaded to act as the difference between
    # elements in the respective sets.
    #
    # If there are column ids in the query string that do not exist in the
    # dataset to which we are applying the filter/sort, we want to return
    # early and respond with a 400 error.
    (query_string_column_ids - view_column_ids).present?
  end

  # EN-6665 - Prevent query strings with invalid values from 500ing
  #
  # As of June 2016 we are receiving thousands of requests per day that
  # appear to be coming from bots inserting 'helpful' urls into form fields on
  # the datasets_controller#alt page. When such a url is pasted into a field
  # that maps to a filter condition for a non-text column, this causes Core
  # Server to fail to validate the filter condition.
  #
  # Since we already have sufficient information to determine if this will
  # happen before we make the Core Server request we can just skip the request
  # and immediately render a 400 error to the client.
  #
  # In the interests of not rewriting a bunch of validation code that already
  # exists in Core Server, however, this fix just detects filter conditions
  # that contains URLs and renders a 400 error if the user is attempting to
  # apply that filter condition to a non-text column (e.g. if a bot is filling
  # in form fields with urls indiscriminately).
  def request_includes_url_filter_value_on_unsupported_column
    # A url would not be outright invalid in the following types of columns.
    valid_column_types_for_url = ['text', 'html', 'url', 'dataset_link']

    if @conditions['filterCondition']
      filter_condition_children = (@conditions.try(:dig, 'filterCondition', 'children') || [])

      # Essentially all this code does is pair up column ids with filter values
      # but the level of nesting in the data structure makes it a little rough
      # to do so.
      column_ids_and_filter_values = filter_condition_children.flat_map do |child|
        column_id = (child['children'] || []).map do |grandchild|
          grandchild.is_a?(Hash) ? grandchild['columnId'] : nil
        end.compact.first

        filter_value = (child['children'] || []).map do |grandchild|
          grandchild.is_a?(Hash) && grandchild['type'] == 'literal' ? grandchild['value'] : nil
        end.compact.first

        { 'column_id' => column_id, 'filter_value' => filter_value }
      end.compact

      # Once we know which filter values are associated with which columns, we
      # can check if things that look like URLs are not being supplied as
      # filter values for non-text columns. If they are, then there is a good
      # enough chance that this is a spamming attempt by a bot that we are
      # willing to preemptivly respond with a 400 error before asking Core
      # Server to attempt to do the filtering operation.
      column_ids_and_filter_values.select do |column_id_and_filter_value|
        column = @view.column_by_id(column_id_and_filter_value['column_id'].to_i)
        column_type = column.dataTypeName

        filter_value_contains_url = column_id_and_filter_value['filter_value'] =~ /http(s?):\/\//i

        # If the column's type is not one of the ones that can contain strings
        # and the filter value looks like a URL, we want to quit early and
        # respond with a 400 error.
        valid_column_types_for_url.exclude?(column_type) && filter_value_contains_url ? true : nil
      end.any?
    end
  end

  def file_extension(url)
    base = url[/\.([^\.\/]+)$/]
    base[1..-1] if base
  end

  def parse_meta(view)
    if !view.metadata.nil?
      new_feature_flags = {}
      if params[:view][:metadata].present?
        if params[:view][:metadata][:rdfClass] =~ /^_.*/
          params[:view][:metadata][:rdfClass] = nil
        end
        if params[:view][:metadata][:feature_flags].present?
          params[:view][:metadata][:feature_flags].keys.each do |flag|
            new_feature_flags[flag] = Signaller::Utils.process_value(params[:view][:metadata][:feature_flags][flag]).to_s
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
        entry = {}
        entry[:title] = source[:title] if source[:title].present?
        entry[:description] = source[:description] if source[:description].present?
        entry[:describedBy] = source[:describedBy] if source[:describedBy].present?
        entry[:describedByType] = source[:describedByType] if source[:describedByType].present?
        entry[:urls] = {}
        if source[:urls].present?
          source[:urls].select { |source_url| source_url[:url].present? }.each do |endpoint|
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
        additionalAccessPoints << entry unless entry[:urls].empty?
      end
      if additionalAccessPoints.blank?
        flash.now[:error] = I18n.t('screens.edit_metadata.missing_external_dataset')
        return false
      else
        # Store the first accessPoints url hash as metadata accessPoint
        accessPoints = additionalAccessPoints[0][:urls]
        params[:view][:metadata][:accessPoints] = accessPoints
        params[:view][:metadata][:additionalAccessPoints] = additionalAccessPoints
      end
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

  # NOTE: canonical paths are only defined for the DSLP and data views
  # (including row and alt views)
  # NOTE: this method relies on external state (@view, @row)
  def canonical_path_proc
    Proc.new do |options|
      composite_params = @view.route_params
      composite_params.merge!(row_id: @row[':id'] || @row['sid']) unless @row.nil?
      composite_params.merge!(options || {})

      if @row
        view_row_path(composite_params)
      elsif request.path =~ /\/alt$/
        alt_view_path(composite_params)
      elsif request.path =~ /\/data$/
        data_grid_path(composite_params)
      elsif request.path =~ /\/revisions/
        show_revision_path(composite_params)
      else
        view_path(composite_params)
      end
    end
  end

  def canonical_path(with_query_string = true)
    path = canonical_path_proc.call(locale: current_locale)
    if with_query_string
      path << "?#{request.query_string}" unless request.query_string.empty?
    end
    path
  end

  def permitted_nbe_view?
    # NBE geospatial views
    if @view.is_geospatial?
      Rails.logger.info("Not redirecting to OBE for geospatial dataset #{@view.id}")
      return true
    end

    # NBE geospatial views ingressed via API (see EN-3889)
    if @view.is_api_geospatial?
      Rails.logger.info("Not redirecting to OBE for API-ingressed geospatial dataset #{@view.id}")
      return true
    end

    # Visualization Canvases
    if @view.visualization_canvas?
      Rails.logger.info("Not redirecting to OBE for visualization canvas #{@view.id}")
      return true
    end

    false
  end

  def has_nbe_migrations_entry?
    begin
      nbe_migrations_entry = @view.migrations
      return true
    rescue CoreServer::ResourceNotFound
      return false
    end
  end

  def view_redirection_url

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

  # TODO: Move this method somewhere more appropriate.
  def soda_fountain
    @soda_fountain ||= SodaFountain.new(path: '/resource')
  end

  # TODO: Move this method somewhere more appropriate.
  def get_extent(options, data_validity_timestamp)
    # Caching strategy: regenerate on demand when the underlying data changes,
    # once a day at minimum.
    # data_validity_timestamp should be seconds since epoch.
    cache_key = [
      'extent',
      data_validity_timestamp,
      options.fetch(:dataset_id),
      options.fetch(:field)
    ].join('.')

    Rails.cache.fetch(cache_key, expires_in: 1.day, race_condition_ttl: 15.seconds) do
      soda_fountain.get_extent(options)
    end
  end

  def using_canonical_url?
    request.path.starts_with(canonical_path_proc.call(locale: nil))
  end

  def render_as_dataset_landing_page
    # Propagate the SF geo hack a little bit further (EN-15802).
    return false if view.is_api_geospatial?

    if dataset_landing_page_enabled? && view.has_landing_page? && !params[:bypass_dslp]
      # See if the user is accessing the canonical URL; if not, redirect
      unless using_canonical_url?
        redirect_to canonical_path
        return true
      end

      result = DatasetLandingPage.fetch_all(
        view,
        current_user,
        forwardable_session_cookies,
        request_id,
        request
      )

      @related_views = result[:related_views]
      @featured_content = result[:featured_content]
      @dataset_landing_page_view = result[:dataset_landing_page_view]

      RequestStore[:current_user] = current_user.try(:data)

      render 'dataset_landing_page', :layout => 'styleguide'
      true
    end
  end

  def render_as_visualization_canvas(as_edit = false)
    # The page will momentarily render in view mode, even if as_edit is true, and
    # setting the @site_chrome_admin_header_options @body_classes variables below is to make
    # the transition look less jarring.
    if as_edit
      @site_chrome_admin_header_options = {size: 'small'}
      @body_classes = "hide-site-chrome"
    end

    if visualization_canvas_enabled? && @view.visualization_canvas?
      # See if the user is accessing the canonical URL; if not, redirect
      unless using_canonical_url?
        if as_edit
          redirect_to "#{canonical_path}/edit"
        else
          redirect_to canonical_path
        end
        return true
      end

      # Fetch parent view
      @parent_view = @view.parent_view
      return false if @parent_view.nil?

      @display_placeholder_edit_bar = false

      render 'visualization_canvas', :layout => 'styleguide'
      true
    elsif !visualization_canvas_enabled? && @view.visualization_canvas?
      # Return a 404 if they're trying to reach a visualization canvas and the feature flag is off
      render_404
      true
    else
      false
    end
  end

  def render_as_story
    if @view.story?
      redirect_to story_url(@view)
      true
    else
      false
    end
  end

  def render_as_op_measure(as_edit = false)
    # The page will momentarily render in view mode, even if as_edit is true, and
    # setting the @site_chrome_admin_header_options @body_classes variables below is to make
    # the transition look less jarring.
    return false unless @view.op_measure?

    if op_standalone_measures_enabled?
      # See if the user is accessing the canonical URL; if not, redirect
      unless using_canonical_url?
        if as_edit
          redirect_to "#{canonical_path}/edit"
        else
          redirect_to canonical_path
        end
        return true
      end

      @edit_mode = as_edit

      render 'op_measure', :layout => 'styleguide'
    else
      render_404
    end

    true
  end
end
