class NominationsController < ApplicationController
  before_filter { |c| c.require_module! :dataset_nomination }
  skip_before_filter :require_user, :only => [:show]

  def show
    @base_url = request.path
    @page_size = 10
    params[:page] ||= 1
    @status = params[:status] || nil
    @nominations = Nomination.find_page(params[:page], @page_size, @status)
    @nominations_count = Nomination.count(@status)
  end
end
