class TestPagesController < ApplicationController

  skip_before_filter :require_user, :only => [ :charts ]

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
    Canvas2::DataContext.reset
    Canvas2::Util.set_params(params)
    Canvas2::Util.set_debug(true)
    Canvas2::Util.set_env({
      domain: CurrentDomain.cname,
      renderTime: Time.now.to_i,
      path: '/test_page/cf',
      siteTheme: CurrentDomain.theme
    })
    @minimal_render = params['no_render'] == 'true'
  end

  def kill_all_views
    return render :text => "you weren't sure" unless params[:are_you_sure] == 'yes'
    return render_403 unless current_user

    q = {for_user: current_user.id, datasetView: 'dataset', limitTo: 'tables',
      publication_stage: ['published', 'unpublished'], sortBy: 'alpha', nofederate: true, limit: 1}
    pages = (Clytemnestra.search_views(q).count / 20.0).ceil
    count = 0
    q[:limit] = 20

    while pages > 0
      q['page'] = pages
      views = Clytemnestra.search_views(q).results
      count += views.size

      threads = views.map{ |view| Thread.new{ View.delete(view.id) } }
      threads.each{ |thread| thread.join }

      pages -= 1
    end

    return render :text => "#{count} deleted"
  end

  def charts
    @view = View.find 'i6hc-8ccn'
    needs_view_js @view.id, @view
  end

end
