class PhidippidesPagesController < ActionController::Base

  include Phidippides

  def index
    render :nothing => true, :status => 403
  end

  def show
    respond_to do |format|
      begin
        result = fetch_page_metadata(params[:id], :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def create
    return render :nothing => true, :status => 401 unless current_user
    return render :nothing => true, :status => 405 unless request.post?

    respond_to do |format|
      begin
        result = create_page_metadata(params[:pageMetadata], :request_id => request_id)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      rescue JSON::ParserError => e
        format.json { render :json => { body: "Invalid JSON payload. Error: #{e.to_s}" }, status: 500 }
      end
    end
  end

  def update
    return render :nothing => true, :status => 401 unless current_user
    return render :nothing => true, :status => 405 unless request.put?
    return render :nothing => true, :status => 400 unless params[:pageMetadata].present?

    respond_to do |format|
      begin
        result = update_page_metadata(params[:id], :data => params[:pageMetadata], :request_id => request_id)
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
