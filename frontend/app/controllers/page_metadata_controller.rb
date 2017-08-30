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
    can_derive_from_existing_lens = current_user && parent_lens_id.present?
    unless can_create_metadata? || can_derive_from_existing_lens
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
    rescue PageMetadataManager::NoDatasetIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue PageMetadataManager::NoCardsException => error
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
    rescue PageMetadataManager::NoDatasetIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue PageMetadataManager::NoPageIdException => error
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

end
