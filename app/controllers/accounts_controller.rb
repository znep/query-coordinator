class AccountsController < ApplicationController
  def show
  end

  def update
    current_user.email = params[:email] || current_user.email
    current_user.password = params[:password_new] || current_user.password

    respond_to do |format|
      format.html { redirect_to(account_url) }
      format.data   { render :json => current_user.to_json }
    end
  end
end
