module Canvas2
  class Title < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ['<h2>' + string_substitute(@properties['text']) + '</h2>', true]
    end
  end

  class Text < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      [string_substitute(@properties['html']), true]
    end
  end

  class Picture < CanvasWidget
    def render_contents
      if !@properties['asset'].blank? && !@properties['asset']['id'].blank?
        url = '/api/assets/' + string_substitute(@properties['asset']['id'])
        url += '?s=' +
          string_substitute(@properties['asset']['size']) if !@properties['asset']['size'].blank?
      elsif !@properties['url'].blank?
        url = string_substitute(@properties['url'])
      end
      title = string_substitute(@properties['title'])
      alt = @properties['alt'].blank? ? title : string_substitute(@properties['alt'])
      h = %Q(<img src="#{url}" title="#{title}" alt="#{alt}" />)
      [h, true]
    end
  end

  class Catalog < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      p = string_substitute(@properties)
      t = '<iframe frameborder="0" scrolling="auto" title="Catalog" width="800" height="600" ' +
        'src="/browse/embed?' +
        { defaults: p['defaults'],
          disable: Util.array_to_obj_keys(p['disabledItems'] || [], true),
          suppressed_facets: Util.array_to_obj_keys(p['disabledSections'] || [], true)
        }.to_param +
        '"></iframe>'
      [t, true]
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
      return ['', true] if context.nil? || context[:dataset].blank?
      t = string_substitute(@properties['text'])
      t = 'Download this data' if t.blank?
      ['<a href="' + context[:dataset].download_url('csv') + '" class="button" rel="external">' +
         t + '</a>', true]
    end
  end

  class Geolocator < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Search < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
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
      found_item = false
      if !@properties['defaultPage'].blank?
        def_page = string_substitute(@properties['defaultPage'])
        @properties['children'].each do |c, i|
          if c['id'] == def_page
            found_item = true
          else
            c['hidden'] = true
          end
        end
        if !found_item
          page_num = def_page.to_i
          if page_num >= 0 && page_num < @properties['children'].length
            found_item = true
            @properties['children'][page_num]['hidden'] = false
          end
        end
      end
      if !found_item
        @properties['children'].each_with_index { |c, i| c['hidden'] = i > 0 }
      end
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

    def render_contents
      [super[0], false]
    end
  end

  class GridContainer < Container
    def render_contents
      t = '<div class="row clearfix">'
      if has_children?
        ch = @properties['cellHeight']
        ch = ch.to_s + 'px' if !ch.is_a?(String)
        cw = @properties['cellWidth']
        cw = cw.to_s + 'px' if !cw.is_a?(String)
        cs = @properties['cellSpacing']
        cs = cs.to_s + 'px' if !cs.is_a?(String)

        vc = children.reject { |c| c.is_hidden }
        # We don't know the width, so just stick everything in one row with no border
        vc.each_with_index do |c, i|
          c.server_properties['styles'] ||= {}
          c.server_properties['styles']['width'] = cw
          c.server_properties['styles']['height'] = ch
          c.server_properties['styles']['padding'] = cs
          r = c.render
          t += r[0]
        end
      end
      [t += '</div>', false]
    end
  end

  class Comments < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Share < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ds = !context.blank? ? context[:dataset] : nil
      return ['', false] if ds.blank?

      vis_items = @properties['visibleItems'] || ['subscribe', 'facebook', 'twitter', 'email']
      hidden_items = @properties['hiddenItems'] || []
      vis_items = vis_items.reject { |item| hidden_items.include?(item) }

      avail_items = {
        subscribe: '<li class="subscribe' +
          (ds.is_public? && ds.is_tabular? && vis_items.include?('subscribe') ? '' : ' hide') +
          '" data-name="subscribe">' +
          '<a class="subscribe" href="#subscribe" title="Subscribe via Email or RSS">' +
            '<span class="icon">Subscribe to Changes</span></a></li>',

        email: '<li class="email' +
          (ds.is_public? && ds.is_tabular? && vis_items.include?('email') ? '' : ' hide') +
          '" data-name="email">' +
          '<a class="email" href="#email" title="Share via Email">' +
            '<span class="icon">Share via Email</span></a></li>',

        facebook: '<li class="facebook' + (vis_items.include?('facebook') ? '' : ' hide') +
          '" data-name="facebook">' +
          '<a class="facebook" rel="external" title="Share on Facebook" ' +
            'href="http://www.facebook.com/share.php?u=' +
              CGI::escape("http://#{CurrentDomain.cname}#{ds.href}") + '">' +
            '<span class="icon">Share on Facebook</span></a></li>',

      twitter: '<li class="twitter' + (vis_items.include?('twitter') ? '' : ' hide') +
        '" data-name="twitter">' +
          '<a class="twitter" rel="external" title="Share on Twitter"' +
              'href="http://twitter.com/?status=' + ds.tweet + '">' +
            '<span class="icon">Share on Twitter</span></a></li>'
      }

      t = '<ul>'
      vis_items.each do |item|
        item = item.to_sym
        t += avail_items[item] if !avail_items[item].nil?
        avail_items.delete(item)
      end
      avail_items.values.each { |item| t += item }
      [t + '</ul>', true]
    end
  end

  class Sort < CanvasWidget
    def render_contents
      sorts = []
      if context[:type] == 'dataset'
        sorts = context[:dataset].query.orderBys || []
      elsif context[:type] == 'column'
        sorts = context[:parent_dataset].query.orderBys || []
      end

      options = ''
      found_col = false
      sort_desc = false
      if context[:type] == 'dataset'
        context[:dataset].visible_columns.each do |c|
          is_sel = sorts.length > 0 && sorts[0]['expression']['columnId'] == c.id
          options += '<option value="' + c.fieldName + '"' + (is_sel ? ' selected="selected"' : '') +
            '>' + c.name + '</option>'
          sort_desc = !sorts[0]['ascending'] if is_sel
          found_col ||= is_sel
        end
      end
      options = '<option value=""' + (found_col ? '' : ' selected="selected"') +
        '>(Unsorted)</option>' + options

      if context[:type] == 'column'
        si = sorts.detect { |s| s['expression']['columnId'] == context[:column].id }
        found_col = !si.blank?
        sort_desc = !si['ascending'] if found_col
      end

      t = '<div class="datasetSort' + (context[:type] != 'dataset' ? ' hide' : '') + '">' +
          '<select id="' + id + '-datasetSort" name="datasetSort">' +
          options +
          '</select>' +
        '</div>' +
        '<div class="sortLinks clearfix ' + context[:type] + '">' +
          '<a href="#sortDir" class="sortDir ' +
            (!found_col ? 'sortAscLight ' : sort_desc ? 'sortDesc' : 'sortAsc') +
            (context[:type] == 'dataset' && found_col || context[:type] == 'column' ? '' : ' hide') +
            '"><span class="icon"></span></a>' +
          '<a href="#sortClear" class="sortClear remove' +
            (context[:type] != 'column' || !found_col ? ' hide' : '') +
            '"><span class="icon"></span></a>' +
        '</div>'
      [t, false]
    end
  end

  class EventConnector < CanvasWidget
    def render
      ['', false]
    end
  end
end
