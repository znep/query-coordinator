module Canvas2
  class Title < CanvasWidget
    def render_contents
      ['<h2>' + string_substitute(@properties['text']) + '</h2>', true]
    end
  end

  class Text < CanvasWidget
    def render_contents
      [string_substitute(@properties['html']), true]
    end
  end

  class DataRenderer < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ds = !context.blank? ? context[:dataset] : nil
      return ['', false] if ds.blank?

      page_size = 20
      current_page = Util.component_data_page(self.id)
      row_results = ds.get_rows(page_size, current_page, {}, true)

      t = '<div class="dataTableWrapper">'
      t += RenderType.table_html(self.id, ds.visible_columns, row_results[:rows], ds,
                                (current_page - 1) * page_size)

      # Paging
      path = Util.page_path
      params = Util.page_params.clone
      params['data_component'] = self.id
      path += '?' + params.map {|k, v| k + '=' + v}.join('&')
      t += Util.app_helper.create_pagination(
        row_results[:meta]['totalRows'], page_size, current_page, path, '', 'data_page')

      t += '<a href="' + ds.alt_href + '" class="altViewLink">Accessibly explore the data</a>'
      t += '</div>'
    end
  end

  class Chart < DataRenderer
  end
  class AreaChart < DataRenderer
  end
  class BarChart < DataRenderer
  end
  class BubbleChart < DataRenderer
  end
  class ColumnChart < DataRenderer
  end
  class DonutChart < DataRenderer
  end
  class LineChart < DataRenderer
  end
  class PieChart < DataRenderer
  end
  class TimelineChart < DataRenderer
  end
  class TreemapChart < DataRenderer
  end

  class Calendar < DataRenderer
  end

  class Map < DataRenderer
  end

  class Table < DataRenderer
  end

  class Menu < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Download < CanvasWidget
    def render_contents
      return ['', true] if context.nil?
      ['<a href="' + context[:dataset].download_url('csv') + '" class="button" rel="external">' +
         'Download this data</a>', true]
    end
  end

  class InlineFilter < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Pager < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class PagedContainer < Container
    def children
      return nil unless self.has_children?
      return @children unless @children.blank?
      @properties['children'].each_with_index { |c, i| c['hidden'] = true if i > 0 }
      super
    end

    def render_contents
      [super[0], false]
    end
  end

  class MultiPagedContainer < PagedContainer
  end

  class Carousel < PagedContainer
  end

  class FixedContainer < Container
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class EventConnector < CanvasWidget
    def render
      ['', false]
    end
  end
end
