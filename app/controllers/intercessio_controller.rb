class IntercessioController < ApplicationController

  def request_async
    CurrentDomain.module_available?('intercessio') or return render_404
    path = /\/intercessio\/request\/(.*)/.match(request.fullpath)[1]
    Rails.logger.info("Requesting " + path + " asynchronously")
    result = Intercessio::Connection.new().request(path, request.headers)
    if result['result'] != 'success'
      return render :status => 500, :json => result.to_json
    end
    status = {}
    status['token'] = result['token']
    status['path'] = path
    render :json => status.to_json

  end

  def request_status
    CurrentDomain.module_available?('intercessio') or return render_404
    Rails.logger.error("Retrieving the status for " + params[:token])
    result = Intercessio::Connection.new().status(params[:token])
    if result['result'] != 'success'
      return render :status => 404, :json => result.to_json
    end
    status = {}
    status['token'] = result['token']
    status['state'] = result['state']
    render :json => status.to_json
  end

  def request_receive
    CurrentDomain.module_available?('intercessio') or return render_404
    Rails.logger.error("Retrieving content for " + params[:token])
    doc = Intercessio::Connection.new().receive(params[:token])
    # Ideally we should not be reading in the entire doc.body here, but stream it out as we
    # get bytes from intercessio. Also; it's annoying that send_data overwrites custom
    # content disposition headers
    filename = /filename=([^;]*)/.match(doc['Content-disposition'])[1].to_s
    send_data(doc.body, :status => 200, :type => doc['Content-type'], :filename => filename)
  end
end

