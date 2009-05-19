class Stat < Model
  GRAPH_DIMENSIONS = "150x150"
  ROW_ACCESS_LEGEND = {
      "api" => "FF2C12", 
      "widget" => "2327C8",
      "download" => "0099F6",
      "website" => "FDEF00",
      "email" => "00B133",
      "print" => "7D26CD"
    }

  def self.find_for_view(view, opts=nil)
    path = "/views/#{view.id}/metrics.json"
    if opts
      path += "?#{opts.to_param}"
    end
    get_request(path)
  end

  def url_activity
    return data_hash["urlActivity"]
  end

  def rows_accessed
    return data_hash["rowsAccessed"]
  end

  def total_rows_accessed
    return rows_accessed.values.sum
  end

  def row_access_chart_href
    require 'gchart'

    colors = ROW_ACCESS_LEGEND
    if rows_accessed.values.sum > 0
        Gchart.pie(:data => colors.keys.collect{|k| self.rows_accessed[k].to_i },
                   :line_colors => colors.values,
                   :size => GRAPH_DIMENSIONS 
                  )
    else
        Gchart.pie(:data => [1],
                   :line_colors => ["666666"],
                   :size => "150x150"
                  )
    end
  end
end
