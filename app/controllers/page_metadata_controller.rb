class PageMetadataController < ApplicationController
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods
  include ApplicationHelper

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
    return render :nothing => true, :status => '400' unless params[:id].present?

    begin
      page_metadata = page_metadata_manager.show(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => page_metadata, :status => '200'
    rescue DataLensManager::ViewNotFound
      return render :nothing => true, :status => '404'
    rescue DataLensManager::ViewAuthenticationRequired => error
      return render :json => { error: error.message }, :status => '401'
    rescue DataLensManager::ViewAccessDenied => error
      return render :json => { error: error.message }, :status => '403'
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
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

  def create
    begin
      page_metadata = json_parameter(:pageMetadata)
    rescue CommonMetadataTransitionMethods::UserError => error
      return render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue CommonMetadataTransitionMethods::UnacceptableError => error
      return render :json => { :body => "Error: #{error}" }, :status => '406'
    end

    # permission checks
    parent_lens_id = page_metadata['parentLensId']
    can_create_from_dataset = can_create_metadata? && ephemeral_bootstrap_enabled?
    can_derive_from_existing_lens = current_user && save_as_enabled? && parent_lens_id.present?
    unless can_create_from_dataset || can_derive_from_existing_lens
      return render :nothing => true, :status => '401'
    end

    # can only create derived lenses from data lenses we can view, otherwise
    # it would be the same as creating a lens from an arbitrary data lens
    if parent_lens_id.present?
      begin
        parent_lens = View.find(parent_lens_id)

        unless parent_lens.can_read? && parent_lens.data_lens?
          return render :nothing => true, :status => '401'
        end
      rescue CoreServer::ResourceNotFound => error
        return render :json => { :body => "Error: #{error}" }, :status => '401'
      end
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
    rescue DataLensManager::DataLensNotCreatedError => error
      message = "Core error creating catalog lens request ID #{request_id}: #{error}"
      Rails.logger.error(message)
      Airbrake.notify(
        error,
        :error_class => 'DataLensCreation',
        :error_message => message
      )
      render :nothing => true, :status => '500'
    end
  end

  def create_standalone_visualization
    begin
      # we need to do this because rails converts [] to nil
      # see http://stackoverflow.com/questions/14647731/rails-converts-empty-arrays-into-nils-in-params-of-the-request
      params[:vif][:filters] ||= []
      # TODO(pete) figure out how to use this as a module
      result = StandaloneVisualizationManager.new.create(
        params[:vif],
        params[:category],
        params[:datasetId],
        params[:isOfficial],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    rescue Phidippides::NoDatasetIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue Phidippides::NoCardsException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue DataLensManager::DataLensNotCreatedError => error
      message = "Core error creating standalone viz request ID #{request_id}: #{error}"
      Rails.logger.error(message)
      Airbrake.notify(
        error,
        :error_class => 'StandaloneVizCreation',
        :error_message => message
      )
      render :nothing => true, :status => '500'
    end
  end

  def update
    unless dataset(params[:id]).can_edit?
      return render :nothing => true, :status => '401'
    end

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
    rescue CoreServer::Error, CoreServer::ResourceNotFound => error
      render :json => { :body => "Error: #{error}" }, :status => '500'
    end
  end

  def destroy
    begin
      return render :nothing => true, :status => '401' unless dataset(params[:id]).can_edit?
    rescue CoreServer::ResourceNotFound
      # Even if the core page doesn't exist, the data lens might have been orphaned, so let the
      # delete through.
    end

    result = page_metadata_manager.delete(
      params[:id],
      :request_id => request_id,
      :cookies => forwardable_session_cookies
    )

    render :json => result[:body], :status => result[:status]
  end

  private

  def dataset(id = nil)
    View.find(id || json_parameter(:pageMetadata)['datasetId'])
  end

  def save_as_enabled?
    FeatureFlags.derive(nil, request)[:enable_data_lens_save_as]
  end

  def ephemeral_bootstrap_enabled?
    FeatureFlags.derive(nil, request)[:use_ephemeral_bootstrap]
  end
end
