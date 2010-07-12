class AccountsController < ApplicationController
  ssl_required :new, :update, :create, :add_rpx_token
  ssl_allowed :show
  skip_before_filter :require_user, :only => [:new, :create, :forgot_password, :reset_password]
  skip_before_filter :adjust_format, :only => [:update]
  protect_from_forgery :except => [:add_rpx_token]

  def show
    @openid_identifiers = current_user.openid_identifiers
##    @createdOnDomain = Domain.findById(current_user.data['createdOnDomainId'])

    @accountEditClasses = ['content']
    if @openid_identifiers.length > 0
      @accountEditClasses << 'has_openid'
    else
      @accountEditClasses << 'no_openid'
    end
    if current_user.flag?('nopassword')
      @accountEditClasses << 'no_password'
    else
      @accountEditClasses << 'has_password'
    end
  end

  def update
    error_msg = nil
    begin
      if params[:user][:email]
        if params[:user][:email] != params[:user][:email_confirm]
          error_msg = "New emails do not match"
        else
          current_user.update_attributes!(
              {:email => params[:user][:email],
                :password => params[:user][:email_password]})
        end
      elsif params[:user][:password_new]
        if params[:user][:password_new] != params[:user][:password_confirm]
          error_msg = "New passwords do not match"
        else
          current_user.update_password(
              {:newPassword => params[:user][:password_new],
                :password => params[:user][:password_old]})
        end
      end
    rescue CoreServer::CoreServerError => e
      error_msg = e.error_message
    end

    respond_to do |format|
      format.html { redirect_to(account_path) }
      format.json { render :json => {:error => error_msg,
                                     :user => current_user},
                           :callback => params[:callback] }
    end
  end

  def new
    @signup = SignupPresenter.new({}, params[:token])
    @body_class = 'signup'
  end

  def create
    @body_class = 'signup'
    @token = params[:inviteToken] || ""

    @signup = SignupPresenter.new(params[:signup])
    respond_to do |format|
      if @signup.create
        format.html { redirect_to(profile_path(@signup.user.id, :welcome => true)) }
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
      else
        flash.now[:error] = @signup.errors.join(", ")
        format.html { render :action => :new }
        format.json { render :json => {:error => flash[:error], :promptLogin => false}, :callback => params[:callback] }
      end
    end
  end

  def forgot_password
    @body_id = 'resetPassword'
    if request.post?
      req = Net::HTTP::Post.new('/users')
      req.set_form_data({'method' => 'forgotPassword', 'login' => params[:login]})

      # pass/spoof in the current domain cname
      req['X-Socrata-Host'] = CurrentDomain.cname

      result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
        http.request(req)
      end

      if result.is_a? Net::HTTPSuccess
        flash[:notice] = "Thank you. An email has been sent to the account on file with further information."
        redirect_to login_path
      else
        flash.now[:warning] = "There was a problem submitting your password reset request. Please try again."
      end
    end
  end

  def reset_password
    @body_id = 'resetPassword'
    if request.post?
      if params[:confirm_password] != params[:password]
        flash[:notice] = 'Passwords do not match; please try again'
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
        flash[:notice] = 'Password successfully reset'

        # Awesome; let's log them in.
        user = User.parse(result.body)
        @user_session = UserSession.new('login' => user.login, 'password' => params[:password])
        if @user_session.save
          redirect_to root_path
        else
          # Hmmm. They successfully reset their password, but we couldn't log them in?
          # Something's very wrong. Let's just put them at the login page and have them
          # try again. :-(
          redirect_to login_path
        end
      else
        flash[:warning] = 'There was a problem resetting your password. Please try again.'
        redirect_to forgot_password_path
      end
    end
  end

  def add_rpx_token
    OpenIdIdentifier.create(User.current_user.id, params[:token]) if params[:token]
  rescue CoreServer::CoreServerError => e
    flash[:openid_error] = e.error_message
  ensure
    redirect_to account_url(:anchor => params[:section])
  end
end
