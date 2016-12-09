require 'httparty'
class OdysseusController < ApplicationController
  skip_before_filter :require_user

  def index
    render_odysseus_path(request.path)
  end

  def classic_goal
    # redirect to the normal goal page if the goal
    # has been migrated away from classic narratives.
    if goal_has_published_narrative?(params[:goal_id])
      redirect_to(govstat_goal_path)
    else
      render_odysseus_path(request.path)
    end
  end

  def classic_single_goal
    # redirect to the normal single goal page if the goal
    # has been migrated away from classic narratives.
    if goal_has_published_narrative?(params[:goal_id])
      redirect_to(govstat_single_goal_path)
    else
      render_odysseus_path(request.path)
    end
  end

  def classic_goal_edit
    if using_storyteller_editor?
      redirect_to(govstat_goal_edit_path)
    else
      render_odysseus_path(request.path)
    end

  end

  def classic_single_goal_edit
    if using_storyteller_editor?
      redirect_to(govstat_single_goal_edit_path)
    else
      render_odysseus_path(request.path)
    end
  end

  def dashboard_preview
    @suppress_govstat = true
    index
  end

  def chromeless
    @suppress_chrome = true
    @suppress_govstat = true # remove background and other unnecessary styles
    render_odysseus_path(request.path, additional_style: 'govstat-chromeless')
  end

  def version
    odysseus_request('/version') do |res|
      render :json => res.body
    end
  end

  private

  def using_storyteller_editor?
    FeatureFlags.derive().open_performance_narrative_editor == 'storyteller'
  end

  def goal_has_published_narrative?(goal_uid)
    raise 'Unconfigured storyteller_uri' if APP_CONFIG.storyteller_uri.nil?
    raise 'goal_uid is blank' if goal_uid.blank?

    uri = URI.join(
      APP_CONFIG.storyteller_uri,
      "/stories/api/stat/v1/goals/#{goal_uid}/narrative/published/latest.json"
    )

    request_options = {
      format: :json,
      headers: {
        'Content-Type' => 'application/json',
        'Cookie' => request.headers['Cookie'],
        'X-Socrata-Host' => CurrentDomain.cname,
        'X-Socrata-RequestId' => request_id
      }.compact
    }

    begin
      response = HTTParty.get(uri, request_options)
    rescue Errno::ECONNREFUSED => e
      raise "Storyteller refused connection checking for published narrative: #{e}"
    end

    case response.code
      when 200
        true
      when 404
        false
      else
        # If storyteller or ody is down, the 5XX will have a giant HTML body that is useless
        # to us. Truncate body to a more reasonable length.
        response_message = response.body.to_s.truncate(2048)
        raise "Storyteller returned #{response.code} while checking for published narrative: #{response_message}"
    end
  end

  def render_odysseus_path(path, options = {})
    odysseus_request(path) do |res|
      odysseus_response = JSON.parse(res.body)
      styles = odysseus_response['styles'] || []
      styles.push(options[:additional_style]) if options[:additional_style]

      @title = odysseus_response['title'] || ''
      @style_packages = styles
      @script_packages = odysseus_response['scripts'] || []
      @objects = odysseus_response['objects']
      @contents = odysseus_response['markup']
      @client_version = odysseus_response['client_version']

      render 'index'
    end
  end

  def odysseus_request(path)
    odysseus_addr = ::ZookeeperDiscovery.get(:odysseus)
    return render_error(502) if odysseus_addr.nil?

    odysseus_uri = URI.parse('http://' + odysseus_addr)
    uri = URI::HTTP.build(host: odysseus_uri.host, port: odysseus_uri.port, path: path)
    req = Net::HTTP::Get.new(uri.request_uri)

    req['X-Socrata-Host'] = req['Host'] = CurrentDomain.cname
    req['X-Socrata-Locale'] = I18n.locale
    req['X-Socrata-Default-Locale'] = CurrentDomain.default_locale
    req['Cookie'] = request.headers['Cookie']

    begin
      res = Net::HTTP.start(uri.host, uri.port){ |http| http.request(req) }
    rescue => e
      if e.is_a?(Errno::ECONNREFUSED)
        Rails.logger.error("Got ECONNREFUSED when attempting to reach Odysseus on #{odysseus_addr}")
        return render_error(502)
      else
        Rails.logger.error("Got an unexpected error when attempting to reach Odysseus on #{odysseus_addr} - in edge cases, this may occur when a user has created too many goals")
        raise e
      end
    end

    if res.code == '400'
      return render_error(400)
    elsif res.code == '401'
      return current_user.nil? ? require_user : render_403
    elsif res.code == '403'
      return render_403
    elsif res.code == '404'
      return render_404
    elsif res.code == '500'
      return render_500
    else
      yield(res) if block_given?
    end
  end
end

