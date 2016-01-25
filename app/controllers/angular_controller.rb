class AngularController < ActionController::Base
  include ActionControllerExtensions
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include UnminifiedAssetsHelper

  before_filter :hook_auth_controller
  before_filter :set_locale

  helper_method :current_user
  helper_method :current_user_session_or_basic_auth

  helper :data_lens

  layout 'angular'

  def data_lens
    raise 'The "app" parameter is required.' unless request[:app]

    # First fetch the current user's profile.
    @current_user = current_user

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

    # Then fetch the page metadata.
    begin
      @page_metadata = fetch_page_metadata(params[:id])
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest, UnauthorizedPageMetadataRequest
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
    rescue UnauthorizedDatasetMetadataRequest, UnauthorizedPageMetadataRequest
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
    rescue UnauthorizedDatasetMetadataRequest, UnauthorizedPageMetadataRequest
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
    @migration_metadata = {}
    begin
      @migration_metadata = View.migrations(@page_metadata[:datasetId])
    rescue CoreServer::CoreServerError => error
      return render_403 if error.error_code == 'permission_denied'
    rescue
    end

    @domain_metadata = domain_metadata
  end

  def view_vif
    parsed_vif = params[:vif].with_indifferent_access

    # First fetch the current user's profile.
    @current_user = current_user

    @page_metadata = StandaloneVisualizationManager.new.page_metadata_from_vif(
        parsed_vif, nil, nil)

    # Then ensure that there is a dataset id.
    unless @page_metadata[:datasetId].present?
      error_class = 'NoDatasetId'
      error_message = "Could not serve app: page metadata does not include " \
        "a dataset id: #{@page_metadata.inspect}"
      report_error(error_class, error_message)
      return render_500
    end

    begin
      @dataset_metadata = fetch_dataset_metadata(@page_metadata[:datasetId])
    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest, UnauthorizedPageMetadataRequest
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

    @domain_metadata = domain_metadata
  end

  def visualization_add
    dataset_id_param = params['datasetId']

    # First fetch the current user's profile.
    # NOTE: The call to `current_user` is side-effecty and if we do
    # not 'initialize' the frontend by calling this then future calls
    # made by CoreServer will fail.
    @current_user = current_user

    # Can't render add card without a dataset
    if dataset_id_param.blank?
      error_class = 'DatasetMetadataRequestFailure'
      error_message = "Could not serve app: dataset_id is required."
      report_error(error_class, error_message)
      return render_500
    end

    @migration_metadata = {}
    begin
      @migration_metadata = View.migrations(dataset_id_param)
    rescue CoreServer::CoreServerError => error
      return render_403 if error.error_code == 'permission_denied'
    rescue
    end

    # Fetch dataset metadata
    begin
      view = View.find(dataset_id_param)

      all_backend_views = [
        view.nbe_view, # Require this (data lens won't work otherwise).
        view.obe_view # Optional, dataset might be nbe only.
      ].compact

      @dataset_metadata = fetch_dataset_metadata(view.nbe_view.id)

      # Grab related views for both potential copies of dataset (nbe and obe).
      related_views = all_backend_views.map do |view|
        view.find_related(1, 1000)
      # Filter out data lenses, data lense charts and data lens maps.
      end.flatten

      # Select only those related views that are visualizations and not
      # data lens visualizations (we do not currently allow the selecton
      # of these in the 'add visualization' workflow). Also deduplicate.
      related_visualizations = related_views.select do |related_view|
        related_view.visualization? && !related_view.standalone_visualization?
      end.uniq(&:id)

      # Finally, convert each related visualization to a format that the JS can consume.
      @related_visualizations = related_visualizations.map(&:to_visualization_embed_blob)

    rescue AuthenticationRequired
      return redirect_to_login
    rescue UnauthorizedDatasetMetadataRequest, UnauthorizedPageMetadataRequest
      return render_403
    rescue DatasetMetadataNotFound
      return render_404
    rescue UnknownRequestError => error
      error_class = 'DatasetMetadataRequestFailure'
      error_message = "Could not serve app: encountered unknown error " \
        "fetching dataset metadata for dataset id " \
        "#{dataset_id_param}: #{error}"
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
    rescue DataLensManager::ViewAuthenticationRequired
      raise AuthenticationRequired.new
    rescue DataLensManager::ViewAccessDenied
      raise UnauthorizedPageMetadataRequest.new
    rescue DataLensManager::ViewNotFound
      raise PageMetadataNotFound.new
    rescue => error
      raise UnknownRequestError.new error.to_s
    end
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

  # EN-1111: Force Data Lens to always use English
  def set_locale
    I18n.locale = 'en'
  end
end
