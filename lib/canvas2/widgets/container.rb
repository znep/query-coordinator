module Canvas2
  class Container < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      super(props, parent, resolver_context)
      # Reference the children here so they are instantiated, and get IDs
      children
    end

    def has_children?
      return @children.is_a?(Array) || @properties['children'].is_a?(Array)
    end

    def children
      return nil unless self.has_children?
      @children ||= CanvasWidget.from_config(
        @properties['children'].map do |c|
          c['contextId'] = @properties['childContextId'] || @properties['contextId'] if c['contextId'].blank?
          c
        end, self)
    end

    def render_contents
      return ['', true] if !has_children?
      threads = children.map {|c| Thread.new { c.render }}
      results = threads.map {|thread| thread.value};
      [results.map {|r| r[0]}.join(''), results.reduce(true) {|memo, r| memo && r[1]}]
    end

  protected
    def children=(children)
      @children = children
    end
  end
end
