class AccountsController < ApplicationController
  skip_before_filter :require_user, :only => [:new, :create]
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
      redirect_to root_url
    else
      flash[:warning] = "We were able to create your account, but couldn't log you in."
      redirect_to login_url
    end
  end
end
