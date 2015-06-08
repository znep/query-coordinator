class PhidippidesDatasetsController < ApplicationController
  include CommonMetadataMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods

  # TODO: We need to plumb our code through to support csrf token verification
  skip_before_filter :verify_authenticity_token
  # Some of these functions will return publicly-accessible data
  skip_before_filter :require_user, :only => [:show, :index]

  helper :all # include all helpers, all the time

  hide_action :current_user, :current_user_session

  helper_method :current_user
  helper_method :current_user_session

  def index
    return render :nothing => true, :status => '400' unless params[:id].present?

    begin
      result = phidippides.fetch_pages_for_dataset(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )

      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  # Note that since this method no longer decorates columns with default and
  # available card types, attempts to instantiate a Data Cards Dataset model
  # from the response of this endpoint will fail with validation errors.
  # This endpoint is 'safe' for the public and for checking permissions and
  # fetching the geometry label of shape files, however.
  def show
    return render :nothing => true, :status => '400' unless params[:id].present?
    return render :nothing => true, :status => '403' unless can_read_dataset_data?(params[:id])

    # Grab permissions from core
    begin
      permissions = fetch_permissions(params[:id])
    rescue NewViewManager::ViewNotFound
      return render :nothing => true, :status => '404'
    rescue NewViewManager::ViewAuthenticationRequired => e
      return render :json => { error: e.message }, :status => '401'
    rescue NewViewManager::ViewAccessDenied => e
      return render :json => { error: e.message }, :status => '403'
    rescue
      return render :nothing => true, :status => '500'
    end

    begin
      result = phidippides.fetch_dataset_metadata(params[:id], :request_id => request_id, :cookies => forwardable_session_cookies)

      dataset_metadata = result[:body]

      dataset_metadata[:permissions] = permissions if dataset_metadata && result[:status] =~ /^20[0-9]$/
      flag_subcolumns!(dataset_metadata[:columns])

      render :json => dataset_metadata, :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def update
    unless dataset(params[:id]).can_edit?
      return render :nothing => true, :status => '401'
    end

    begin
      dataset_metadata = json_parameter(:datasetMetadata)
    rescue CommonMetadataTransitionMethods::UserError => error
      return render :json => { :body => "Error: #{error}" }, :status => '400'
    rescue CommonMetadataTransitionMethods::UnacceptableError => error
      return render :json => { :body => "Error: #{error}" }, :status => '406'
    end

    # Support legacy API where the dataset id is specified in the json body as well.
    dataset_id = dataset_metadata.fetch(:id, false)
    if dataset_id
      if dataset_id != params[:id]
        # Something fishy is going on - hitting the REST endpoint for one page id, but putting
        # another in the payload to update? That's a no-no.
        return render :json => {
          :body => "Error: datasetId in json body must match endpoint: #{dataset_id} vs #{params[:id]}"
        }, :status => '406'
      end
    else
      dataset_metadata[:id] = params[:id]
    end

    begin
      result = phidippides.update_dataset_metadata(
        dataset_metadata,
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      return head :status => '204'
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def destroy
    render :nothing => true, :status => '400'
  end

  private

  def dataset(id = nil)
    View.find(id || json_parameter(:datasetMetadata)['id'])
  end

  def can_read_dataset_data?(dataset_id)
    begin
      response = JSON.parse(
        CoreServer::Base.connection.get_request("/id/#{dataset_id}?%24query=select+0+limit+1")
      )

      # CORE-5321: when requesting a choropleth, requests for the underlying shapefile
      # will also be made; if the customer has deleted the shapefile, this request
      # will come back with a 404 and appropriate JSON error data.
      if response.is_a?(Hash) && response['error'] == true
        false
      else
        response[0]['_0'] == '0'
      end
    rescue CoreServer::Error
      false
    end
  end
end
