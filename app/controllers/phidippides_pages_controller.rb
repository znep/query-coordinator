class PhidippidesPagesController < ActionController::Base

  include Phidippides

  before_filter :hook_auth_controller
  helper :all # include all helpers, all the time
  helper_method :current_user
  helper_method :current_user_session

  def index
    render :nothing => true, :status => 403
  end

  def show
    respond_to do |format|
      begin
        result = fetch_page_metadata(params[:id], :request_id => request_id, :cookies => forwardable_session_cookies)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def create
    return render :nothing => true, :status => 401 unless current_user
    return render :nothing => true, :status => 405 unless request.post?
    return render :nothing => true, :status => 400 unless params[:pageMetadata].present?

    respond_to do |format|
      begin
        result = create_page_metadata(JSON.parse(params[:pageMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
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
        result = update_page_metadata(params[:id], :data => JSON.parse(params[:pageMetadata]), :request_id => request_id, :cookies => forwardable_session_cookies)
        format.json { render :json => result[:body], :status => result[:status] }
      rescue ConnectionError
        format.json { render :json => { body: 'Phidippides connection error' }, status: 500 }
      end
    end
  end

  def destroy
    render :nothing => true, :status => 403
  end

  hide_action :current_user, :current_user_session
  def current_user
    @current_user ||= current_user_session ? current_user_session.user : nil
  end

  def basic_auth
    authenticate_with_http_basic { |u, p|
      user_session = UserSession.new('login' => u, 'password' => p)
      user_session.save
    }
  end

  def current_user_session
    @current_user_session ||= UserSession.find || basic_auth
  end

  def current_user_session=(user_session)
    @current_user_session = user_session
  end

  private
  def hook_auth_controller
    UserSession.controller = self
  end

end
