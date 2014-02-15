# encoding: UTF-8

module Canvas2
  class Title < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ['<h2>' + CGI::escapeHTML(string_substitute(@properties['text'])) + '</h2>', true]
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

  #A component that supports the display of Markdown content.
  class FormattedText < CanvasWidget

    #The Markdown converter shared between all FormattedText instances.
    @@markdown = Redcarpet::Markdown.new(Redcarpet::Render::HTML)

    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      markdown = string_substitute(@properties['markdown'])
      url_matcher = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/i

      # Markdown supports a TOC-style hyperlink mode.
      loc_of_toc = markdown.index(/^\[\d+\]: [^\s]+$/m);
      escaped_section = ''
      plain_section = ''
      if (loc_of_toc)
        escaped_section = markdown[0..loc_of_toc-1]
        plain_section = markdown[loc_of_toc..-1]
      else
        escaped_section = markdown;
      end

      escaped_section = escaped_section.gsub(url_matcher) do |matched_substring|
        matched_substring.gsub("_", "\\_")
      end

      markdown = escaped_section + plain_section;

      safe_markdown = strip_html_from_markdown(markdown)
      unsafe_html_result = convert_markdown_to_html(safe_markdown)
      safe_html_result = sanitize_html(unsafe_html_result)
      final_html_result = Util.auto_hyperlink_html(safe_html_result)
      final_html_result = '' if final_html_result == nil
      [final_html_result, true]
    end

    #Sanitizes the given HTML using a moderate whitelist, allowing tags and
    # attributes expected from Markdown rendering.
    # Keep this in sync with formatted-text.js!
    def sanitize_html(unsafe_html)
      Sanitize.clean(unsafe_html, Util::RELAXED_SANITIZE_FILTER)
    end

    #Removes all HTML from a Markdown document, except spans and divs with
    # only a class attribute (to allow for extra styling).
    # Keep this in sync with formatted-text.js!
    def strip_html_from_markdown(unsafe_html)
      Sanitize.clean(unsafe_html, Util::STRICT_SANITIZE_FILTER)
    end

    #Render the given Markdown document into HTML.
    # Keep this in sync with formatted-text.js!
    def convert_markdown_to_html(markdown)
      @@markdown.render(markdown)
    end
  end

  #A component that supports the display of sanitized HTML.
  class SafeHtml < CanvasWidget

    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      substituted = string_substitute(@properties['html'])
      sanitized = Sanitize.clean(substituted, Util::RELAXED_SANITIZE_FILTER)
      if (@properties['autoLink'])
        return [Util.auto_hyperlink_html(sanitized), true]
      else
        return [sanitized, true]
      end
    end
  end

  class Header < Picture
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Catalog < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      p = string_substitute(@properties)
      params = {
          disable: Util.array_to_obj_keys(p['disabledItems'] || [], true),
          suppressed_facets: Util.array_to_obj_keys(p['disabledSections'] || [], true)
        }
      params = p['defaults'].merge(params) if p['defaults'].present?
      t = '<iframe frameborder="0" scrolling="auto" title="Catalog" width="800" height="600" ' +
        'src="' + embed_browse_path + '?' + params.to_param + '"></iframe>'
      [t, true]
    end
  end

  class NewCatalog < Container
    def render_contents
      if context.nil? || context[:type] != 'datasetList'
        set_context({ type: 'datasetList', noFail: true, search: { limit: 20 } }.with_indifferent_access)
      end
      conf = default_config(string_substitute(@properties), context[:id])
      @children = CanvasWidget.from_config(conf, self).compact
      result = super
      result[0] += '<span class="dataCarrier hide" data-catalogconfig="' +
        CGI::escapeHTML(conf.to_json) + '"></span>'
      result
    end

    def default_config(props, dc_id)
      disabled_sections = Util.array_to_obj_keys(props['disabledSections'] || [], true)
      disabled_items = Util.array_to_obj_keys(props['disabledItems'] || [], true)
      defaults = props['defaults'] || {}

      [{
        type: 'HorizontalContainer',
        children: [
        {
          weight: 2,
          type: 'Container',
          htmlClass: 'sidebar',
          children: [
          (disabled_sections['sort'] ? nil : { type: 'Sort' }),
          {
            type: 'Search',
            isList: true
          },
          (disabled_sections[t('controls.browse.facets.view_types_singular_title')] ? nil :
            {
              type: 'DatasetListFilter',
              facet: 'viewTypes'
            }),
          (disabled_sections[t('controls.browse.facets.categories_singular_title')] ? nil :
            {
              type: 'DatasetListFilter',
              facet: 'categories'
            }),
          (disabled_sections[t('controls.browse.facets.topics_singular_title')] ? nil :
            {
              type: 'DatasetListFilter',
              facet: 'topics'
            }),
          (disabled_sections[t('controls.browse.facets.federated_domains_singular_title')] ? nil :
            {
              type: 'DatasetListFilter',
              facet: 'federatedDomains'
            })
          ]
        },
        {
          weight: 8,
          type: 'Container',
          children: [
          (disabled_items['table_header'] ? nil : {
            type: 'HorizontalContainer',
            htmlClass: 'header',
            children: [
              { type: 'FormattedText', markdown: 'Name', weight: 8 },
              { type: 'FormattedText', markdown: 'Popularity', weight: 1 },
              { type: 'FormattedText', markdown: 'RSS', weight: 1 }
            ]
          }),
          {
            type: 'Repeater',
            htmlClass: 'results',
            container: {
              type: 'MultiPagedContainer',
              id: 'catalogPagedContainer',
              pageSize: 10
            },
            noResultsChildren: [
              { type: 'Title', customClass: 'noResults', text: (defaults['no_results_text'] ||
                                                                t('controls.browse.listing.no_results')) }
            ],
            children: [
            {
              type: 'HorizontalContainer',
              htmlClass: 'item {dataset.domainCName /.+/federated/ ||}',
              children: [
              {
                type: 'Container',
                weight: 8,
                children: [
                { type: 'Picture', customClass: 'largeImage',
                  htmlClass: 'datasetImage datasetIcon {dataset.preferredImageType}',
                  url: '{dataset.preferredImage}', alt: '{dataset.name}',
                  ifValue: 'dataset.preferredImage' },
                { type: 'SafeHtml', customClass: 'largeImage',
                  html: '<div class="datasetIcon type type{dataset.styleClass}" ' +
                  'title="{dataset.displayName $[u]}"><span class="icon"></span></div>',
                  ifValue: { key: 'dataset.preferredImage', negate: true } },
                { type: 'Picture', customClass: 'domainIcon',
                  url: '/api/domains/{dataset.domainCName}/icons/smallIcon',
                  alt: t('controls.browse.listing.federation_source',
                         { source: '{dataset.domainCName}' }), ifValue: 'dataset.domainCName' },
                 { type: 'Button', notButton: true, customClass: 'datasetLink',
                   external: props['externalLinks'],
                   href: '/d/{dataset.id}', text: '{dataset.name ||(unnamed)}' },
                 { type: 'SafeHtml', customClass: 'federationSource',
                   html: t('controls.browse.listing.federation_source_html',
                           { source_link: ('<a href="https://{dataset.domainCName}">' +
                             '{dataset.domainCName}</a>').html_safe }),
                   ifValue: 'dataset.domainCName' },
                 { type: 'FormattedText', customClass: 'description',
                   markdown: '{dataset.description ||}' }
                ]
              },
              { type: 'FormattedText', weight: 1, customClass: 'views',
                markdown: '{dataset.viewCount %[,0] || 0} ' + t('core.analytics.visits') },
              { type: 'SafeHtml', weight: 1, customClass: 'rss',
                html: '<a href="/api/views/{dataset.id}/rows.rss" title="' +
                t('controls.browse.actions.dataset_subscribe') + '"><div class="subscribe">' +
                '<span class="icon"></span></div></a>' }
              ]
            }
            ]
          },
          {
            type: 'EventConnector',
            sourceContextId: dc_id,
            sourceEvent: 'data_change',
            destComponentId: 'catalogPager',
            transformations: [{
              sourceKey: 'count',
              destProperty: 'hidden',
              rules: [
                { result: true, operator: 'equals', value: 0 },
                { result: false, operator: 'not_equals', value: 0 }
              ]
            }]
          },
          (disabled_items['pagination'] ? nil : {
            type: 'Pager',
            id: 'catalogPager',
            pagedContainerId: 'catalogPagedContainer',
            selectorStyle: 'navigate',
            navigateStyle: 'paging',
            navigateWrap: false,
            showFirstLastPageLink: true,
            navigateLinksAsButtons: true
          })
          ]
        }
        ]
      }.with_indifferent_access]
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
      row_results = ds.get_rows(page_size, current_page, {}, true, !Canvas2::Util.is_private)

      t = '<noscript><div class="dataTableWrapper">'
      t += RenderType.table_html(self.id, ds.visible_columns, row_results[:rows], ds,
                                (current_page - 1) * page_size)

      # Paging
      path = Util.page_path
      params = Util.page_params.clone
      params['data_component'] = self.id
      path += '?' + params.map {|k, v| k + '=' + v}.join('&')
      t += Util.app_helper.create_pagination(
        row_results[:meta]['totalRows'], page_size, current_page, path, '', 'data_page')

      t += '<a href="' + alt_view_path(ds) + '" class="altViewLink">Accessibly explore the data</a>'
      t += '</div></noscript>'
      [t, false]
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

  class Visualization < DataRenderer
  end

  class Table < DataRenderer
  end

  class TabularData < CanvasWidget
    protected
    def columns
      return @cols if !@cols.blank?

      @cols = []
      if @properties['columns'].is_a?(Array)
        @cols = string_substitute(@properties['columns'])
      elsif @properties['columns'].is_a?(Hash) && @properties['columns']['datasetColumns'] &&
        !context.nil? && !context[:dataset].blank?
        ex_f = string_substitute(@properties['columns']['excludeFilter'])
        ex_f = [] if ex_f.blank?
        inc_f = string_substitute(@properties['columns']['includeFilter'])
        inc_f = [] if inc_f.blank?
        context[:dataset].visible_columns.each do |c|
          unless ex_f.all? {|k, v| !(Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))} &&
            (@properties['columns']['includeFilter'].blank? ||
             inc_f.any? {|k, v| (Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))})
            next
          end

          @cols.push({ 'id' => c.fieldName, 'text' => c.name })
        end
      end
      @cols
    end

    def head_row
      head_config = string_substitute(@properties['header'] || {})
      if !head_config.nil? && head_config.is_a?(Hash) && head_config['columns'] && columns.length > 0
        header_row = { 'cells' => columns.map do |c|
          { 'value' => c['text'], 'htmlClass' => c['id'], 'isColumn' => true }
        end }
      elsif !@properties['header'].nil? && @properties['header'].is_a?(Array)
        header_row = {"cells" => @properties['header']}
      else
        header_row = @properties['header'] || {}
      end
      add_row({ 'isHeader' => true }.merge(header_row))
    end

    def body_rows
      b_rows = []
      if !context.blank?
        if context[:type] == 'dataset'
          row_count = string_substitute(@properties['rowBodyCount'] || 100)
          row_page = string_substitute(@properties['rowBodyPage'] || 1)
          if Canvas2::Util.no_cache
            rows = context[:dataset].get_rows(row_count, row_page, {}, false, !Canvas2::Util.is_private)
          else
            rows = context[:dataset].get_cached_rows(row_count, row_page, {}, !Canvas2::Util.is_private)
          end
          rows[:rows].each_with_index do |r, i|
            b_rows.push(add_row(@properties['row'], context[:dataset].row_to_SODA2(r), i, rows.length))
          end
        elsif context[:type] == 'datasetList'
          context[:datasetList].each_with_index { |ds, i| b_rows.push(add_row(@properties['row'], ds, i, context[:datasetList].length)) }
        end
      end
      b_rows
    end

    def add_row(config, row = nil, row_index = nil, row_length = nil)
      if !row_index.nil? && !row_length.nil?
        row = (row || {}).merge({ _rowIndex: row_index, _rowDisplayIndex: row_index + 1,
                          _rowEvenOdd: (row_index % 2) == 0 ? 'evenRow' : 'oddRow',
                          _rowFirstLast: row_index == 0 ? 'firstRow' :
                            row_index == row_length - 1 ? 'lastRow' : 'innerRow' })
      end

      comp_row = PrivateTabularDataRow.new(config.clone(), self, row)
      config = comp_row.string_substitute(config)

      if config.has_key?('valueRegex')
        r = Regexp.new(config['valueRegex']['regex'])
        v = config['valueRegex']['value']
        result = r.match(v).blank?
        result = !result if config['valueRegex']['invert']
        return '' if result
      end

      cells = []
      if config['cells'].is_a?(Hash) && columns.length > 0
        cells = columns.map.with_index { |col, i| add_cell(config['cells'][col['id']], config,
                                                   i, columns.length, col['id']) }
      elsif config['cells'].is_a?(Array)
        cells = config['cells'].map.with_index { |cl, i| add_cell(cl, config, i, cells.length) }
      end
      render_row(cells, config)
    end

    def render_row(cells, config)
      ''
    end

    def add_cell(cell, row_config, col_index, col_length, col_id = nil)
      cell = string_substitute(cell || {}, { _colIndex: col_index,
                              _colDisplayIndex: col_index + 1,
                              _colEvenOdd: (col_index % 2) == 0 ? 'evenCol' : 'oddCol',
                              _colFirstLast: col_index == 0 ? 'firstCol' :
                                (col_index == col_length - 1) ? 'lastCol' : 'innerCol' })
      render_cell(cell, row_config, col_id)
    end

    def render_cell(cell, row_config, col_id)
      ''
    end
  end

  class PrivateTabularDataRow < CanvasWidget
    def is_hidden
      true
    end

    def render
      ['', false]
    end
  end

  class SimpleTable < TabularData
    def render_contents
      head = head_row

      tbody_rows = body_rows
      caption_class = ''
      head_class = ''
      foot_class = ''
      if tbody_rows.length < 1 && @properties.has_key?('noResults')
        nr_conf = string_substitute(@properties['noResults'])
        tbody_rows.push(add_row(nr_conf['row'])) if nr_conf.has_key?('row')
        caption_class = 'hide' if nr_conf['hideCaption']
        head_class = 'hide' if nr_conf['hideHeader']
        foot_class = 'hide' if nr_conf['hideFooter']
      end

      t = '<table><caption class="' + caption_class + '">' +
        string_substitute(@properties['caption']) + '</caption>' +
        '<colgroup>' +
        columns.map { |c| '<col class="' + (c['id'] || '').to_s + '" />' }.join('') +
        '</colgroup>' +
        '<thead class="' + head_class + '">' + head + '</thead>' +
        '<tbody>' + tbody_rows.join('') + '</tbody>' +
        '<tfoot class="' + foot_class + '">' + add_row(@properties['footer'] || {}) + '</tfoot></table>'
      [t, true]
    end

    protected

    def render_row(cells, config)
      '<tr class="' + (config['htmlClass'] || '') + '">' + cells.join('') + '</tr>'
    end

    def render_cell(cell, row_config, col_id)
      tag = row_config['isHeader'] || cell['isHeader'] ? 'th' : 'td'
      scope = ''
      scope = 'scope="row"' if cell['isHeader']
      scope = 'scope="col"' if row_config['isHeader'] && cell['isColumn']
      '<' + tag + ' class="' + [col_id, cell['htmlClass']].compact.join(' ') + '"' + scope + '>' +
        (cell['value'] || '').to_s + '</' + tag + '>'
    end
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
         t + '</a>', false]
    end
  end

  class Select < CanvasWidget

    require 'action_view/helpers/tag_helper'

    include ActionView::Helpers::TagHelper

    def render_contents
      if properties['options'].present?
        option_tags = build_option_tags(string_substitute(properties['options']))
      elsif context.present? && context[:type] == 'dataset'
        option_tags = build_option_tags(map_dataset_values)
      else
        return ['', true]
      end

      add_placeholder(option_tags)

      [content_tag(:select, option_tags.join.html_safe), true]
    end

    def find_row_field(key)
      rowField = string_substitute(properties['rowFields'][key])
      context[:dataset].columns.detect { |column| column.fieldName == rowField }.try(:id)
    end

    def fetch_rows
      rowStart = properties['rowStart'] || 0
      rowLength = properties['rowLength'] || 10
      context[:dataset].get_rows(rowStart + rowLength)[:rows].slice(rowStart, rowLength)
    end

    def map_dataset_values
      rowFieldValueId = find_row_field('value').to_s
      unless rowFieldValueId.present?
        raise "Unable to find column for #{properties['rowFields']['value']}"
      end
      rowFieldLabelId = (find_row_field('label') || rowFieldValueId).to_s
      fetch_rows.map do |row|
        { 'label' => row[rowFieldLabelId], 'value' => row[rowFieldValueId] }
      end
    end

    def build_option_tags(items)
      currentValue = string_substitute(properties['currentValue'])
      currentIndex = string_substitute(properties['currentIndex'])
      items.each_with_index.map do |item, index|
        options = { value: item['value'] }
        if item['value'] == currentValue || index == currentIndex
          options.merge!(selected: 'selected')
        end
        content_tag(:option, item['label'], options)
      end
    end

    def add_placeholder(option_tags)
      placeholderValue = string_substitute(properties['placeholderValue'])
      if placeholderValue.present?
        option_tags.unshift(
          content_tag(:option,
            placeholderValue['label'],
            value: placeholderValue['value']
          )
        )
      end
    end

  end

  class Button < CanvasWidget
    def render_contents
      init_state = string_substitute(@properties['states'] || 'state0')
      init_state = init_state.is_a?(Array) ? init_state[0] : init_state

      items = {}
      ['text', 'title', 'href'].each do |k|
        item = @properties[k]
        items[k] = item.is_a?(Hash) ? item[init_state] : item
        items[k] = items[k].nil? ? '' : items[k]
      end

      ['<a href="' + string_substitute(items['href']) + '" class="' +
        (!@properties['notButton'] ? 'button ' : '') + init_state +
        '" title="' + string_substitute(items['title']) + '" rel="' +
        (@properties['external'] ? 'external' : '') +
        '">' + string_substitute(items['text']) + '</a>', true]
    end
  end

  class Geolocator < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Search < CanvasWidget
    def render_contents
      return ['', true] if context.nil?
      cur_val = nil
      if context[:type] == 'dataset'
        cur_val = context[:dataset].searchString
      elsif context[:type] == 'datasetList'
        context[:datasetList].each do |dc|
          ss = dc[:dataset].searchString
          cur_val = cur_val.nil? || ss == cur_val ? ss : ''
        end
      end
      has_val = !cur_val.blank?

      box_id = self.id + '_searchBox'
      t = '<form action="#" class="searchForm">' +
        '<div class="searchBoxContainer' + (@properties['hideSearchIcon'] != true ? ' hasSearchIcon' : '') +
          (@properties['hideClearButton'] != true ? ' hasClearButton' : '') + '">' +
          '<a href="#search" class="searchIcon' +
            (@properties['hideSearchIcon'] == true ? ' hide' : '') + '" title="' +
            string_substitute(@properties['iconPrompt'] || 'Find') + '"></a>' +
          '<label for="' + box_id + '" class="accessible">Search text</label>' +
          '<input type="text" id="' + box_id + '" class="searchField textPrompt' +
            (has_val ? '' : ' prompt') + '" value="' +
            (has_val ? cur_val : string_substitute(@properties['searchPrompt'] || 'Find')) + '" />' +
          '<a href="#clear" class="clearSearch close' +
            (@properties['hideClearButton'] == true || !has_val ? ' hide' : '') +
            '" title="' + string_substitute(@properties['clearPrompt'] || 'Clear') +
            '"><span class="icon"></span></a>' +
        '</div>' +
        '<input type="submit" class="searchButton button' +
          (@properties['showSearchButton'] ? '' : ' hide') + '" value="' +
          string_substitute(@properties['buttonText'] || 'Find') + '" />' +
        '</form>'
      [t, false]
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
      return @children unless @children.nil?
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

  class ListItemContainer < Container
    def render_contents
      l_tag = @properties['listTag'] || 'ul'
      t = '<' + l_tag + ' class="' + string_substitute(@properties['listCustomClass']) + '">'
      end_tag = '</' + l_tag + '>'
      return [t + end_tag, true] if !has_children?

      results = QueueThreadPool.process_list(children) do |c|
        r = c.render
        i_tag = c.string_substitute(@properties['itemTag'])
        i_tag = {'ul' => 'li', 'ol' => 'li', 'dl' => 'dd'}[l_tag] || 'div' if i_tag.blank?
        ['<' + i_tag + ' class="liWrapper ' + c.string_substitute(@properties['itemCustomClass'] || '') +
          '">' + r[0] + '</' + i_tag + '>', r[1]]
      end
      [t + results.map {|r| r[0]}.join('') + end_tag, results.reduce(true) {|memo, r| memo && r[1]},
        results.map {|r| r[2]}]
    end
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
      child_timings = []
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
          child_timings.push(r[2])
        end
      end
      [t += '</div>', false, child_timings]
    end
  end

  class FloatGridContainer < Container
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      [super[0], false]
    end
  end

  class Comments < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end
  end

  class Print < CanvasWidget
    def render_contents
      [super[0], false]
    end
  end

  class Share < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      ds = !context.blank? ? context[:dataset] : nil
      return ['', false] if ds.blank? && !@properties['currentPage']

      vis_items = @properties['visibleItems'] || ['subscribe', 'facebook', 'twitter', 'email']
      hidden_items = @properties['hiddenItems'] || []
      vis_items = vis_items.reject { |item| hidden_items.include?(item) ||
        @properties['currentPage'] && item == 'subscribe' }

      page_url = Util.page_path || ''
      params = Util.page_params.clone
      page_url += '?' + params.map {|k, v| k + '=' + v}.join('&') if !params.empty?
      page_url = 'http://' + CurrentDomain.cname + page_url
      page_name = @@page.name

      avail_items = {
        subscribe: '<li class="subscribe' +
          (!ds.blank? && ds.is_public? && ds.is_tabular? && vis_items.include?('subscribe') ? '' : ' hide') +
          '" data-name="subscribe">' +
          '<a class="subscribe" href="#subscribe" title="Subscribe via Email or RSS">' +
            '<span class="icon">Subscribe to Changes</span></a></li>',

        email: '<li class="email' +
          ((ds.blank? || ds.is_public? && ds.is_tabular?) && vis_items.include?('email') ? '' : ' hide') +
          '" data-name="email">' +
          '<a class="email" href="' +
          (@properties['currentPage'] ?
           'mailto:?subject=' + CGI::escape("#{page_name} on #{CurrentDomain.strings.company}") + '&body=' +
            CGI::escape("#{page_url}") :
             '#email') + '" title="Share via Email">' +
            '<span class="icon">Share via Email</span></a></li>',

        facebook: '<li class="facebook' + (vis_items.include?('facebook') ? '' : ' hide') +
          '" data-name="facebook">' +
          '<a class="facebook" rel="external" title="Share on Facebook" ' +
            'href="https://www.facebook.com/dialog/feed?app_id=303443389788866&' +
              'link=' + (@properties['currentPage'] ? CGI::escape(page_url) :
              CGI::escape(view_url(ds))) +
              '&name=' + CGI::escape(page_name) + '">' +
            '<span class="icon">Share on Facebook</span></a></li>',

      twitter: '<li class="twitter' + (vis_items.include?('twitter') ? '' : ' hide') +
        '" data-name="twitter">' +
          '<a class="twitter" rel="external" title="Share on Twitter"' +
              'href="http://twitter.com/?status=' +
              (@properties['currentPage'] ?
               CGI::escape("Check out #{page_name} on #{CurrentDomain.strings.company}: #{page_url}") :
                ds.tweet) + '">' +
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
      return ['', true] if context.nil?
      sorts = []
      if context[:type] == 'dataset' || context[:type] == 'column'
        sorts = context[:dataset].query.orderBys || []
      end

      ds_options = ''
      found_col = false
      sort_desc = false
      ex_f = string_substitute(@properties['excludeFilter'])
      ex_f = [] if ex_f.blank?
      inc_f = string_substitute(@properties['includeFilter'])
      inc_f = [] if inc_f.blank?
      if context[:type] == 'dataset'
        context[:dataset].visible_columns.each do |c|
          unless ex_f.all? {|k, v| !(Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))} &&
            (@properties['includeFilter'].blank? ||
             inc_f.any? {|k, v| (Array.try_convert(v) || [v]).include?(Util.deep_get(c, k))})
            next
          end

          is_sel = sorts.length > 0 && sorts[0]['expression']['columnId'] == c.id
          ds_options += '<option value="' + c.fieldName + '"' + (is_sel ? ' selected="selected"' : '') +
            '>' + c.name + '</option>'
          sort_desc = !sorts[0]['ascending'] if is_sel
          found_col ||= is_sel
        end
      end
      ds_options = '<option value=""' + (found_col ? '' : ' selected="selected"') +
        '>(Unsorted)</option>' + ds_options

      if context[:type] == 'column'
        si = sorts.detect { |s| s['expression']['columnId'] == context[:column].id }
        found_col = !si.blank?
        sort_desc = !si['ascending'] if found_col
      end

      ds_list_options = [
          { value: 'relevance', name: t('controls.browse.sorts.relevance') },
          { value: 'most_accessed', name: t('controls.browse.sorts.most_accessed') },
          { value: 'alpha', name: t('controls.browse.sorts.alpha') },
          { value: 'newest', name: t('controls.browse.sorts.newest') },
          { value: 'oldest', name: t('controls.browse.sorts.oldest') },
          { value: 'last_modified', name: t('controls.browse.sorts.last_modified') },
          { value: 'rating', name: t('controls.browse.sorts.rating') },
          { value: 'comments', name: t('controls.browse.sorts.comments') }
        ]
      ds_list_sort = context[:search]['sortBy'] if context[:type] == 'datasetList' &&
        context[:search].present?
      ds_list_period_options = [
          { value: 'WEEKLY', name: t('controls.browse.sort_periods.week') },
          { value: 'MONTHLY', name: t('controls.browse.sort_periods.month') },
          { value: 'YEARLY', name: t('controls.browse.sort_periods.year') }
        ]
      ds_list_sort_period = context[:search]['sortPeriod'] if context[:type] == 'datasetList' &&
        context[:search].present?

      t = '<div class="datasetSort' + (context[:type] != 'dataset' ? ' hide' : '') + '">' +
          '<select id="' + id + '-datasetSort" name="datasetSort">' +
          ds_options +
          '</select>' +
        '</div>' +
        '<div class="dsListSort' + (context[:type] != 'datasetList' ? ' hide' : '') + '">' +
          '<select id="' + id + '-dsListSort" name="dsListSort" class="dsListSort">' +
          ds_list_options.map { |o| '<option value="' + o[:value] + '"' +
            (o[:value] == ds_list_sort ? 'selected="selected"' : '' ) + '>' + o[:name] + '</option>' }.join('') +
          '</select>' +
          '<select id="' + id + '-dsListSortPeriod" name="dsListSortPeriod" class="sortPeriod' +
          (ds_list_sort == 'most_accessed' ? '' : ' hide' ) + '">' +
          ds_list_period_options.map { |o| '<option value="' + o[:value] + '"' +
            (o[:value] == ds_list_sort_period ? 'selected="selected"' : '' ) + '>' + o[:name] + '</option>' }.join('') +
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

  class DatasetListFilter < CanvasWidget
    include BrowseActions
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      return ['', true] if context.nil? || context[:type] != 'datasetList'

      search = context[:search] || {}
      facet = nil
      cur_val = nil
      js_data = { catalogConfig: CurrentDomain.configuration('catalog') }
      case string_substitute(@properties['facet'])
      when 'viewTypes' then
        facet = view_types_facet
        cur_val = if search['publication_stage'] == 'unpublished'
                    'unpublished'
                  elsif search['datasetView'] == 'dataset'
                    'datasets'
                  elsif search['datasetView'] == 'view'
                    'filters'
                  else
                    search['limitTo']
                  end
        facet[:param_list] = ['limitTo', 'datasetView', 'publication_stage']
        facet[:param_map] = {
          unpublished: { limitTo: 'tables', datasetView: 'dataset', publication_stage: 'unpublished' },
          datasets: { limitTo: 'tables', datasetView: 'dataset' },
          filters: { limitTo: 'tables', datasetView: 'view' }
        }.with_indifferent_access
        js_data[:hasApi] = module_available?(:api_foundry)
      when 'categories' then
        facet = categories_facet
        cur_val = (search['category'] || '').titleize_if_necessary
        js_data[:categories] = View.category_tree.reject { |c, o| c.blank? }.values.sort_by { |o| o[:value] }
      when 'topics' then
        facet = topics_facet
        cur_val = search['tags']
        js_data[:tags] = Tag.find({:method => "viewsTags"}).map { |t|
          {:text => t.name, :value => t.name, :count => t.frequency} }
      when 'federatedDomains' then
        facet = federated_facet
        cur_val = search['federation_filter']
        js_data[:federatedDomains] = Federation.find.
          select { |f| f.targetDomainCName == CurrentDomain.cname &&
            f.lensName.empty? && f.acceptedUserId.present? }.
            sort_by { |f| f.sourceDomainCName }.
            map { |f| { :text => f.sourceDomainCName, :value => f.sourceDomainId.to_s,
              :icon => "/api/domains/#{f.sourceDomainCName}/icons/smallIcon" } }
        js_data[:currentDomain] = { id: CurrentDomain.domain.id, cname: CurrentDomain.cname }
      end
      return ['', true] if facet.nil?

      t = '<div class="title">' + facet[:title] + '</div>' +
        '<ul class="listSection" data-jsdata="' + CGI::escapeHTML(js_data.to_json) + '">'
      params = Util.page_params.deep_dup
      (facet[:param_list] || [facet[:param]]).each { |p|
        params['data_context'][context[:id]]['search'].delete(p.to_s) } if
        params['data_context'].present? &&
        params['data_context'][context[:id]].present? && params['data_context'][context[:id]]['search']
      t += '<li><a href="' + Util.page_path + '?' + params.to_param + '" class="clearFacet' +
        (cur_val.present? ? '' : ' hide') + '">'
      t += '<span class="icon"></span>' if facet[:use_icon]
        t += t('controls.browse.actions.clear_facet') + '</a></li>'
      if facet[:tag_cloud]
        facet[:extra_options].sort_by { |o| o[:count] }.reverse.each_with_index do |facet_option, i|
          t += render_facet_item(facet_option, facet, cur_val, i >= facet[:options].length ? 'cutoff' : '')
        end
      else
        facet[:options].each do |facet_option|
          t += render_facet_item(facet_option, facet, cur_val)
        end
        (facet[:extra_options] || []).each do |facet_option|
          t += render_facet_item(facet_option, facet, cur_val, 'cutoff')
        end
      end
      t += '</ul>'
      [t, true]
    end

    def render_facet_item(facet_item, facet, cur_val = nil, extra_class = '')
      is_active = cur_val == facet_item[:value]
      child_active = (facet_item[:children] || []).any? { |cc| cc[:value] == cur_val }

      params = Util.page_params.deep_dup
      params['data_context'] ||= {}
      params['data_context'][context[:id]] ||= {}
      params['data_context'][context[:id]]['search'] ||= {}
      (facet[:param_list] || [facet[:param]]).each { |p|
        params['data_context'][context[:id]]['search'].delete(p.to_s) }
      if facet[:param_map].present? && facet[:param_map][facet_item[:value]].present?
        params['data_context'][context[:id]]['search'].merge!(facet[:param_map][facet_item[:value]])
      else
        params['data_context'][context[:id]]['search'][facet[:param].to_s] = facet_item[:value]
      end

      ret = '<li class="' + extra_class + (is_active || child_active ? ' activeItem' : '') +
        '"><a href="' + Util.page_path + '?' + params.to_param + '" class="' +
        (facet_item[:class] || '') + (is_active ? ' active' : '') +
        '" data-value="' + facet_item[:value] + '"' + (facet_item[:count].present? ?
                                                       (' rel="' + facet_item[:count].to_s + '"') : '') + '>'
      if facet[:use_icon]
        ret += '<span class="icon"></span>'
      elsif !facet_item[:icon].nil?
        ret += '<img class="customIcon" src="' + theme_image_url(facet_item[:icon]) + '" alt="icon" />'
      end
      ret += CGI::escapeHTML(facet_item[:text])
      ret += '</a>'
      if is_active && !(facet_item[:children] || []).empty? || child_active
        ret += '<ul class="childList">' +
          facet_item[:children].map { |child|
            render_facet_item(child, facet, cur_val) }.join('') +
          '</ul>'
      end
      ret += '</li>'
    end
  end

  class GovStat < CanvasWidget
    def initialize(props, parent = nil, resolver_context = nil)
      @needs_own_context = true
      super(props, parent, resolver_context)
    end

    def render_contents
      begin
        path, context = get_args
        res = Canvas2::Util.odysseus_request(path,
                                             { context: context,
                                               attributes: string_substitute(@properties['attributes']),
                                               constructorOpts: string_substitute(@properties['constructorOpts'])
        }, !Canvas2::Util.is_private)
      rescue CoreServer::ResourceNotFound
        Canvas2::Util.errors.push(ComponentError.new(self, "GovStat item not found for #{id}: #{error_details }"))
        return ['', true]
      rescue CoreServer::CoreServerError => e
        if e.error_code.to_i == 401 || e.error_code.to_i == 403
          Canvas2::Util.errors.push(ComponentError.new(self, "GovStat item permission denied for #{id}: #{error_details }"))
          return ['', true]
        end
        raise e
      end
      [res['markup'], false]
    end
  end

  class GovStatGoal < GovStat
    def get_args
      context = string_substitute(@properties['viewType'])
      context = 'card' if context != 'card' && context != 'detail'
      ['/stat/views/goal/' + string_substitute(@properties['goalId']), context]
    end

    def error_details
      "Goal #{string_substitute(@properties['goalId'])}"
    end
  end

  class GovStatDashboard < GovStat
    def get_args
      ['/stat/views/dashboard/' + string_substitute(@properties['dashboardId']), 'default']
    end

    def error_details
      "Dashboard #{string_substitute(@properties['dashboardId'])}"
    end
  end

  class GovStatCategory < GovStat
    def get_args
      ['/stat/views/category/' + string_substitute(@properties['dashboardId']) + '/' +
        string_substitute(@properties['categoryId']), 'default']
    end

    def error_details
      "Category #{string_substitute(@properties['categoryId'])} in dashboard #{string_substitute(@properties['dashboardId'])}"
    end
  end

  class EventConnector < CanvasWidget
    def is_hidden
      true
    end

    def render
      ['', false]
    end
  end
end
