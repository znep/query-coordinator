#the is a base class for functionality that is shared for serving
#up swfs. (appController, widgetController)
class SwfController < ApplicationController
  helper_method :variables_for_swf

private
  def variables_for_swf
    variables = {}
    variables[:debug] = debug_mode?
    # TODO: Real user ID
    #variables[:user_id] = @current_user.id
    variables[:user_id] = @cur_user.id

    timestamp = Time.now.to_f
    #variables[:mat] = @current_user.multiuser_authentication_token(timestamp)
    variables[:mats] = timestamp.to_s

    key_name = ActionController::Base.session_options[:session_key]
    variables[key_name.to_sym] = session.id

    if REVISION_NUMBER
      variables[:revision] = REVISION_NUMBER
    end

    variables[:mu_host] = MULTIUSER_HOST
    variables[:mu_port] = MULTIUSER_PORT
    variables[:mu_proxy_host] = MULTIUSER_PROXY_HOST || request.host 
    variables[:mu_proxy_port] = MULTIUSER_PROXY_PORT

    variables[:start_screen] = @start_screen

    if @discover_search
      variables[:discover_search] = @discover_search
    end

    if @lens
      variables[:lens_id] = @lens.id
    end
      #variables[:is_editable] = @lens.has_at_least_one_editable_share? || @lens.is_publicly_editable?
    #else
      #variables[:has_lenses] = @has_lenses
#      prefs = @current_user.preferences.collect do |pref| 
#        "#{pref.id}:#{pref.name}:#{pref.value}" 
#      end
#
#      variables[:preferences] = prefs.join(',') 
    #end

#    global_config =
#      GlobalConfiguration.find(:all,
#                               :conditions =>
#                                 ['global_configuration_category_id = ?',
#                                  @current_user.global_configuration_category_id])
#
#    variables[:global] =
#      global_config.collect { |gc| "#{gc.name}:#{gc.value}" }.join(',')
#        variables[:preferences] = @current_user.preferences.collect { | pref | pref.id.to_s + ":" + pref.name + ":" + pref.value }.join(",")

    return variables
  end

  # Modify the SWF URL for caching and custom builds
  # In order to support see-saw deployments, we explicitly keep old builds of
  # the swf around for clients with older caches to hit. Similarly, if we're
  # working in development, we don't want to have to use the full build system
  # and instead do some simple cache-busting based on the file's timestamp.
  def swf_url(filename)
    if params[:variant]
      suffix = "_#{params[:variant]}"
      filename.sub!(/^(.*)\.swf$/, "\\1#{suffix}.swf")
    end

    if File.exists?("#{SWF_DIR}/#{filename}")
      stamp = build_stamp(filename)
      "#{SWF_HOST}/swf/#{filename}?build=#{stamp}"
    elsif params[:sha]
      "#{SWF_HOST}/swf/#{params[:sha]}/#{filename}"
    elsif REVISION_NUMBER
      "#{SWF_HOST}/swf/#{REVISION_NUMBER}/#{filename}"
    else
      logger.fatal("Cannot find SWF to serve")
      return ''
    end
  end

  def build_stamp(swf_filename)
    begin
      File.stat("#{SWF_DIR}/#{swf_filename}").mtime.to_i
    rescue Errno::ENOENT
      nil
    end
  end

  def debug_mode?
    params[:debugConsole] || ENV["RAILS_ENV"] != 'production'
  end
end
