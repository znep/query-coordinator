class ProfileController < ApplicationController
  skip_before_filter :require_user, :only => [:index, :show]
  
  helper :user

  def index
    render(:action => "show")
  end
  
  def show
    user_id = params[:id]
    if (!current_user || user_id != current_user.id)
      @is_user_current = false
      @user = User.find_profile(user_id)
    else
      @is_user_current = true
      @user = current_user
    end
    
    @friends = @user.friends.sort_by{ rand }.first(8)
    @followers = @user.followers.sort_by{ rand }.first(8)
    
    @body_id = 'profileBody'
    @body_class = 'home'
    
    @public_views = @user.public_blists
    @shared_views = @public_views.find_all {|v| v.is_shared? }
    
    if (@is_user_current)
      @all_owned_views = View.find().reject {|v| v.owner.id != current_user.id}
      @private_blists = @all_owned_views.find_all {|v|
        !v.is_public? && v.flag?('default')}
      @private_filters = @all_owned_views.find_all {|v|
        !v.is_public? && !v.flag?('default')}
      @user_links = UserLink.find(current_user.id)
    end

  end

  def update
    error_msg = nil
    if (params[:user][:country] && params[:user][:country].upcase != 'US' ||
       params[:user][:state] == '--')
      params[:user][:state] = nil
    end
    if (params[:user][:country] == '--')
      params[:user][:country] = nil
    end
    # For now, force setting of tags; they get deleted otherwise
    if (params[:user][:tags].nil?)
      params[:user][:tags] = current_user.tag_display_string
    end

    begin
      current_user.update_attributes!(params[:user])
    rescue CoreServerError => e
      error_msg = e.error_message
    end

    respond_to do |format|
      format.html { redirect_to(profile_url(current_user.id)) }
      format.data   { render :json => {:error => error_msg,
        :user => current_user}.to_json }
    end
  end
  
  def create_link
    @user_link = UserLink.create(params[:id], params[:link])
    
    respond_to do |format|
      format.html { redirect_to(profile_url(current_user.id)) }
      format.data { render }
    end
  end
  
  def delete_link
    UserLink.delete(params[:id], params[:link_id])
    
    respond_to do |format|
      format.html { redirect_to(profile_url(current_user.id)) }
      format.data { render :json => {:link_id => params[:link_id]} }
    end
  end
  
  def update_link
    @user_link = UserLink.update(params[:id], params[:link_id], params[:link])
    
    respond_to do |format|
      format.html { redirect_to(profile_url(current_user.id)) }
      format.data { render :action => "create_link" }
    end
  end
end
