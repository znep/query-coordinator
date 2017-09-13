class AccountsController < ApplicationController

  include ActionView::Helpers::TranslationHelper
  include Auth0Helper
  include UserSessionsHelper

  skip_before_filter :require_user, :only => [:new, :create, :forgot_password, :reset_password, :verify_email]
  skip_before_filter :adjust_format, :only => [:update]

  protect_from_forgery

  # NOTE: This skip_before_filter must come _after_ the protect_from_forgery call above
  # When CSRF token validation is skipped for this method (see skip_before_filter above), the
  # `SocrataRecaptcha.valid`` test in the 'create' method is our only protection against abuse.
  skip_before_filter :verify_authenticity_token,
    :if => lambda { |controller|
      controller.action_name == 'create' && (request.format.json? || request.format.data?)
    }

  def new
    process_auth0_config

    @signup = SignupPresenter.new({}, params[:token], params[:auth_token])
    @body_class = 'signup'
    @signup.user.email = params[:email] if params[:email].present?
    # This is so we can display the login screen dynamically
    @user_session = UserSessionProvider.klass.new unless params[:no_js].present?

    # Styleguide layout cannot be used yet because not all sites are using site chrome
    # for the header/footer
    # Once they are all using site chrome, uncomment this
    # See EN-18452 and EN-18453
    # render :layout => 'styleguide'
  end

  # This is the true target of the form when signing up for a new account not '/profile/account'
  # as you might be led to believe by looking at the form action in the HTML. The route is '/signup.json'
  # NOTE: Even though we're skipping the CSRF token verification, there is still the 'verify_captcha' test
  # within the 'respond_to' block, but without the CSRF token, this is our only protection.
  def create
    @body_class = 'signup'
    @token = params[:inviteToken] || ''

    if current_user_session
      current_user_session.destroy
      @current_user = nil
    end

    @signup = SignupPresenter.new(params[:signup])
    respond_to do |format|
      # need both .data and .json formats because firefox detects as .data and chrome detects as .json
      # When CSRF token validation is skipped for this method (see skip_before_filter above), this
      # recaptcha test is our only protection against abuse.
      unless SocrataRecaptcha.valid(params['g-recaptcha-response'])
        flash.now[:error] = t('recaptcha2.errors.verification_failed')
        @user_session = UserSessionProvider.klass.new
        format.html { render :action => :new }
        format.data { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
        format.json { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
        return
      end

      if @signup.create
        Rails.logger.info('Somebody used inline login to create an account!') if params[:inline]
        if FeatureFlags.derive[:enable_new_account_verification_email]
          flash[:notice] = t('screens.sign_up.email_verification.sent',
            :email => params.fetch(:signup, {}).fetch(:email, ''))
          format.html { redirect_to(login_url) }
          body = { :notice => flash[:notice], :promptLogin => false }
          format.data { render :json => body, :callback => params[:callback] }
          format.json { render :json => body, :callback => params[:callback] }
        else
          format.html { redirect_to(login_redirect_url) }
          format.data { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
          format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
        end
      else
        error = @signup.errors.values.flatten.join(', ')
        if password_validation_error?(error)
          error = t('screens.sign_up.password_verification.failed_html')
        end
        flash.now[:error] = error
        @user_session = UserSessionProvider.klass.new
        format.html { render :action => :new }
        format.data { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
        format.json { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
      end
    end
  end

  def verify_email
    token = params.fetch(:token)
    begin
      User.verify_email(token)
    rescue CoreServer::ResourceNotFound => _
      flash[:error] = t('screens.sign_up.email_verification.expired')
      return redirect_to(signup_path)
    end
    flash[:notice] = t('screens.sign_up.email_verification.success')
    redirect_to(login_path)
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
    return redirect_to(forgot_password_path) unless current_user.nil?
    @body_id = 'resetPassword'
    @disable_mixpanel_tracking = true

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
        @user_session = UserSessionProvider.klass.new('login' => user.id, 'password' => params[:password])
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
end
