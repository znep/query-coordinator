class DataLensController < ActionController::Base

  include CommonMetadataMethods
  include ApplicationHelper
  include ActionControllerExtensions
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include UnminifiedAssetsHelper

  before_filter :hook_auth_controller
  before_filter :set_locale
  before_filter :redirect_to_mobile, :only => :data_lens
  before_filter :preload_metadata, :only => [:data_lens, :show_mobile]

  helper_method :current_user
  helper_method :current_user_session_or_basic_auth
  helper_method :current_user_session

  hide_action :current_user, :current_user_session

  # TODO: We need to plumb our code through to support csrf token verification
  skip_before_filter :verify_authenticity_token

  helper :all # include all helpers, all the time

  layout 'angular'

  def initiate_region_coding
    begin
      dataset_id = params[:datasetId]
      shapefile_id = params[:shapefileId]
      source_column = params[:sourceColumn]

      raise ArgumentError.new('datasetId must be a string') unless dataset_id.respond_to?(:to_str)
      raise ArgumentError.new('shapefileId must be a string') unless shapefile_id.respond_to?(:to_str)
      raise ArgumentError.new('sourceColumn must be a string') unless source_column.respond_to?(:to_str)

      job_id = region_coder.initiate(
        dataset_id,
        shapefile_id,
        source_column,
        :cookies => forwardable_session_cookies
      )

      status = :ok
      result = {
        :success => true,
        :jobId => job_id
      }
    rescue ArgumentError => exception
      status = :bad_request
      result = {
        :success => false,
        :error => exception.message
      }
    rescue Services::DataLens::RegionCoder::CuratedRegionNotFound => exception
      status = :not_found
      result = {
        :success => false,
        :error => "Curated region not found for region #{params[:shapefileId]}: #{exception.message}"
      }
    rescue => exception
      status = :internal_server_error
      result = {
        :success => false,
        :error => exception.message
      }
    end

    render :json => result, :status => status
  end

  def region_coding_status

    # Initialize session
    current_user

    begin
      dataset_id = params[:datasetId]
      shapefile_id = params[:shapefileId]
      job_id = params[:jobId]

      raise ArgumentError.new('datasetId must be a string') unless dataset_id.respond_to?(:to_str)

      if shapefile_id.present?
        job_status = region_coder.get_status_for_region(
          dataset_id,
          shapefile_id,
          :cookies => forwardable_session_cookies,
          :request_id => request_id
        )
      elsif job_id.present?
        job_status = region_coder.get_status_for_job(
          dataset_id,
          job_id,
          :cookies => forwardable_session_cookies
        )
      else
        raise ArgumentError.new('Either shapefile_id or job_id must be provided')
      end

      success = job_status['progress']['english'] != 'failed'
      status = success ? :ok : :internal_server_error
      result = {
        :success => success,
        :status => job_status['progress']['english'],
        :details => job_status['english'],
        :data => job_status['data']
      }

      # Also send dataset metadata containing new computed column info if job was successful
      if success && result[:status] == 'completed'
        result[:datasetMetadata] = job_status[:datasetMetadata] || fetch_dataset_metadata(dataset_id)
      end
    rescue ArgumentError => exception
      status = :bad_request
      result = {
        :success => false,
        :error => exception.message
      }
    rescue => exception
      status = :internal_server_error
      result = {
        :success => false,
        :error => exception.message
      }
    end

    render :json => result, :status => status
  end

  def show_mobile
    render 'mobile/datalens/show', :layout => 'layouts/mobile'
  end

  def region_coder
    @region_coder ||= Services::DataLens::RegionCoder.new
  end

  def redirect_to_mobile
    if is_data_lens_mobile_redirect_enabled? && is_mobile?
      redirect_to "#{request.path}/mobile"
    end
  end

  def preload_metadata
    # First fetch the current user's profile.
    current_user

    # If we're reaching the data lens page via an SEO-friendly URL,
    # ensure that we end up on the canonical (SEO-friendly) URL.
    # Uses the same basic technique as DatasetsController#show.
    unless request.path =~ %r'/view/\w{4}-\w{4}'
      begin
        view = View.find(params[:id])
        href = Proc.new { |params| view_path(view.route_params.merge(params || {})) }
        unless request.path.gsub(/\/mobile$/, '') == href.call(locale: nil)
          locale = CurrentDomain.default_locale == I18n.locale.to_s ? nil : I18n.locale
          canonical_path = href.call(locale: locale)
          canonical_path += '/mobile' if request.path =~ %r'/mobile$'
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
  end

  def data_lens
    raise 'The "app" parameter is required.' unless request[:app]
  end

  def view_vif
    parsed_vif = params[:vif].with_indifferent_access

    # First fetch the current user's profile.
    current_user

    @page_metadata = page_metadata_manager.page_metadata_from_vif(
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
  end

  def visualization_add
    dataset_id_param = params['datasetId']

    # First fetch the current user's profile.
    # NOTE: The call to `current_user` is side-effecty and if we do
    # not 'initialize' the frontend by calling this then future calls
    # made by CoreServer will fail.
    current_user

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

  def is_data_lens_mobile_redirect_enabled?
    FeatureFlags.derive(nil, request).enable_data_lens_mobile_redirect
  end
end
