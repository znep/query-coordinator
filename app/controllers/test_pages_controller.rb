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
    flash.now[:error] = 'This dataset or view cannot be found, or has been deleted.'
    render 'shared/error', :status => :not_found
  end

  def put_kaboom
    respond_to do |format|
      format.html { render }
      format.data { render :json => { :failed => true } }
    end
  end

  def iframe
  end
  def frameset
    render :layout => false
  end
  def evil_frame
    render :text => 'Oh no, evil code!'
  end

end
