class DataslateRouting
  def self.for(path, options = {})
    ((RequestStore[:dataslate_routing] ||= {})[CurrentDomain.cname] ||=
      new(options.only(:custom_headers))).
      page_for(path, options)
  end

  def self.collision_free_path_for(path, options = {})
    existing_paths = ((RequestStore[:dataslate_routing] ||= {})[CurrentDomain.cname] ||=
      new(options.only(:custom_headers))).
      to_h.
      keys

    # Theoretically, we could search for holes instead of hitting the largest number,
    # but seriously... why bother? It's a vanishingly pointless security hole for a use
    # case we don't actually care about anymore because CS uses chalk and customers do not
    # create DataSlate pages on their own.
    last_collision = existing_paths.
      select { |e_path| e_path =~ /^#{path}(-\d+)?$/ }.
      sort_by { |e_path| e_path.match(/(?:-(\d+))?$/)[1].to_i }.
      last

    if last_collision.nil?
      path
    elsif last_collision == path
      last_collision + '-1'
    else
      last_collision.sub(/-(\d+)$/, &:succ)
    end
  end

  # Call this method sparingly! User.roles_list fetches information from Core to do their stuff.
  def self.clear_cache_for_current_domain!
    (User.roles_list + %w(superadmin anon)).
      map(&method(:cache_key)). # This _should_ create every possible cache key.
      each(&Rails.cache.method(:delete))
  end

  # The reason that the cache key includes the user role is to make sure that we don't cache
  # the routing table according to a lower-permissioned user, causing a 404 for a higher-
  # permissioned user.
  #
  # The choice of using the role list was made for two reasons:
  # 1) There are fewer roles than users, almost by definition.
  # 2) There is a finite, discoverable list of roles, enabling us to delete this cache.
  def self.cache_key(user = User.current_user)
    prefix = 'dataslate_routing'
    cname = CurrentDomain.cname
    user_key = user if user.is_a?(String)
    user_key ||= user.try(:role_name)
    user_key ||= 'superadmin' if user.try(:is_superadmin?)
    user_key ||= 'anon'

    [prefix, cname, user_key].compact.join(':')
  end

  # This method is entirely for debugging. Here's how you use it:
  # 1. Change config/config.yml corservice_uri to point at an appropriate core.
  # 2. Start `rails c` in the console.
  # 3. Execute `CurrentDomain.set('the.production.domain')`.
  # 4. Execute `DataslateRouting.debug` or `DataslateRouting.debug(report: true)`.
  def self.debug(options = {})
    ((RequestStore[:dataslate_routing] ||= {})[CurrentDomain.cname] ||=
      new(options.only(:custom_headers))).
      tap do |routing_object|
        # The :report option, in addition to returning the routing table, also
        # prints out every Dataslate path known to the system and the definition
        # it has for that path.
        next unless options.fetch(:report, false)

        routing_object.to_h.each do |path, definition|
          puts "#{path} => #{definition}"
        end
      end.routes
  end

  attr_reader :routes, :custom_headers
  alias :table :routes

  def initialize(options = {})
    @custom_headers = options.fetch(:custom_headers, {})
    @routes = Table.new

    construct_table_from_external_data!
  end

  def cache_key
    @cache_key ||= self.class.cache_key
  end

  def construct_table_from_external_data!
    serialized_hash = Rails.cache.read(cache_key)

    if serialized_hash.nil?
      Rails.logger.info("No cache for #{cache_key}. Fetching from core.")
      scrape_pages_service_for_paths!
      Rails.cache.write(cache_key, to_h, expires_in: APP_CONFIG.cache_dataslate_routing)
    else # deserialize the hash
      serialized_hash.each do |path, definition|
        unique_path = if path == :homepage then '/' else uniqify(path) end
        table.route_to(unique_path, definition)
      end
    end
  end

  def page_for(path, options = {})
    @custom_headers = options.fetch(:custom_headers, custom_headers)
    lookup = map_resolved_path_to_lookup_data(lookup_path(path))
    Rails.logger.debug("Mapped `#{path}` as #{lookup.inspect}")
    return if lookup.nil?

    page = Page.find_by_unique_path(lookup[:path], custom_headers)
    if page.present?
      { page: page,
        from: lookup[:from],
        # TODO: Later, when addressing DataSlate's globals-everywhere paradigm.
        #vars: Hash[page.path.split('/').select { |part| part.starts_with?(':') }.zip(lookup[:vars])]
        vars: lookup[:vars]
      }
    end
  end

  def flatten_routing_table_into_hash
    recursor = lambda do |table_layer, cursor, path_collection = {}|
      table_layer.each do |route_part, new_table_layer|
        path_parts = cursor + [route_part]
        if new_table_layer.resolution.present?
          path = route_part == :homepage ? '/' : path_parts.join('/')
          path_collection[path] = new_table_layer.resolution
        end
        recursor.call(new_table_layer, path_parts, path_collection)
      end
      path_collection
    end
    recursor.call(routes, [''])
  end
  alias :to_h :flatten_routing_table_into_hash

  private
  def uniqify(path, var_as = ':')
    return path if path.nil? || path == '/'
    path.split('/').map { |part| part.starts_with?(':') ? var_as : part }.join('/')
  end

  def lookup_path(path, ext = nil)
    path = "/#{path}".sub(/^\/\//, '/')
    path << ".#{ext}" if ext.present? && !%w(csv xlsx).include?(ext)
    uniqify(path)
  end

  def map_resolved_path_to_lookup_data(path)
    vars = []

    if path == '/'
      routes[:homepage]
    else
      path.split('/')[1..-1].inject(routes) do |lookup_cursor, part|
        break unless lookup_cursor.has_key?(part) || lookup_cursor.has_key?(':')
        lookup_cursor[part] || (vars << part && lookup_cursor[':'])
      end
    end.try(:resolution).try(:merge, vars: vars)
  end

  def scrape_pages_service_for_paths!
    Page.routing_table(custom_headers).each do |entry|
      unique_path = uniqify(entry['path'])
      table.route_to(unique_path, from: :service, path: unique_path)
    end
  end

  # The routing table is a nested hash that can be loosely represented as a tree.
  # A nested hash isn't fully able to represent this structure because every node could
  # have a valid value. DataslateRouting::Table is an extension of Hash that allows us
  # to set an extra value on each node beyond the key-value pairing.
  #
  # This allows us to handle cases when valid routes exist as subsets of other valid
  # routes: /foo must be able to map to a page even when /foo/bar also exists.
  #
  # If /foo is a Table, then it can resolve to page:foo even as /foo/bar instead
  # resolves to page:foo/bar.
  class Table < Hash
    def self.routed_to(route_definition)
      new.tap do |table|
        table.resolution = route_definition
      end
    end

    attr_accessor :resolution
    alias :resolves_to :resolution=

    def inspect
      super.tap do |inspection|
        inspection.prepend("(#{@resolution})") if @resolution
      end
    end

    def route_to(path, route_def)
      route_def[:invalid] = true if path_invalid?(path)

      # Valid paths always start with / so we don't care about the first token.
      path_parts = path.split('/')[1..-1]
      path_parts = [:homepage] if path_parts.nil?

      bottom = path_parts[0...-1].reduce(self) { |memo, layer| memo[layer] ||= self.class.new }
      if bottom[path_parts.last]
        bottom[path_parts.last].resolves_to route_def
      else
        bottom[path_parts.last] = Table.routed_to(route_def)
      end
    end

    private
    def path_invalid?(path)
      /^[^\/]/.match(path)
    end
  end
end
