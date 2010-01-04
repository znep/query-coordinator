class ApprovalsController < ApplicationController
  before_filter { |c| c.require_module! :publisher_comment_moderation }

  def show
  end
end
