class ApprovalsController < ApplicationController
  before_filter { |c| c.require_module! :comment_moderation }

  def show
  end
end
