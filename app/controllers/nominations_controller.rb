class NominationsController < ApplicationController
  before_filter { |c| c.require_module! :dataset_nomination }
  skip_before_filter :require_user, :only => [:index, :show]

  def index
    @base_url = request.path
    @page_size = 10
    @params = params.reject {|k, v| k.to_s == 'controller' || k.to_s == 'action'}
    params[:page] ||= 1
    @status = params[:status] || nil
    @nominations = Nomination.find_page(params[:page], @page_size, @status)
    @nominations_count = Nomination.count(@status)
  end

  def show
    @nom = Nomination.find(params[:id])
    @user_session = UserSession.new unless current_user
  end

  def new
    # really just an auth bounce; send them back to show and let them do it via js once they're auth'd
    redirect_to :action => :index
  end
end
