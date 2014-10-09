class PhidippidesPagesController < ActionController::Base

  include CommonPhidippidesMethods

  before_filter :hook_auth_controller

  helper :all # include all helpers, all the time

  helper_method :current_user
  helper_method :current_user_session

  hide_action :current_user, :current_user_session

  def index
    render :nothing => true, :status => 403
  end

  def show
    respond_to do |format|
      format.json do
        begin
          result = page_metadata_manager.fetch(
            params[:id],
            :request_id => request_id,
            :cookies => forwardable_session_cookies
          )
          render :json => result[:body], :status => result[:status]
        rescue Phidippides::ConnectionError
          render :json => { body: 'Phidippides connection error' }, status: 500
        end
      end
    end
  end

  def create
    return render :nothing => true, :status => 401 unless has_rights?
    return render :nothing => true, :status => 405 unless request.post?
    return render :nothing => true, :status => 400 unless params[:pageMetadata].present?

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
          render :json => { body: 'Phidippides connection error' }, status: 500
        rescue JSON::ParserError => error
          render :json => { body: "Invalid JSON payload. Error: #{error.to_s}" }, status: 500
        end
      end
    end
  end

  def update
    return render :nothing => true, :status => 401 unless has_rights?
    return render :nothing => true, :status => 405 unless request.put?
    return render :nothing => true, :status => 400 unless params[:pageMetadata].present?

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
          render :json => { body: 'Phidippides connection error' }, status: 500
        end
      end
    end
  end

  def destroy
    render :nothing => true, :status => 403
  end

  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def basic_auth
    authenticate_with_http_basic do |username, password|
      user_session = UserSession.new('login' => username, 'password' => password)
      user_session.save
    end
  end

  def current_user_session
    @current_user_session ||= UserSession.find || basic_auth
  end

  def current_user_session=(user_session)
    @current_user_session = user_session
  end

  private

  def dataset
    View.find(JSON.parse(params[:pageMetadata])['datasetId'])
  end

  def hook_auth_controller
    UserSession.controller = self
  end

end
