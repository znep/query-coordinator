class ProfilesController < ApplicationController
  def show
    @body_id = 'profileBody'
    @public_blists = current_user.public_blists.sort do |a,b|
      if a.viewCount == b.viewCount
        a.name <=> b.name
      else
        b.viewCount <=> a.viewCount
      end
    end
  end
end
