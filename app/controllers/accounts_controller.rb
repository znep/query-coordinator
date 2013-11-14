class AccountsController < ApplicationController
  include ActionView::Helpers::TranslationHelper
  include UserSessionsHelper
  skip_before_filter :require_user, :only => [:new, :create, :forgot_password, :reset_password]
  skip_before_filter :adjust_format, :only => [:update]
  protect_from_forgery :except => [:add_rpx_token]

  def new
    @signup = SignupPresenter.new({}, params[:token], params[:auth_token])
    @body_class = 'signup'
    @signup.user.email = params[:email] if params[:email].present?
    # This is so we can display the login screen dynamically
    @user_session = UserSession.new unless params[:no_js].present?
  end

  def create
    @body_class = 'signup'
    @token = params[:inviteToken] || ""

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end

    @signup = SignupPresenter.new(params[:signup])
    respond_to do |format|
      # need both .data and .json formats because firefox detects as .data and chrome detects as .json
      if !verify_recaptcha
        flash.now[:error] = t('recaptcha.errors.verification_failed')
        @user_session = UserSession.new
        format.html { render :action => :new }
        format.data { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
        format.json { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
      elsif @signup.create
        format.html { redirect_to(login_redirect_url) }
        format.data { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
      else
        flash.now[:error] = @signup.errors
        @user_session = UserSession.new
        format.html { render :action => :new }
        format.data { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
        format.json { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
      end
    end
  end

  def forgot_password
    @body_id = 'resetPassword'
    if request.post?
      if User.reset_password(params[:login])
        flash[:notice] = t('screens.forgot_password.success')
        return redirect_to(login_path)
      else
        flash.now[:warning] = t('screens.forgot_password.failed')
      end
    end
  end

  def reset_password
    if !current_user.nil?
      return redirect_to(forgot_password_path)
    end
    @body_id = 'resetPassword'
    if request.post?
      if params[:confirm_password] != params[:password]
        flash[:notice] = t('screens.sign_in.mismatch')
        return
      end

      req = Net::HTTP::Post.new('/users')
      req.set_form_data({'method' => 'resetPassword', 
                         'uid' => params[:uid], 
                         'reset_code' => params[:reset_code], 
                         'password' => params[:password]})

      # pass/spoof in the current domain cname
      req['X-Socrata-Host'] = CurrentDomain.cname

      result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
        http.request(req)
      end

      if result.is_a? Net::HTTPSuccess
        flash[:notice] = t('screens.reset_password.success')

        # Awesome; let's log them in.
        user = User.parse(result.body)
        @user_session = UserSession.new('login' => user.id, 'password' => params[:password])
        if @user_session.save
          return redirect_to(login_redirect_url)
        else
          # Hmmm. They successfully reset their password, but we couldn't log them in?
          # Something's very wrong. Let's just put them at the login page and have them
          # try again. :-(
          return redirect_to(login_path)
        end
      else
        result_hash = JSON.parse(result.body)
        flash[:notice] = result_hash['message'] and return if (result_hash['code'] == 'validation')
        flash[:warning] = t('screens.reset_password.failed')
        return redirect_to(forgot_password_path)
      end
    end
  end

  def add_rpx_token
    OpenIdIdentifier.create(User.current_user.id, params[:token]) if params[:token]
    flash[:notice] = t('screens.link_account.success')
  rescue CoreServer::CoreServerError => e
    flash[:error] = e.error_message
  ensure
    redirect_to login_redirect_url
  end
end
