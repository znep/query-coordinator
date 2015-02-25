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
    respond_to do |format|
      format.json do
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
    end
  end

  def create
    return render :nothing => true, :status => '401' unless can_update_metadata?
    return render :nothing => true, :status => '405' unless request.post?
    return render :nothing => true, :status => '400' unless params[:pageMetadata].present?

    respond_to do |format|
      format.json do
        begin
          result = page_metadata_manager.create(
            params[:pageMetadata],
            :request_id => request_id,
            :cookies => forwardable_session_cookies
          )
          render :json => result[:body], :status => result[:status]
        rescue Phidippides::ConnectionError
          render :json => { :body => 'Phidippides connection error' }, :status => '500'
        rescue Phidippides::NoDatasetIdException => error
          render :json => { :body => "Error: #{error}" }, :status => '500'
        rescue Phidippides::NewPageException => error
          render :json => { :body => "Error: #{error}" }, :status => '500'
        rescue Phidippides::PageIdException => error
          render :json => { :body => "Error: #{error}" }, :status => '500'
        rescue JSON::ParserError => error
          render :json => { :body => "Invalid JSON payload. Error: #{error}" }, :status => '500'
        end
      end
    end
  end

  def update
    return render :nothing => true, :status => '401' unless can_update_metadata?
    return render :nothing => true, :status => '405' unless request.put?
    return render :nothing => true, :status => '400' unless params[:pageMetadata].present?

    respond_to do |format|
      format.json do
        begin
          result = page_metadata_manager.update(
            params[:pageMetadata],
            :request_id => request_id,
            :cookies => forwardable_session_cookies
          )
          render :json => result[:body], :status => result[:status]
        rescue Phidippides::ConnectionError
          render :json => { :body => 'Phidippides connection error' }, :status => '500'
        rescue Phidippides::NoDatasetIdException => error
          render :json => { :body => "Error: #{error}" }, :status => '500'
        rescue Phidippides::NoPageIdException => error
          render :json => { :body => "Error: #{error}" }, :status => '500'
        end
      end
    end
  end

  def destroy
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
    View.find(JSON.parse(params[:pageMetadata])['datasetId'])
  end
end
