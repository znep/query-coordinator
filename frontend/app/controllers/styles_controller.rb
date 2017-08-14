require 'tmpdir'
require 'digest/md5'
require 'listen'
require 'singleton'
require 'fileutils'

# BEWARE /node_modules/normalize.css has to appear above /node_modules
# otherwise SaSS will try to read normalize.css (which is a directory)
# as if it's a file :facepalm:
#
# KEEP IN SYNC with:
#   frontend/config/webpack/common.js#getStyleguideIncludePaths
#   storyteller/config/initializers/assets.rb
SCSS_LOAD_PATHS = %w(
  /../common/styleguide
  /../common
  /app/styles
  /..
  /../common/resources/fonts/templates
  /node_modules/normalize.css
  /node_modules
  /node_modules/bourbon-neat/app/assets/stylesheets
  /node_modules/bourbon/app/assets/stylesheets
  /node_modules/modularscale-sass/stylesheets
  /node_modules/react-datepicker/dist
  /node_modules/react-input-range/dist
  /node_modules/leaflet/dist
).map { |path| path.prepend(Rails.root.to_s) }

#NOTE A reasonable implementation might look at SCSS_LOAD_PATHS, but:
#  1. This includes .., which resolves to the entirety of platform-ui, and
#  2. the paths are nested. For instance, both node_modules and
#     node_modules/leaflet/dist are included.
# This causes performance/stability/duplicate notification issues. So we
# define some conservative set of paths and throw instructive errors if
# a file ends up depending on a path we're not watching.
# We can't incrementally build up this list at runtime because finding
# dependencies involves compiling the files in the first place. If all
# files are already cached, we won't know what files to listen to at all!
SCSS_WATCH_PATHS = %w(
  /../common
  /app/styles
  /node_modules
).map do |path|
  Pathname.new(path.prepend(Rails.root.to_s)).realpath.to_s
end

# Don't watch stuff in here - no need to, and the large file count
# is expensive to watch.
# Note! This must be a regexp.
SCSS_WATCH_EXCLUDE = %r{common/karma_config}

STYLE_CACHE_PATH = File.join(Dir.tmpdir, 'blist_style_cache')
unless File.directory?(STYLE_CACHE_PATH)
  begin
    FileUtils.mkdir_p(STYLE_CACHE_PATH)
  rescue Errno::EACCES => ex
    Rails.logger.error("unable to mkdir '#{STYLE_CACHE_PATH}', check permissions: #{ex}")
  end
end

class CSSImporter < Sass::Importers::Filesystem
  def extensions
    {
      'css' => :scss, # Allow direct importation of css files.
      'scss' => :scss,
      'sass' => :sass
    }
  end
end

# Our use of SCSS predates the asset pipeline. Ideally, we'd port our app to
# use plain old Rails SCSS support, but that is a big job (and will run into
# issues with custom site themes). Since we can't take advantage of the nice
# caching system that the asset pipeline affords, we are forced to implement
# our own (or suffer really long page load times in development mode).
# This cache implementation is fairly complicated because it must invalidate
# a compiled style if it or any file it depends upon are changed. It must
# therefore maintain some idea of a dependency graph.
#
# We use this dependency graph to cache compiled styles using a cache key
# comprised of the names and mtimes of all files that were involved in compiling
# a particular stylesheet. This means that if a style or its dependencies change,
# the cache key will also change (due to the mtime difference) and therefore the
# cache will be invalidated.
#
# Unfortunately, obtaining a stylesheet's dependencies is order-of-magnitude equivalent
# to outright compiling the stylesheet. Thus, we cache the dependency list until
# we detect a file change using OS-level file watchers. Then, when the stylesheet
# is actually loaded, we can be sure we're building a cache key which involves
# the latest set of dependencies. By invalidating the cache only on file change
# notifications, we can drastically lower the cost of checking cache staleness on
# stylesheet load time.
#
# On startup, our dependency graph cache is empty. It is populated on-demand
# on a per-stylesheet basis.
class DevelopmentCache
  include Singleton

  # Maps a dependency (absolute filesystem path of an @included file)
  # to a Set of top-level scss files (in style_packages.yml) having
  # that dependency (direct or indirect).
  # In other words, tells you what depends on a given scss file.
  #
  # Example:
  # a.scss:
  #   @import 'b.scss'
  # b.scss:
  #   h1 { color: red; }
  # c.scss:
  #   @import 'a.scss'
  #
  # reverse_dependencies = {
  #   'b.scss' => Set<'a.scss', 'c.scss'>,
  #   'a.scss' => Set<'c.scss'>
  # }
  attr_accessor :reverse_dependencies

  # Maps stylesheets to the set of files they @import (depend upon).
  # Regular ol' dependencies.
  # In the above example, would be:
  # forward_dependencies = {
  #   'a.scss' => Set<'b.scss'>,
  #   'b.scss' => Set<>
  #   'c.scss' => Set<'a.scss', 'b.scss'>
  # }
  attr_accessor :forward_dependencies

  def initialize
    @reverse_dependencies = {}
    @forward_dependencies = {}
    listener = Listen.to(
      *SCSS_WATCH_PATHS,
      :only => /\.scss/,
      :ignore => SCSS_WATCH_EXCLUDE
    ) do |modified, added, removed|
      (modified + added + removed).uniq.each do |path|
        record_file_change(path)
      end
    end
    listener.start # Nice-to-have: Shutdown cleanly if rails hot-reloads this class.
  end

  # Fetches a rendered stylesheet from the cache, or renders the stylesheet if the cache misses.
  # Expects to be given a block that yields a Sass::Engine instance set up to render the
  # stylesheet.
  def get(top_level_stylesheet_filename)
    raise 'Block required' unless block_given?

    # This process has never rendered this stylesheet. In order to validate its staleness
    # in the (on-disk, petsistent) cache, we must know the stylesheet's dependency list.
    unless knows_dependencies?(top_level_stylesheet_filename)
      Rails.logger.info("Styles Cache: Dependencies not yet known for #{top_level_stylesheet_filename}")
      engine = yield
      record_dependencies(top_level_stylesheet_filename, engine.dependencies)
    end

    if stale?(top_level_stylesheet_filename)
      Rails.logger.info("Styles Cache: Rendering #{top_level_stylesheet_filename}")
      engine = yield if engine.nil?
      result = engine.render
      cache_result(top_level_stylesheet_filename, result)
      result
    else
      Rails.logger.info("Styles Cache: Hit #{top_level_stylesheet_filename}")
      File.read(cache_filename(top_level_stylesheet_filename))
    end
  end

  private

  def cache_result(top_level_stylesheet_filename, result)
    File.open(cache_filename(top_level_stylesheet_filename), 'w') { |f| f.write result }
  end

  # Called when a scss file changes. Invalidates cache for anything that
  # depends on this file.
  def record_file_change(stylesheet_filename)
    Rails.logger.info("Styles Cache: #{stylesheet_filename} changed")
    reverse_dependencies.fetch(stylesheet_filename, []).each do |now_stale_filename|
      Rails.logger.info("Styles cache: Dependent stylesheet invalidated: #{now_stale_filename}")
    end
  end

  # When we render a stylesheet, we remember its dependencies so we can properly
  # invalidate its cache when dependencies are updated.
  def record_dependencies(top_level_stylesheet_filename, dependencies)
    dependency_file_names = dependencies.map { |dependency| dependency.options[:filename] }

    # Record the stylesheet's dependencies. We use this to compute cache keys
    # that take into account the mtime of the stylesheet AND its dependencies.
    # This enables us to detect changes to dependencies and recompile, even
    # if Rails was not running at the time of file update.
    forward_dependencies[top_level_stylesheet_filename] = dependency_file_names

    # Record the set of stylesheets that caused a particular dependency to be
    # included. This is used to efficiently invalidate cache while rails is
    # actually running.
    # For each file the stylesheet depends on...
    dependency_file_names.each do |dependency_file_name|
      # We only watch a subset of files for performance reasons. Error if
      # it turns out we actually needed to watch a broader set of files.
      assert_watching(dependency_file_name)

      # Record the stylesheet that imported us (initialize the set if necessary).
      dependents = reverse_dependencies.fetch(dependency_file_name) { Set.new }
      dependents.add(top_level_stylesheet_filename)
      reverse_dependencies[dependency_file_name] = dependents;
    end
  end

  # Raise unless we're watching the given file for changes.
  # We only watch a subset of files for performance reasons. Error if
  # it turns out we actually needed to watch a broader set of files.
  def assert_watching(file)
    unless SCSS_WATCH_PATHS.any? { |watched| file.include?(watched) }
      raise "Not watching #{file}. Add its containing directory to SCSS_WATCH_PATHS"
    end
  end

  def stale?(top_level_stylesheet_filename)
    !File.exists?(cache_filename(top_level_stylesheet_filename))
  end

  # Check if we already know a stylesheet's dependencies.
  # We need to know dependencies to compute a sane cache key.
  def knows_dependencies?(top_level_stylesheet_filename)
    forward_dependencies.has_key?(top_level_stylesheet_filename)
  end

  def cache_filename(top_level_stylesheet_filename)
    # We expect this to be called after recording dependencies in
    # DevelopmentCache#get. Were new code paths just added?
    unless knows_dependencies?(top_level_stylesheet_filename)
      raise "Dependencies not known for #{top_level_stylesheet_filename}, there's a bug in StylesController"
    end

    top_level_cache_key =
      "#{top_level_stylesheet_filename}-#{File.new(top_level_stylesheet_filename).mtime.to_i}"

    deps_cache_key = forward_dependencies[top_level_stylesheet_filename].sort.map do |dep|
      "#{dep}-#{File.new(dep).mtime.to_i}"
    end.join

    # Passing the key through hexdigest gives us a few advantages:
    #   - No possibility of special characters messing up our file name.
    #   - No possibility of running into OS-level path length limits.
    cache_key = Digest::MD5.hexdigest(
      [
        CurrentDomain.cname,
        top_level_cache_key,
        deps_cache_key
      ].join
    )

    File.join(STYLE_CACHE_PATH, cache_key)
  end
end

class StylesController < ApplicationController
  skip_before_filter :require_user, :set_user, :set_meta, :sync_logged_in_cookie, :poll_external_configs

  # Only used in development
  def individual
    path = params[:path]

    if path.present? && path.match(/^(\w|-|\.|\/)+$/)
      style_path_parts = [
        Rails.root,
        'app/styles'
      ]

      headers['Content-Type'] = 'text/css'

      scss_stylesheet_filename = File.join(style_path_parts + ["#{path}.scss"])
      css_stylesheet_filename = File.join(style_path_parts + ["#{path}.css"])

      # We have 2 cases:
      #  - The extension is .css. Return the css file.
      #  - The extension is .scss. Compile the scss template, cache its
      #    output and return it.

      if File.exist?(scss_stylesheet_filename)
        result = DevelopmentCache.instance.get(scss_stylesheet_filename) do
          stylesheet = File.read(scss_stylesheet_filename)
          Sass::Engine.new(
            get_includes + stylesheet,
            :filesystem_importer => CSSImporter,
            :style => :nested,
            :syntax => :scss,
            :cache => false,
            :load_paths => SCSS_LOAD_PATHS
          )
        end
        render :text => result
      elsif File.exist?(css_stylesheet_filename)
        render :text => File.read(css_stylesheet_filename)
      else
        # Someone asked for a stylesheet that didn't exist.
        render :nothing => true, :status => :not_found
      end
    else
      # someone's up to no good.
      render :nothing => true, :status => :not_found
    end
  end

  def merged
    if STYLE_PACKAGES[params[:stylesheet]].present?
      headers['Content-Type'] = 'text/css'
      # EN-14674: We've had trouble with assets cached after deploys. For now, cache for an hour.
      headers['Cache-Control'] = "public, max-age=3600"

      cache_key = generate_cache_key(params[:stylesheet])
      cached = Rails.cache.read(cache_key)

      if cached.nil?
        includes_cache_key = generate_cache_key('_includes')
        includes = Rails.cache.read(includes_cache_key)
        if includes.nil?
          includes = get_includes
          Rails.cache.write(includes_cache_key, includes)
        end

        rendered_styles = render_merged_stylesheets(includes)

        Rails.cache.write(cache_key, rendered_styles)
        render :text => rendered_styles
      else
        render :text => cached
      end
    else
      render :nothing => true, :status => :not_found, :content_type => 'text/css'
    end
  end

  def widget
    begin
      if params[:customization_id] == 'default'
        theme = WidgetCustomization.default_theme(1)
      else
        customization = WidgetCustomization.find(params[:customization_id])
        theme = customization.customization
        updated_at = customization.updatedAt
      end
    rescue CoreServer::CoreServerError => e
      render :nothing => true, :status => :not_found, :content_type => 'text/css'
    end
    headers['Content-Type'] = 'text/css'

    cache_key = generate_cache_key("widget.#{params[:customization_id]}.#{updated_at || 0}")
    cached = Rails.cache.read(cache_key) unless use_discrete_assets?

    if cached.nil?
      # get sitewide includes
      includes_cache_key = generate_cache_key('_includes')
      includes = Rails.cache.read(includes_cache_key) unless use_discrete_assets?
      if includes.nil?
        includes = get_includes
        Rails.cache.write(includes_cache_key, includes)
      end

      # get widget includes
      includes += get_includes_recurse(theme, @@widget_theme_parse)

      # render
      sheet = File.read("#{Rails.root}/app/styles/widget.scss")
      rendered_styles = Sass::Engine.new(includes + sheet,
                                         :filesystem_importer => CSSImporter,
                                         :style => :compressed,
                                         :syntax => :scss,
                                         :cache => false,
                                         :load_paths => SCSS_LOAD_PATHS).render
      Rails.cache.write(cache_key, rendered_styles)
      render :text => rendered_styles
    else
      render :text => cached
    end
  end

  def current_site
    headers['Content-Type'] = 'text/css'
    headers['Cache-Control'] = "public, max-age=604800"
    render :text => CurrentDomain.properties.custom_css
  end

  def govstat_site
    headers['Content-Type'] = 'text/css'
    headers['Cache-Control'] = "public, max-age=604800"
    render :text => CurrentDomain.properties.govstat_css
  end

  protected

  def render_merged_stylesheets(includes)
    scss_sheets = []
    css_sheets = []
    STYLE_PACKAGES[params[:stylesheet]].each do |sheet|
      fname = "#{Rails.root}/app/styles/#{sheet}.scss"
      if File.exist?(fname)
        scss_sheets.push(File.read(fname))
      else
        fname = "#{Rails.root}/app/styles/#{sheet}.css"
        css_sheets.push(File.read(fname))
      end
    end

    rendered_styles = css_sheets.join("\n")
    rendered_styles << Sass::Engine.new(
      includes + scss_sheets.join("\n"),
      :filesystem_importer => CSSImporter,
      :style => :compressed,
      :syntax => :scss,
      :cache => false,
      :load_paths => SCSS_LOAD_PATHS
    ).render

    # Wow, this is super important. Since stylesheets come from heterogenous
    # sources, and some of them might be utf-8, something (Ruby?) is going way
    # overboard adding BOMs willy nilly when we concatenate the contents of
    # each stylesheet. Accordingly, we need to use strip_byte_order_mark! to
    # search and destroy BOMs throughout the file (remember, there might be
    # many since we're concatenating a bunch of files together). Yuck!
    strip_byte_order_marks!(rendered_styles)
  end

  def strip_byte_order_marks!(string)
    string.gsub!("\xEF\xBB\xBF".force_encoding('utf-8'), '')
  end

  def get_includes
    STYLE_PACKAGES['includes'].map do |incl|
      "@import \"#{incl}.scss\";\n"
    end.join + get_includes_recurse(CurrentDomain.theme, @@site_theme_parse)
  end

  def normalize_color(color, want_pound = true)
    if want_pound
      color.start_with?('#') ? color : "##{color}"
    else
      color.start_with?('#') ? color[1..-1] : color
    end
  end

  def get_gradient_definition(name, value)
    result = ''

    stops = value.each{ |stop| stop['position'] =
      stop['position'].to_f unless stop['position'].nil? }

    gradient_string = stops.map{ |stop| stop.has_key?('position') ?
      "#{normalize_color(stop['color'], false)}:#{stop['position']}" : normalize_color(stop['color'], false) }.join(',')

    # ie (based on raw string)
    result += "@mixin box_gradient_#{name}($width, $height, $additional) {\n"
    result += '  background-image: url(/ui/box.png?w=#{$width}&h=#{$height}&fc=' +
                 gradient_string + '&#{$additional});' + "\n" +
              "}\n"

    first_stop = stops.first
    last_stop = stops.last
    stops.delete(stops.first) if stops.first['position'].nil?
    stops.delete(stops.last) if stops.last['position'].nil?

    result += "@mixin gradient_#{name} {\n"

    first_color = normalize_color(first_stop['color'])
    last_color = normalize_color(last_stop['color'])
    # firefox
    result += "  background: -moz-linear-gradient(0 0 270deg, #{first_color}, #{last_color}"
    prev_stop_position = 0
    stops.each do |stop|
      stop_position = (stop['position'] * 100).round
      if prev_stop_position == stop_position
        # firefox will ignore stops with duplicate positions
        prev_stop_position = stop_position + 1
      else
        prev_stop_position = stop_position
      end

      result += ", #{normalize_color(stop['color'])} #{prev_stop_position}%"
    end
    result += ");\n"

    # webkit
    result += '  background: -webkit-gradient(linear, left top, left bottom,' +
              " from(#{first_color}), to(#{last_color})" +
              stops.map{ |stop| ", color-stop(#{stop['position']},#{normalize_color(stop['color'])})" }.join +
              ");\n"

    # default background-color for fallback
    result += "  background-color: #{first_color};\n"
    result + "}\n"
  end

  def get_includes_recurse(hash, definition, path = '')
    result = ''
    unless hash.nil?
      hash.with_indifferent_access.each do |key, value|
        if definition[key.to_sym] == 'string'
          result += "$#{path}#{key}: \"#{value}\";\n"
        elsif definition[key.to_sym] == 'number'
          result += "$#{path}#{key}: #{value};\n"
        elsif definition[key.to_sym] == 'boolean'
          result += "$#{path}#{key}: #{value};\n"
        elsif definition[key.to_sym] == 'dimensions'
          result += "$#{path}#{key}: #{value[:value]}#{value[:unit]};\n"
        elsif definition[key.to_sym] == 'image'
          if value[:type].to_s == 'static'
            href = "#{value[:href]}"
          elsif value[:type].to_s == 'hosted'
            href = "/assets/#{value[:href]}"
          end
          result += "$#{path}#{key}: url(#{href});\n"
          result += "$#{path}#{key}_width: #{value[:width]}px;\n"
          result += "$#{path}#{key}_height: #{value[:height]}px;\n"
        elsif definition[key.to_sym] == 'color'
          if value.is_a? String
            # flat color
            if value.match(/([0-9a-f]{3}){1,2}/i) && !value.start_with?('#')
              # hex color (prepend #)
              result += "$color_#{path}#{key}: ##{value};\n"
            else
              # rgba color (pass through)
              result += "$color_#{path}#{key}: #{value};\n"
            end
            result += "$#{path}#{key}: #{value};\n"
          elsif value.is_a? Array
            # gradient
            next unless value.first.is_a? Hash # hack to accomodate current header color format

            result += get_gradient_definition(path + key.to_s, value.clone())
            colors = value.map {|s| s['color']}.reverse
            rev = []
            value.each_with_index do |s, i|
              a = {'color' => colors[i]}
              if !s['position'].nil?
                a['position'] = 1.0 - s['position'].to_f
              end
              rev << a
            end
            result += get_gradient_definition(path + key.to_s + '_reverse', rev)

          end
        elsif definition[key.to_sym].is_a? Hash
          result += get_includes_recurse(value, definition[key.to_sym], path + "#{key}_")
        end
      end
    end

    result
  end

  def generate_cache_key(item)
    "%s.%s.%s.%s.%s" % [
      CurrentDomain.cname,
      item,
      REVISION_NUMBER,
      CurrentDomain.default_config_id,
      CurrentDomain.default_config_updated_at
    ]
  end

  @@site_theme_parse = {
    :links     => { :normal      => 'color',
                    :visited     => 'color' },
    :buttons   => { :active      => { :background  => 'color',
                                      :border      => 'color',
                                      :shadow      => 'color',
                                      :text        => 'color' },
                    :disabled    => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                    :default     => { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' },
                    :default_disabled =>
                                    { :background  => 'color',
                                      :border      => 'color',
                                      :text        => 'color' } },
    :table     => { :header      => { :inactive    => 'color',
                                      :active      => 'color' } },
    :text      => { :error       => 'color' },
    :images    => { :logo_header => 'image',
                    :logo_footer => 'image' },
    :chrome    => { :background  => 'color',
                    :box_border  => 'color',
                    :margin      => { :inner       => 'dimensions',
                                      :outer       => 'dimensions' },
                    :sidebar     => { :background  => 'color',
                                      :text        => 'color' },
                    :nav_buttons => { :background  => 'color',
                                      :border      => 'color' } },
    :stories   => { :orientation => 'string',
                    :height      => 'dimensions',
                    :pager       => { :type        => 'string',
                                      :position    => 'string',
                                      :disposition => 'string' },
                    :box         => { :alpha       => 'number',
                                      :color       => 'color',
                                      :margin      => 'dimensions',
                                      :shadow      => 'number',
                                      :width       => 'dimensions',
                                      :headline    => { :color => 'color',
                                                        :font_family => 'string',
                                                        :font_size   => 'dimensions',
                                                        :shadow      => { :radius => 'dimensions',
                                                                          :alpha => 'number' } },
                                      :body        => { :color => 'color',
                                                        :font_family => 'string',
                                                        :font_size   => 'dimensions',
                                                        :shadow      => { :radius => 'dimensions',
                                                                          :alpha => 'number' } } } } }

  @@widget_theme_parse = {
    :frame     => { :border     => { :color => 'color',
                                     :width => 'dimensions' },
                    :color => 'color',
                    :orientation => 'string',
                    :padding => 'dimensions' },
    :toolbar   => { :color => 'color',
                    :input_color => 'color' },
    :logo      => { :image => 'image',
                    :href => 'string'},
    :menu      => { :button     => { :background => 'color',
                                     :background_hover => 'color',
                                     :border => 'color',
                                     :text => 'color' } },
    :grid      => { :font       => { :face => 'string',
                                     :header_size => 'dimensions',
                                     :data_size => 'dimensions' },
                    :header_icons => 'boolean',
                    :row_numbers => 'boolean',
                    :wrap_header_text => 'boolean',
                    :title_bold => 'boolean',
                    :zebra => 'color' }
  }
end
