class ProfilesController < ApplicationController
  helper :user
  
  def show
    @body_id = 'profileBody'
    @body_class = 'home'
    @all_owned_views = View.find().reject {|v| v.owner.id != current_user.id}
    @public_views = @all_owned_views.reject {|v| !v.is_public?}.sort do |a,b|
      if a.viewCount == b.viewCount
        a.name <=> b.name
      else
        b.viewCount <=> a.viewCount
      end
    end
    @public_view_count = @public_views.inject(0) {|sum,v| sum + v.viewCount}

    @private_blists = @all_owned_views.find_all {|v|
      !v.is_public? && v.flag?('default')}
    @private_filters = @all_owned_views.find_all {|v|
      !v.is_public? && !v.flag?('default')}
    @shared_blists = @all_owned_views.find_all {|v|
      v.is_shared? && v.flag?('default')}

    @contacts = Contact.find();
  end
  
  def update
    @user = User.find(current_user.id)
    @user.firstName = params[:first_name] || @user.firstName
    @user.lastName = params[:last_name] || @user.lastName
    @user.login = params[:login] || @user.login
    @user.state = params[:state] || @user.state
    @user.country = params[:country] || @user.country
    
    respond_to do |format|
      format.html { redirect_to(profile_url) }
      format.data   { render :json => @user.to_json() }
    end
  end
end
