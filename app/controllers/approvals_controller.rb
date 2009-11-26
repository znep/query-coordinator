class ApprovalsController < ApplicationController
  before_filter { |c| c.require_module! CurrentDomain.comment_moderation? }

  def show
  end
end
