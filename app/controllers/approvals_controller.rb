class ApprovalsController < ApplicationController
  def show
    unless current_user.are_comments_moderated?
      return redirect_to('/home')
    end
  end
end
