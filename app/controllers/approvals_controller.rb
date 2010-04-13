class ApprovalsController < ApplicationController
  before_filter { |c| c.require_module! :publisher_comment_moderation }
  before_filter :require_domain_member

  def show
  end
end
