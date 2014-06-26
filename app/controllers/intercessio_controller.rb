class IntercessioController < ApplicationController

  def request_async
    CurrentDomain.module_enabled?('intercessio') or return render_404
    path = /\/intercessio\/request\/(.*)/.match(request.fullpath)[1]
    Rails.logger.info("Requesting " + path + " asynchronously")
    result = Intercessio::Connection.new().request(path, request.headers, @current_user)
    if result['result'] != 'success'
      return render :status => 500, :json => result.to_json
    end
    status = {}
    status['token'] = result['token']
    status['path'] = path
    render :json => status.to_json

  end

  def request_status
    CurrentDomain.module_enabled?('intercessio') or return render_404
    @token = params[:token]
    # bad request on invalid token
    if invalid_token(@token)
      render_error(400)
      return true
    end
    Rails.logger.error("Retrieving the status for " + @token)
    result = Intercessio::Connection.new().status(@token, @current_user)
    if result['result'] != 'success'
      return render :status => 404, :json => result.to_json
    end
    status = {}
    status['token'] = result['token']
    status['state'] = result['state']
    render :json => status.to_json
  end

  # Provides the bytes of the requested document, or a mildly disturbing error
  # page
  def request_receive
    CurrentDomain.module_enabled?('intercessio') or return render_404
    @token = params[:token]
    # bad request on invalid token
    if invalid_token(@token)
      render :template => "intercessio/bad_token", :layout => 'main', :status => 400
      return true
    end
    Rails.logger.error("Retrieving content for " + @token)
    doc = Intercessio::Connection.new().receive(@token, @current_user)
    if !doc.is_a?(Net::HTTPSuccess)
      render :template => "intercessio/request_error", :layout => 'main', :status => 404
      return true
    end
    # Ideally we should not be reading in the entire doc.body here, but stream it out as we
    # get bytes from intercessio. Also; it's annoying that send_data overwrites custom
    # content disposition headers
    filename = /filename=([^;]*)/.match(doc['Content-disposition'])[1].to_s
    send_data(doc.body, :status => 200, :type => doc['Content-type'], :filename => filename)
  end

  private

  # Tokens are md5sums
  def invalid_token(t)
    (t =~ /^[0-9A-F]{32}$/i).nil?
  end
end

