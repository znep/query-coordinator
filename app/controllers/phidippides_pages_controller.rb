class PhidippidesPagesController < ApplicationController
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods

  # TODO: We need to plumb our code through to support csrf token verification
  skip_before_filter :verify_authenticity_token
  # Some of these functions will return publicly-accessible data
  skip_before_filter :require_user, :only => [:show]

  helper :all # include all helpers, all the time

  helper_method :current_user
  helper_method :current_user_session

  hide_action :current_user, :current_user_session

  def index
    render :nothing => true, :status => '403'
  end

  def show
    return render :nothing => true, :status => '406' unless request.format.to_s == 'application/json'
    return render :nothing => true, :status => '400' unless params[:id].present?

    if inherit_catalog_lens_permissions?
      # Inherit the permissions from the catalog entry that points to this page.
      begin
        permissions = fetch_permissions(params[:id])
      rescue NewViewManager::ViewNotFound
        return render :nothing => true, :status => '404'
      rescue NewViewManager::ViewAuthenticationRequired => error
        return render :json => {error: error.message}, :status => '401'
      rescue NewViewManager::ViewAccessDenied => error
        return render :json => {error: error.message}, :status => '403'
      rescue => error
        message = "Unknown error while fetching permissions for pageId #{params[:id]}: #{error}"
        Rails.logger.error(message)
        Airbrake.notify(
          error,
          :error_class => 'PermissionRetrieval',
          :error_message => message
        )
        return render :nothing => true, :status => '500'
      end
    end

    begin
      result = phidippides.fetch_page_metadata(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      page_metadata = result[:body]

      # Also add the permissions
      page_metadata[:permissions] = permissions if page_metadata && result[:status] =~ /^20[0-9]$/

      render :json => page_metadata, :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def create
    return render :nothing => true, :status => '401' unless can_update_metadata? && save_as_enabled?

    begin
      page_metadata = json_parameter(:pageMetadata)
    rescue CommonMetadataTransitionMethods::UserError => error
      return render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue CommonMetadataTransitionMethods::UnacceptableError => error
      return render :json => { :body => "Error: #{error}" }, :status => '406'
    end

    begin
      result = page_metadata_manager.create(
        page_metadata,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    rescue Phidippides::NoDatasetIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue Phidippides::NoCardsException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue NewViewManager::NewViewNotCreatedError => error
      message = "Core error creating catalog lens request ID #{request_id}: #{error}"
      Rails.logger.error(message)
      Airbrake.notify(
        e,
        :error_class => 'NewViewCreation',
        :error_message => message
      )
      render :nothing => true, :status => '500'
    end
  end

  def update
    return render :nothing => true, :status => '401' unless can_update_metadata?

    begin
      page_metadata = json_parameter(:pageMetadata)
    rescue CommonMetadataTransitionMethods::UserError => error
      return render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue CommonMetadataTransitionMethods::UnacceptableError => error
      return render :json => { :body => "Error: #{error}" }, :status => '406'
    end

    # Support legacy API where the pageId is specified in the json body as well.
    page_id = page_metadata.fetch(:pageId, false)
    if page_id
      if page_id != params[:id]
        # Something fishy is going on - hitting the REST endpoint for one page id, but putting
        # another in the payload to update? That's a no-no.
        return render :json => {
          :body => "Error: pageId in json body must match endpoint: #{page_id} vs #{params[:id]}"
        }, :status => '406'
      end
    else
      page_metadata[:pageId] = params[:id]
    end

    begin
      result = page_metadata_manager.update(
        page_metadata,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    rescue Phidippides::NoDatasetIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue Phidippides::NoPageIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    end
  end

  def destroy
    # Temporary, used to prevent deletion until we are confident
    # this will behave as expected.
    return render :nothing => true, :status => '403'

    return render :nothing => true, :status => '403' unless metadata_transition_phase_2?
    return render :nothing => true, :status => '401' unless can_update_metadata?
    return render :nothing => true, :status => '405' unless request.delete?
    return render :nothing => true, :status => '400' unless params[:id].present?

    # TODO: when we re-enable deletion, make sure to handle error cases here.
    new_view_manager.delete(params[:id])

    begin
      result = phidippides.delete_page_metadata(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  private

  def dataset
    View.find(json_parameter(:pageMetadata)['datasetId'])
  end

  def save_as_enabled?
    FeatureFlags.derive(nil, request)[:enable_data_lens_save_as_button]
  end
end
