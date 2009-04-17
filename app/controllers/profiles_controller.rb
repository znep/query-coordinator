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
    @public_copy_count = @public_views.inject(0) {|sum,v| sum + v.copyCount}

    @private_blists = @all_owned_views.find_all {|v|
      !v.is_public? && v.flag?('default')}
    @private_filters = @all_owned_views.find_all {|v|
      !v.is_public? && !v.flag?('default')}
    @shared_blists = @all_owned_views.find_all {|v|
      v.is_shared? && v.flag?('default')}

    @contacts = Contact.find();
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
      format.html { redirect_to(profile_url) }
      format.data   { render :json => {:error => error_msg,
        :user => current_user}.to_json }
    end
  end
end
