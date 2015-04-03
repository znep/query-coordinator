class AngularController < ActionController::Base
  include ActionControllerExtensions
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include UnminifiedAssetsHelper

  class AuthenticationRequired < RuntimeError; end
  class UnauthorizedPageMetadataRequest < RuntimeError; end
  class PageMetadataNotFound < RuntimeError; end
  class UnauthorizedDatasetMetadataRequest < RuntimeError; end
  class DatasetMetadataNotFound < RuntimeError; end
  class UnknownRequestError < RuntimeError; end

  before_filter :hook_auth_controller

  helper_method :current_user
  helper_method :current_user_session_or_basic_auth

  layout 'angular'

  rescue_from ActionView::MissingTemplate do
    render :status => '400', :nothing => true, :content_type => 'text/html'
  end

  def serve_app
    raise 'The "app" parameter is required.' unless request[:app]

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
  end

  private

  def fetch_page_metadata(page_id)

    if inherit_catalog_lens_permissions?
      # Grab permissions from core.
      permissions = fetch_permissions_and_normalize_exceptions(page_id)
    end

    result = phidippides.fetch_page_metadata(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    if result[:status] != '200'
      case result[:status]
        when '401'
          raise AuthenticationRequired.new
        when '403'
          # Core returns a status code of 403 even if the actual intent of the
          # response is to indicate that authentication is required. For this
          # reason we need to check the 'code' property of the error response
          # body. The two relevant codes are:
          #
          # 'authentication_required' and
          # 'permission_denied'
          #
          # In the case of 'authentication_required' we want to redirect the
          # user to the login page. Otherwise we want to render a 403.
          #
          # Note that we only need to do this check when a page is public but
          # its underlying dataset is private.
          if /authentication_required/ =~ result[:body]
            raise AuthenticationRequired.new
          elsif /permission_denied/ =~ result[:body]
            raise UnauthorizedPageMetadataRequest.new
          else
            raise UnknownRequestError.new result[:body].to_s
          end
        when '404'
          raise PageMetadataNotFound.new
        else
          raise UnknownRequestError.new result[:body].to_s
      end
    end

    page_metadata = result[:body]

    if inherit_catalog_lens_permissions?
      page_metadata[:permissions] = permissions if page_metadata
    end

    page_metadata
  end

  def fetch_dataset_metadata(dataset_id)

    if inherit_catalog_lens_permissions?
      # Grab permissions from core.
      permissions = fetch_permissions_and_normalize_exceptions(dataset_id)
    end

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

    # This is temporary, but constitutes a rolling migration.
    # Eventually we can check that every extant dataset metadata
    # blob has a 'defaultPage' property and remove this migration
    # step.
    phidippides.migrate_dataset_metadata_to_v1(result)

    # Moving forward, we also compute and insert two card type mapping
    # properties on columns before we send them to the front-end.
    # This method call will check the metadata transition phase
    # internally and just pass through if it is not set to '3'.
    phidippides.set_default_and_available_card_types_to_columns!(result)

    dataset_metadata = result[:body]

    if inherit_catalog_lens_permissions?
      dataset_metadata[:permissions] = permissions if dataset_metadata && result[:status] =~ /^20[0-9]$/
    end

    add_table_column_to_dataset_metadata!(dataset_metadata)

    dataset_metadata
  end

  def fetch_pages_for_dataset(dataset_id)

    result = phidippides.fetch_pages_for_dataset(
      dataset_id,
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    if result[:status] != '200'
      case result[:status]
        when '401'
          raise AuthenticationRequired.new
        when '403'
          raise UnauthorizedDatasetMetadataRequest.new
        when '404'
          raise DatasetMetadataNotFound.new
        else
          raise UnknownRequestError.new result[:body].to_s
      end
    end

    result[:body]
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
