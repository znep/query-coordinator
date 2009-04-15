#the is a base class for functionality that is shared for serving
#up swfs. (appController, widgetController)
class SwfController < ApplicationController
  helper_method :variables_for_swf

private
  def variables_for_swf
    variables = {}
    variables[:debug] = debug_mode?
    variables[:user_id] = current_user.oid

    timestamp = Time.now.to_f
    variables[:mat] = current_user.multiuser_authentication_token(timestamp)
    variables[:mats] = timestamp.to_s

    key_name = ActionController::Base.session_options[:session_key]
    core_session, rails_session = cookies[key_name].split('::')
    variables[key_name.to_sym] = rails_session if rails_session

    if REVISION_NUMBER
      variables[:revision] = REVISION_NUMBER
    end

    variables[:bridge_host] = MULTIUSER_BRIDGE_HOST
    variables[:bridge_port] = MULTIUSER_BRIDGE_PORT
    variables[:orbited_port] = MULTIUSER_ORBITED_PORT
    variables[:ie_port] = MULTIUSER_IE_PORT

    variables[:start_screen] = @start_screen

    if @discover_search
      variables[:discover_search] = @discover_search
    end

    if @popup
      variables[:popup] = @popup
    end

    if @view
      variables[:lens_id] = @view.oid
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
      "/swf/#{filename}?build=#{stamp}"
    elsif params[:sha]
      "/swf/#{params[:sha]}/#{filename}"
    elsif REVISION_NUMBER
      "/swf/#{REVISION_NUMBER}/#{filename}"
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
