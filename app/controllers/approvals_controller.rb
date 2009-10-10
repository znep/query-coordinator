class ApprovalsController < ApplicationController
  def show
    @moderation_queue = Comment.moderation_queue(current_user.id)
  end
end
