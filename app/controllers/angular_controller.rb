class AngularController < ActionController::Base
  include ActionControllerExtensions
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include UnminifiedAssetsHelper

  before_filter :hook_auth_controller

  helper_method :current_user
  helper_method :current_user_session_or_basic_auth

  helper :data_lens

  layout 'angular'

  def data_lens
    raise 'The "app" parameter is required.' unless request[:app]

    # If we're reaching the data lens page via an SEO-friendly URL,
    # ensure that we end up on the canonical (SEO-friendly) URL.
    # Uses the same basic technique as DatasetsController#show.
    unless request.path =~ %r'/view/\w{4}-\w{4}'
      begin
        view = View.find(params[:id])
        href = Proc.new { |params| view_path(view.route_params.merge(params || {})) }
        unless request.path == href.call(locale: nil)
          locale = CurrentDomain.default_locale == I18n.locale.to_s ? nil : I18n.locale
          canonical_path = href.call(locale: locale)
          canonical_path += "?#{request.query_string}" unless request.query_string.empty?
          return redirect_to canonical_path
        end
      rescue
        # pass — if we weren't able to find the view, let the existing workflow
        # handle the error propagation correctly. We shouldn't ever hit an error
        # because the SEO-friendly URLs are gated by a constraint that verifies
        # the existence of an appropriate view; this is an abundance of caution.
      end
    end

    # First fetch the current user's profile.
    @current_user = current_user

    # Then fetch the page metadata.
    begin
      @page_metadata = fetch_page_metadata(params[:id])
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedPageMetadataRequest
      return render_403
    rescue PageMetadataNotFound
      return render_404
    rescue UnknownRequestError => error
      error_class = 'PageMetadataRequestFailure'
      error_message = "Could not serve app: encountered unknown error " \
        "fetching page metadata for page id #{params[:id]}: #{error.to_s}"
      report_error(error_class, error_message)
      return render_500
    end

    # Then ensure that there is a dataset id.
    unless @page_metadata[:datasetId].present?
      error_class = 'NoDatasetId'
      error_message = "Could not serve app: page metadata does not include " \
        "a dataset id: #{@page_metadata.inspect}"
      report_error(error_class, error_message)
      return render_500
    end

    # Then fetch the dataset metadata.
    begin
      @dataset_metadata = fetch_dataset_metadata(@page_metadata[:datasetId])
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest
      return render_403
    rescue DatasetMetadataNotFound
      return render_404
    rescue UnknownRequestError => error
      error_class = 'DatasetMetadataRequestFailure'
      error_message = "Could not serve app: encountered unknown error " \
        "fetching dataset metadata for dataset id " \
        "#{@page_metadata[:datasetId]}: #{error.to_s}"
      report_error(error_class, error_message)
      return render_500
    end

    # Finally fetch the dataset's pages.
    begin
      @dataset_metadata[:pages] = fetch_pages_for_dataset(@page_metadata[:datasetId])
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest
      return render_403
    rescue DatasetMetadataNotFound
      return render_404
    rescue UnknownRequestError => error
      error_class = 'PagesForDatasetRequestFailure'
      error_message = "Could not serve app: encountered unknown error " \
        "fetching pages for dataset with id " \
        "#{@page_metadata[:datasetId]}: #{error.to_s}"
      report_error(error_class, error_message)
      return render_500
    end

    # Fetch migration info to get mapping from nbe to obe for skipLinks
    @migration_info = {}
    begin
      @migration_info = View.migrations(@page_metadata[:datasetId])
    rescue CoreServer::CoreServerError => error
      return render_403 if error.error_code == 'permission_denied'
    rescue
    end

    @domain_metadata = domain_metadata
  end

  def visualization_add

    dataset_id = params['datasetId']

    # First fetch the current user's profile.
    # NOTE: The call to `current_user` is side-effecty and if we do
    # not 'initialize' the frontend by calling this then future calls
    # made by CoreServer will fail.
    @current_user = current_user

    # Can't render add card without a dataset
    if dataset_id.empty?
      error_class = 'DatasetMetadataRequestFailure'
      error_message = "Could not serve app: dataset_id is required."
      report_error(error_class, error_message)
      return render_500
    end

    # Fetch dataset metadata
    begin
      # Find all standalone visualizations based on this dataset
      related_views = View.find(dataset_id).find_related(1, 1000)
      related_standalone_visualizations = related_views.select do |view|
        view.displayType == 'data_lens_chart' || view.displayType == 'data_lens_map'
      end

      # Map all standalone visualizations to synthetic Page metadata
      standalone_visualization_manager = StandaloneVisualizationManager.new
      @related_visualizations = related_standalone_visualizations.map do |view|
        vif = JSON::parse(view.displayFormat.visualization_interchange_format_v1).with_indifferent_access
        standalone_visualization_manager.page_metadata_from_vif(vif, dataset_id, {})
      end

      @dataset_metadata = fetch_dataset_metadata(dataset_id)
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest
      return render_403
    rescue DatasetMetadataNotFound
      return render_404
    rescue UnknownRequestError => error
      error_class = 'DatasetMetadataRequestFailure'
      error_message = "Could not serve app: encountered unknown error " \
        "fetching dataset metadata for dataset id " \
        "#{dataset_id}: #{error}"
      report_error(error_class, error_message)
      return render_500
    end
  end

  private

  def fetch_page_metadata(page_id)
    begin
      page_metadata_manager.show(
        page_id,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
    rescue NewViewManager::ViewAuthenticationRequired
      raise AuthenticationRequired.new
    rescue NewViewManager::ViewAccessDenied
      raise UnauthorizedPageMetadataRequest.new
    rescue NewViewManager::ViewNotFound
      raise PageMetadataNotFound.new
    rescue => error
      raise UnknownRequestError.new error.to_s
    end
  end

  def fetch_dataset_metadata(dataset_id)

    # Grab permissions from core.
    permissions = fetch_permissions_and_normalize_exceptions(dataset_id)

    result = phidippides.fetch_dataset_metadata(
      dataset_id,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    if result[:status] != '200'
      case result[:status]
        when '401'
          raise AuthenticationRequired.new
        when '403'
          raise UnauthorizedPageMetadataRequest.new
        when '404'
          raise DatasetMetadataNotFound.new
        else
          raise UnknownRequestError.new result[:body].to_s
      end
    end

    # Moving forward, we also compute and insert two card type mapping
    # properties on columns before we send them to the front-end.
    # This method call will check the metadata transition phase
    # internally and just pass through if it is not set to '3'.
    phidippides.set_default_and_available_card_types_to_columns!(result)

    dataset_metadata = result[:body]
    dataset_metadata[:permissions] = permissions if dataset_metadata && result[:status] =~ /\A20[0-9]\z/

    add_table_column_to_dataset_metadata!(dataset_metadata)

    flag_subcolumns!(dataset_metadata[:columns])

    dataset_metadata
  end

  def fetch_permissions_and_normalize_exceptions(resource_id)
    begin
      fetch_permissions(resource_id)
    rescue NewViewManager::ViewAuthenticationRequired
      raise AuthenticationRequired.new
    rescue NewViewManager::ViewAccessDenied
      raise UnauthorizedPageMetadataRequest.new
    rescue NewViewManager::ViewNotFound
      raise PageMetadataNotFound.new
    rescue => error
      raise UnknownRequestError.new error.to_s
    end
  end

  def add_table_column_to_dataset_metadata!(dataset_metadata)
    table_column = {
      :availableCardTypes => ['table'],
      :defaultCardType => 'table',
      :name => 'Data Table',
      :description => '',
      :fred => '*',
      :physicalDatatype => '*'
    }
    dataset_metadata[:columns]['*'] = table_column

    dataset_metadata
  end

  def redirect_to_login
    session[:return_to] = request.fullpath
    redirect_to '/login?referer_redirect=1', :status => 301
  end

  def report_error(error_class, error_message)
    Airbrake.notify(
      :error_class => error_class,
      :error_message => error_message
    )
    Rails.logger.error(error_message)
  end
end
