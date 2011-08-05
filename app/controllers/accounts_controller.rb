class AccountsController < ApplicationController
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

    @signup = SignupPresenter.new(params[:signup])
    respond_to do |format|
      # need both .data and .json formats because firefox detects as .data and chrome detects as .json
      if @signup.create
        format.html { redirect_to(@signup.user.href) }
        format.data { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
        format.json { render :json => {:user_id => current_user.id}, :callback => params[:callback]}
      else
        flash.now[:error] = @signup.errors.join(", ")
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
        flash[:notice] = "Thank you. An email has been sent to the account on file with further information."
        return redirect_to(login_path)
      else
        flash.now[:warning] = "There was a problem submitting your password reset request. Please try again."
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
        @user_session = UserSession.new('login' => user.id, 'password' => params[:password])
        if @user_session.save
          return redirect_to(profile_index_path)
        else
          # Hmmm. They successfully reset their password, but we couldn't log them in?
          # Something's very wrong. Let's just put them at the login page and have them
          # try again. :-(
          return redirect_to(login_path)
        end
      else
        flash[:warning] = 'There was a problem resetting your password. Please try again.'
        return redirect_to(forgot_password_path)
      end
    end
  end

  def add_rpx_token
    OpenIdIdentifier.create(User.current_user.id, params[:token]) if params[:token]
    flash[:notice] = "Your external account has been linked."
  rescue CoreServer::CoreServerError => e
    flash[:error] = e.error_message
  ensure
    redirect_to profile_account_path(:id => current_user.id, :profile_name => current_user.displayName.convert_to_url)
  end
end
