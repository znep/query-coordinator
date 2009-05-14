class AccountsController < ApplicationController
  skip_before_filter :require_user, :only => [:new, :create, :forgot_password, :reset_password]

  def show
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
          current_user.update_attributes!(
              {:newPassword => params[:user][:password_new],
                :password => params[:user][:password_old]})
        end
      end
    rescue CoreServerError => e
      error_msg = e.error_message
    end

    respond_to do |format|
      format.html { redirect_to(account_url) }
      format.data   { render :json => {:error => error_msg,
        :user => current_user}.to_json }
    end
  end

  def new
    @body_class = 'signup'
  end

  def create
    # First, try creating the user
    begin
      user = User.create(params[:account])
    rescue CoreServerError => e
      flash[:error] = e.error_message
      return redirect_to signup_url
    end

    # Now, authenticate the user
    @user_session = UserSession.new(params[:account])
    if @user_session.save
      # If they gave us a profile photo, upload that to the user's account
      # If the core server gives us an error, oh well... we've alredy created
      # the account, so we might as well send them to the main page, sans
      # profile photo.
      if params[:profile_image]
        begin
          user.profile_image = params[:profile_image]
        rescue CoreServerError => e
          logger.warn "Unable to update profile photo: #{e.error_code} #{e.error_message}"
        end
      end

      redirect_back_or_default(root_url)
    else
      flash[:warning] = "We were able to create your account, but couldn't log you in."
      redirect_to login_url
    end
  end

  def forgot_password
    @body_id = 'resetPassword'
    if request.post?
      req = Net::HTTP::Post.new('/users')
      req.set_form_data({'method' => 'forgotPassword', 'login' => params[:account][:login]})
      result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
        http.request(req)
      end

      if result.is_a? Net::HTTPSuccess
        flash[:notice] = "Thank you. An email has been sent to the account on file with further information."
        redirect_to login_url
      else
        flash[:warning] = "There was a problem submitting your password reset request. Please try again."
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
      result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
        http.request(req)
      end

      if result.is_a? Net::HTTPSuccess
        flash[:notice] = 'Password successfully reset'

        # Awesome; let's log them in.
        user = User.parse(result.body)
        @user_session = UserSession.new('login' => user.login, 'password' => params[:password])
        if @user_session.save
          redirect_to root_url
        else
          # Hmmm. They successfully reset their password, but we couldn't log them in?
          # Something's very wrong. Let's just put them at the login page and have them
          # try again. :-(
          redirect_to login_url
        end
      else
        flash[:warning] = 'There was a problem resetting your password. Please try again.'
        redirect_to forgot_password_url
      end
    end
  end
end
