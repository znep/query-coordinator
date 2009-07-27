class Stat < Model
  GRAPH_DIMENSIONS = "140x140"
  ROW_ACCESS_LEGEND = {
      "api" => "FF2C12", 
      "widget" => "2327C8",
      "download" => "FDEF00",
      "website" => "0099F6",
      "email" => "00B133",
      "print" => "7D26CD"
    }
  HUMAN_READABLE_ROW_ACCESS_LEGEND = {
      "api" => "API", 
      "widget" => "Social Data Player",
      "download" => "Download",
      "website" => "Website",
      "email" => "Email",
      "print" => "Print"
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
    return data_hash["rowsAccessed"] || {}
  end

  def total_rows_accessed
    return rows_accessed.values.sum
  end

  def averageRating
    (data['averageRating'] || 0) / 20.0
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
