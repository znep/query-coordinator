class ProfilesController < ApplicationController
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
end
