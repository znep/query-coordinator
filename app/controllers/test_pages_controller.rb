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

  def cf
  end

  def kill_all_views
    return render :text => "you weren't sure" unless params[:are_you_sure] == 'yes'
    return render_403 unless current_user

    views = Clytemnestra.search_views({ for_user: current_user.id, limit: 20 }).results
    count = 0

    while !views.empty?
      count += views.size
      threads = views.map{ |view| Thread.new{ View.delete(view.id) } }
      threads.each{ |thread| thread.join }

      views = Clytemnestra.search_views({ for_user: current_user.id, limit: 20 }).results
    end

    return render :text => "#{count} deleted"
  end

end
