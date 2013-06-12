module Canvas2

  # Base class for tabular components.
  class TabularWidget < CanvasWidget
    def self.page_types
      ['export']
    end

    # Required method for TabularWidgets.  Returns the next row based on the
    # table_context that's passed in.
    def rows(table_context)
      raise ComponentError.new(
                component, "Component not implemented.  All tabular widgets MUST implement rows function.")
    end

  end

  # Responsible for the classes that allow DataSlate to return
  # tabular data.  This is mainly focused on export to CSV + Excel cases,
  # but can be used more generally as well.
  #
  # The contract for containers for this use is a little different than in the
  # more general DataSlate scenario because it needs to render children in a
  # "breadth first" way instead of "depth first".  What this means is that
  # if you have multiple rows as a child to a table, instead of being able to
  # get all the rows from the first child, then all the rows from the second, etc.
  # This will need to:
  # o Get first line of each child
  # o Concatenate them into a single line
  # o Write out row
  #
  # Since, RowContainers require a different contract than general CanvasWidget objects,
  # this container will fail if any of it's row objects don't implement the row method.
  #
  class RowContainer < TabularWidget

    @@klass_map = {
        "cell" => "Cell",
        "table" => "TableExport"
    }

    def initialize(props, parent = nil, resolver_context = nil)
      super(props, parent, resolver_context)

      # load the row definition
      @row_definition = row_definition
      validate_rows(@row_definition)
    end


    # returns the children for this RowContainer.  It is important to note
    # that children for this component are in the 'row' property, rather than
    # the 'children' components (like regular dataslate components)
    def row_definition
      if @row_definition.nil?
        @row_definition ||= RowContainer.from_config(@properties['row'], self)
      end

      @row_definition
    end


    # Returns an iterator over the headers for this table.  This will combine not only
    # headers supplied in the "headers" property, but also any pass up from child data tables.
    def headers

      #First, get the headers from the config
      head_config = string_substitute(@properties['header'] || [])

      ret_val = head_config.map { |val|  TabularDatum.new(val["value"], val["style"]) }

      #Next, run through all the rows and update headers accordingly
      index = 0
      @row_definition.each { |child| index = update_headers(child, ret_val, index) }

      ret_val
    end


    # Loads the rows from the actual databases.
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
            b_rows.push(context[:dataset].row_to_SODA2(r));
          end
        elsif context[:type] == 'datasetList'
          context[:datasetList].each_with_index { |ds, i| b_rows.push(ds) }
        end
      end

      b_rows
    end


    # returns the next row in this block
    def rows(table_context)

      # If this is Row Container has already drained its rows,
      # just return an empty TabularDatum
      if table_context.finished?(self)
        return TabularDatum.new(nil, @properties['style'])
      end

      first_row = false
      last_row = false

      # Get the sub context for this RowContainer
      sub_context = table_context.sub_contexts(self)
      if sub_context.nil?
        curr_rows = body_rows
        sub_context = TableContext.new(curr_rows)
        table_context.set_sub_contexts(self, sub_context)

        #resolve children to the new row for this sub-context
        resolved_children = RowContainer.from_config(@properties['row'], self, sub_context.row)
        sub_context.children = resolved_children

        first_row = true
      end

      ret_val = nil

      ##If all the children are not all done, re-run them,
      if sub_context.num_finished < row_definition.count

        resolved_children = sub_context.children
        ret_val = resolved_children.map { |component| component.rows(sub_context)}.flatten
        last_row = (sub_context.num_finished == row_definition.count)

      ##Otherwise, if there are more rows, then reset the children and re-run using the next row
      elsif sub_context.has_more?

        first_row = true
        sub_context.next
        resolved_children = RowContainer.from_config(@properties['row'], self, sub_context.row)
        sub_context.children = resolved_children
        sub_context.clear_finished
        ret_val = resolved_children.map { |component| component.rows(sub_context)}.flatten

      end

      #if there are no more and the contexts are all done, then this was the last row,
      #so finish everything up
      if !sub_context.has_more? && sub_context.num_finished == row_definition.count
        table_context.finished(self)
        table_context.set_sub_contexts(self, nil)
        last_row = true
      end

      # merge the properties
      ret_val.each_index do |i|
        ret_val[i].style = merge_styles(@properties['style'], ret_val[i].style, i==0, i==ret_val.count-1, first_row, last_row)
      end

      ret_val
    end

    # Merge the styles from a parent table into a child cell.  This will basically
    # overwrite, however borders are a little funny.  Since, a parent table will
    # want a border around the entire table, this means determining which cells are
    # on the border of the table.

    def merge_styles(parent_style_orig, child_style, is_left, is_right, is_top, is_bottom)
      if parent_style_orig.nil?
        return child_style
      end

      parent_style = parent_style_orig.clone

      #Set borders appropriately
      if parent_style["border"]

        new_edges = parent_style["border"]["edges"].select do |value|
          if value=="left"
            is_left
          elsif value == "right"
            is_right
          elsif value == "top"
            is_top
          elsif value == "bottom"
            is_bottom
          end
        end

        if child_style && child_style["border"] && child_style["border"]["edges"]
          new_edges = new_edges.concat(child_style["border"]["edges"]).uniq
        end


        if new_edges.count == 0
          parent_style.delete("border")
        else
          new_borders = parent_style["border"].clone
          if child_style && child_style["border"]
            new_borders = new_borders.merge(child_style["border"])
          end

          new_borders["edges"] = new_edges
          parent_style["border"] = new_borders
        end
      end

      if !child_style.nil?
        return child_style.merge(parent_style)
      else
        return parent_style
      end

    end

    protected

    # Creates an array of the headers based on what is set
    # in the config as well as what is derived from children
    def update_headers(child, head_config, index)

      # If this child implements headers, than incorporate its headers
      # into the headers we currently have.
      # Otherwise, assume the header refers to this object.
      if child.respond_to? :headers
        child.headers.each  do |header|
          head_config.insert(index, header)
          index = index + 1
        end
      else
        if head_config.size <= index
          head_config.insert(-1, nil)
        end
      end
      index + 1
    end

    def validate_rows(rows)
      rows.each do |component|
        if !component.respond_to? :rows
          raise ComponentError.new(
                    component, "Invalid component for rows.  Only 'cell' and 'table' allowed.")
        end
      end
    end

    def self.from_config(config, parent = nil, resolver_context = nil)
      if config.is_a? Array
        i = 0
        return config.map do |config_item|
          i += 1
          from_config(config_item, parent, resolver_context)
        end
      else
        begin
          klassName = @@klass_map[config['type']]
          raise ComponentError.new(
                    config, "No component type named '#{config['type']}' is supported in tabular components") if
              klassName.nil?

          klass = Canvas2.const_get(klassName)
          raise ComponentError.new(
                    config, "Component #{config['type']} is not supported in #{@@page.page_type} page") if
              !klass.page_types.include?(@@page.page_type)
          return klass.new(config, parent, resolver_context)
        rescue NameError => ex
          raise ComponentError.new(config, "There is no component of type #{config['type']}",
                                   { config: config })
        end
      end
    end
  end

  # A value that represents what should actually be written to a cell.
  # Contains style and value information.  The value data will NOT be
  # escaped in any way
  class TabularDatum

    attr_accessor :value, :style

    def initialize(value, style)
      @value = value
      @style = style
    end

  end


  # An iterator concept that allows the different
  # tabular widgets get a next row, and declare when
  # they are done.
  class TableContext

    attr_accessor :children

    def initialize(rows)
      @rows = rows
      @row_index = 0
      @completed_children = {}
      @sub_contexts = {}
      @children = {}
    end

    def rows
      @rows
    end

    def row_index
      @row_index
    end


    def row
      @rows[@row_index]
    end

    def next
      @row_index = @row_index + 1
      @row_index < @rows.count
    end

    def has_more?
      @row_index < (@rows.count - 1)
    end

    def finished(obj)
      @completed_children[obj] = true
    end

    def finished?(obj)
      (@completed_children[obj] == true)
    end

    def num_finished
      @completed_children.count
    end

    def clear_finished
      @completed_children.clear
    end

    def sub_contexts(obj)
      @sub_contexts[obj]
    end

    def set_sub_contexts(obj, context)
      @sub_contexts[obj] = context
    end

  end


  # A special context used as the root of all contexts
  class BootstrapContext < TableContext

    def initialize()
      super([])
    end

    def row
      nil
    end

    def next
      false
    end

    def has_more?
      false
    end
  end

  class Cell < TabularWidget

    def initialize(props, parent = nil, resolver_context = nil)
      super(props, parent, resolver_context)
    end

    #
    #  Returns the current row and style as a TabularDatum.
    def rows(table_context)

      value = nil
      if (!table_context.finished?(self) || @properties['repeat'] == true)
        resolver = table_context.row
        value = string_substitute(@properties['value'], resolver)
        table_context.finished(self)
      end

      TabularDatum.new(value, @properties['style'])
    end
  end

  #TableWidget
  class TableExport < RowContainer

    def generate_file(type)
      case type
        when 'csv'
          generate_csv
        when 'xlsx'
          generate_xlsx
      end
    end

    # For debug mode
    def render_contents
      [generate_csv, true]
    end


    def all_body_rows

      context = BootstrapContext.new

      ret_val = []
      while context.num_finished < 1
        curr_row = rows(context)
        ret_val << curr_row
      end

      ret_val
    end

    protected
    def generate_csv
      head = headers

      data_rows = all_body_rows

      rendered_head = writeCsvRow(head)
      rendered_body = data_rows.map { |row| writeCsvRow(row) }.join("\n")

      rendered_head + "\n" + rendered_body

    end

    def writeCsvRow(values)
      escaped_csv_values = values.map do |val|

        if val
          Util.csv_escape((val.value || '').to_s)
        else
          ''
        end
      end

      escaped_csv_values.join(',')
    end

    def generate_xlsx

      # load the header and all the rows
      header_row = headers
      data_rows = all_body_rows

      # Create a spreadsheet, add a worksheet, then populate it with data
      p = Axlsx::Package.new
      p.workbook.add_worksheet(:name => "Basic Worksheet") do |sheet|

        styles_list = {}

        # Add the headers to the first row
        head = header_row.map { |header| header.value }
        head_styles = header_row.map { |header| load_xl_style(p.workbook, header.style, styles_list) }

        sheet.add_row head, :style=>head_styles


        #Add all the rows
        data_rows.each{ |row|

          row_styles = row.map { |cell| load_xl_style(p.workbook, cell.style, styles_list) }

          row_vals = row.map { |cell|  cell.value unless cell.nil? }

          sheet.add_row row_vals, :style=>row_styles
        }
      end
      p.use_shared_strings = true
      p.to_stream(false).read
    end

    # loads a style for an XLSX spreadsheet, or returns
    # an existing one.
    def load_xl_style(workbook, style, styles_list)
      canonical_style = canonicalize_style(style)
      xl_style = styles_list[canonical_style]
      if xl_style.nil?
        xl_style = add_xl_style(workbook, canonical_style, style, styles_list)
      end

      xl_style
    end

    # This will turn a style hash, into a canonicalized string, representing the style
    def canonicalize_style(style)

      if style.nil?
        return nil
      end

      cannonical_array = style.to_a.map do |entry|
        if entry[1].is_a?(Hash)
          [entry[0], canonicalize_style(entry[1])]
        else
          entry
        end
      end

      cannonical_array.sort.to_s
    end



    # Adds a style to the workbook, and updates the styles list
    def add_xl_style(workbook, canonical_style, cell_style, styles_list)
      style_def = {}

      font_def = cell_style["font"]
      if font_def
        font_def.each_pair do |key, value|
          case key
            when "b"
              style_def[:b] = value
            when "i"
              style_def[:i] = value
            when "color"
              style_def[:fg_color] = value
            when "size"
              style_def[:sz] = value
            when "u"
              style_def[:u] = value
            when "name"
              style_def[:font_name] = value
          end
        end
      end

      borders_def = cell_style["border"]
      if borders_def

        borders = {}
        borders_def.each_pair do |key, value|
          case key
            when "color"
              borders[:color] = value
            when "style"
              borders[:style] = map_to_xlsx_border_style(value)
            when "edges"
              borders[:edges] = value.map do |edge|

                case edge
                  when "left"
                    :left
                  when "right"
                    :right
                  when "top"
                    :top
                  when "bottom"
                    :bottom
                end
              end
          end
        end
        if ! borders[:color]
          borders[:color] = "00000000"
        end

        if ! borders[:style]
          borders[:style] = :thin
        end
      end

      if borders
        style_def[:border] = borders
      end

      if cell_style["bgcolor"]
        style_def[:bg_color] = cell_style["bgcolor"]
      end

      styles_list[canonical_style] =  workbook.styles.add_style style_def
    end

    @@acceptable_border_styles = {"none"=>:none, "thin"=>:thin, "medium"=>:medium, "dashed"=>:dashed, "dotted"=>:dotted,
                                  "thick"=>:thick, "double"=>:double, "hair"=>:hair, "mediumDashed"=>:mediumDashed,
                                  "dashDot"=>:dashDot, "mediumDashDot"=>:mediumDashDot, "dashDotDot"=>:dashDotDot,
                                  "slantDashDot"=>:slantDashDot}

    def map_to_xlsx_border_style(border_style)
      @@acceptable_border_styles[border_style]
    end

  end

end