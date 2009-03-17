class AccountsController < ApplicationController
  def show
    @user = User.find(current_user.id)
  end
  
  def update
    @user = User.find(current_user.id)
    @user.email = params[:email] || @user.email
    @user.password = params[:password_new] || @user.password
    
    respond_to do |format|
      format.html { redirect_to(account_url) }
      format.data   { render :json => @user.to_json }
    end
  end
end