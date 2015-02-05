class PhidippidesDatasetsController < ActionController::Base

  include CommonPhidippidesMethods
  include CommonMetadataTransitionMethods
  include UserAuthMethods

  before_filter :hook_auth_controller

  helper :all # include all helpers, all the time

  hide_action :current_user, :current_user_session

  helper_method :current_user
  helper_method :current_user_session

  def index
    return render :nothing => true, :status => 400 unless params[:id].present?

    respond_to do |format|
      begin
        result = phidippides.fetch_pages_for_dataset(
          params[:id],
          :request_id => request_id,
          :cookies => forwardable_session_cookies
        )
        format.json { render :json => result[:body], :status => result[:status] }
      rescue Phidippides::ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def show
    return render :nothing => true, :status => 400 unless params[:id].present?

    respond_to do |format|
      begin
        result = phidippides.fetch_dataset_metadata(params[:id], :request_id => request_id, :cookies => forwardable_session_cookies)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue Phidippides::ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def create
    return render :nothing => true, :status => 400 unless metadata_transition_phase_0?
    return render :nothing => true, :status => 401 unless can_update_metadata?
    return render :nothing => true, :status => 405 unless request.post?
    return render :nothing => true, :status => 400 unless params[:datasetMetadata].present?

    respond_to do |format|
      begin
        result = phidippides.create_dataset_metadata(JSON.parse(params[:datasetMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue Phidippides::ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def update
    return render :nothing => true, :status => 401 unless can_update_metadata?
    return render :nothing => true, :status => 405 unless request.put?
    return render :nothing => true, :status => 400 unless params[:datasetMetadata].present?

    respond_to do |format|
      begin
        result = phidippides.update_dataset_metadata(JSON.parse(params[:datasetMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
        if metadata_transition_phase_0?
          format.json { render :json => result[:body], :status => result[:status] }
        else
          return head :status => 204
        end
      rescue Phidippides::ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def destroy
    if metadata_transition_phase_0?
      render :nothing => true, :status => 403
    else
      render :nothing => true, :status => 400
    end
  end

  private

  def dataset
    View.find(JSON.parse(params[:datasetMetadata])['id'])
  end
end
