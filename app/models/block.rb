class Block < ActiveRecord::Base
  include Immutable

  # We assume a 12-column grid.
  # Given this assumption, these layouts correspond to (respectively):
  # 100%, 50%/50%, 66%/33%, 33%/66%, 33%/33%/33% and 25%/25%/25%/25%
  VALID_BLOCK_LAYOUTS = [
    '12',
    '12-12',
    '12-12-12-12',
    '6-6',
    '8-4',
    '4-8',
    '4-4-4',
    '3-3-3-3'
  ]

  validates :layout, presence: true, inclusion: { in: VALID_BLOCK_LAYOUTS }
  validates :components, presence: true
  validates :created_by, presence: true

  scope :for_story, ->(story) do
    where(id: story.block_ids)
  end

  # Searches the json blog for components with the specified type and only returns those blocks
  #
  # Takes one or more component_types as parameters
  # Example:
  #
  # Returns all blocks that have one or more components of type 'image'
  #   Block.with_component_type('image')
  #
  # Returns all blocks that have one or more components of EITHER 'image' or 'hero' as their type
  #   Block.with_component_type('image', 'hero')
  #
  scope :with_component_type, ->(*component_types) do
    types_to_query = component_types
    unless types_to_query.is_a?(Array)
      types_to_query = [component_types]
    end
    queries = types_to_query.map { |type| [{ type: type }].to_json }
    query_string = Array.new(queries.length, "components @> ?").join(" OR ")

    # At this point, if there are more than one types, the query will end up looking like:
    # => where("components @> ? OR components @> ?", '[{"type":"image"}]', '[{"type":"hero"}]')
    where(query_string, *queries)
  end

  # Using our own config because it's more restrictive than the ones Sanitize provides.
  SANITIZE_CONFIG = {}
  SANITIZE_CONFIG['html'] = {
    :elements => %w(
      h1 h2 h3 h4 h5 h6
      div blockquote span
      ol ul li
      b i em
      a p br
    ),
    :attributes => {
      :all => [ 'class', 'style' ],
      'a' => [ 'href', 'target', 'rel' ]
    },
    :properties => %w( text-align color )
  }

  after_initialize do
    if components.is_a?(Array)
      (components || []).each do |component|

        # Because Rails will automatically convert empty arrays to nils in JSON
        # objects accessed from the `param` hash (see:
        # https://github.com/rails/rails/pull/8862), we need to go back and
        # unmunge the `filters` property of any vif found in a component back
        # to an empty array (VIF specifies that `filters` is always an array,
        # and we run the risk of breaking things downstream that actually
        # conform to the spec if we start persisting invalid VIFs).
        #
        # This code is also run when returning results from the database,
        # ensuring that even old vifs that were saved with the incorrect null
        # value for the `filters` key will be 'migrated' to the correct format
        # on page load, and therefore on the next save (all blocks are saved
        # every time regardless of whether they have changed).
        #
        # In practice, we determine if this 'migration' is necessary by
        # asserting that the 'vif' property of the value exists and has a
        # 'filters' key, but the value of the 'filters' key value is nil.
        vif = component.try(:[], 'value').try(:[], 'vif')

        if vif && vif['format']['version'] == 1 && vif['filters'].nil?
          component['value']['vif']['filters'] = []
        elsif vif && vif['format']['version'] == 2 && vif['series'][0]['dataSource']['filters'].nil?
          component['value']['vif']['series'][0]['dataSource']['filters'] = []
        end

        # We had some old code where blocks were not saved properly.
        # This prevents breakage if loading those blocks' components
        if component['type'] == 'html' && component.has_key?('value')
          component['value'] = Sanitize.fragment(
            component['value'],
            SANITIZE_CONFIG['html']
          )
        end

        if component['type'] == 'socrata.visualization.classic'
          view = CoreServer.get_view(component['value']['originalUid'])
          view['metadata']['renderTypeConfig']['visible']['table'] = false if view

          component['value']['visualization'] = view
        end
      end
    end
  end

  def serializable_attributes
    attributes.except('id')
  end

  def as_json(options = nil)
    self.serializable_attributes
  end

  def self.from_json(json_block)
    Block.new(
      layout: json_block[:layout],
      components: json_block[:components],
      created_by: json_block[:created_by]
    )
  end

end
