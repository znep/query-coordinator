class PhidippidesDatasetsController < ActionController::Base

  include CommonPhidippidesMethods
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
        result = page_metadata_manager.pages_for_dataset(
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
    return render :nothing => true, :status => 401 unless has_rights?
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
    return render :nothing => true, :status => 401 unless has_rights?
    return render :nothing => true, :status => 405 unless request.put?
    return render :nothing => true, :status => 400 unless params[:datasetMetadata].present?

    respond_to do |format|
      begin
        result = phidippides.update_dataset_metadata(JSON.parse(params[:datasetMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue Phidippides::ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def destroy
    render :nothing => true, :status => 403
  end

  private

  def dataset
    View.find(JSON.parse(params[:datasetMetadata])['id'])
  end
end
