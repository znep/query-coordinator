class PhidippidesDatasetsController < ActionController::Base

  include Phidippides

  def index
    return render :nothing => true, :status => 400 unless params[:id].present?

    respond_to do |format|
      begin
        result = fetch_pages_for_dataset(params[:id], :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def show
    return render :nothing => true, :status => 400 unless params[:id].present?

    respond_to do |format|
      begin
        result = fetch_dataset_metadata(params[:id], :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def create
    return render :nothing => true, :status => 401 unless current_user
    return render :nothing => true, :status => 405 unless request.post?
    return render :nothing => true, :status => 400 unless params[:datasetMetadata].present?

    respond_to do |format|
      begin
        result = create_dataset_metadata(JSON.parse(params[:datasetMetadata]), :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def update
    return render :nothing => true, :status => 401 unless current_user
    return render :nothing => true, :status => 405 unless request.put?
    return render :nothing => true, :status => 400 unless params[:datasetMetadata].present?

    respond_to do |format|
      begin
        result = update_dataset_metadata(params[:id], :data => JSON.parse(params[:datasetMetadata]), :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def destroy
    render :nothing => true, :status => 403
  end

end
