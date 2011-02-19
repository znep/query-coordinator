class TestPagesController < ApplicationController

  def index
    @actions = action_methods
  end

  def js_kaboom
  end

  def kaboom
    throw Exception.new
  end

  def i_dont_think_so
    render_403
  end

  def manual_kaboom
    flash.now[:error] = 'This ' + I18n.t(:blist_name).downcase +
          ' or view cannot be found, or has been deleted.'
    render 'shared/error', :status => :not_found
  end

  def put_kaboom
    respond_to do |format|
      format.data { render :json => { :failed => true } }
      format.html { render }
    end
  end

end
