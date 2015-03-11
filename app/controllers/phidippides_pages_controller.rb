class PhidippidesPagesController < ActionController::Base

  include CommonPhidippidesMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods

  before_filter :hook_auth_controller

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

    begin
      result = phidippides.fetch_page_metadata(
        params[:id],
        :request_id => request_id,
        :cookies => forwardable_session_cookies
      )
      render :json => result[:body], :status => result[:status]
    rescue Phidippides::ConnectionError
      render :json => { :body => 'Phidippides connection error' }, :status => '500'
    end
  end

  def create
    return render :nothing => true, :status => '401' unless can_update_metadata?

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
    rescue Phidippides::NewPageException => error
      render :json => { :body => "Error: #{error}" }, :status => '500'
    rescue Phidippides::PageIdException => error
      render :json => { :body => "Error: #{error}" }, :status => '400'
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
    View.find(JSON.parse(json_parameter(:pageMetadata))['datasetId'])
  end
end
