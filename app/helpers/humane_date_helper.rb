module HumaneDateHelper
  HUMANE_DATE_GRANULARITY = {
    :minute => 0,
    :hour => 3,
    :day => 6,
    :week => 9,
    :month => 12,
    :year => 15,
    :century => 18
  }
  HUMANE_DATE_TIME_FORMATS = [
    [60, 'just now'],
    [120, '1 minute ago', '1 minute from now'], # 60*2
    [3600, 'minutes', 60], # 60*60, 60
    [3600, 'this hour'], # 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], # 60*60*2
    [86400, 'hours', 3600], # 60*60*24, 60*60
    [86400, 'today'], # 60*60*24, 60*60
    [172800, 'yesterday', 'tomorrow'], # 60*60*24*2
    [604800, 'days', 86400], # 60*60*24*7, 60*60*24
    [604800, 'this week'], # 60*60*24*7, 60*60*24
    [1209600, 'last week', 'next week'], # 60*60*24*7*4*2
    [2419200, 'weeks', 604800], # 60*60*24*7*4, 60*60*24*7
    [2419200, 'this month'], # 60*60*24*7*4, 60*60*24*7
    [4838400, 'last month', 'next month'], # 60*60*24*7*4*2
    [29030400, 'months', 2419200], # 60*60*24*7*4*12, 60*60*24*7*4
    [29030400, 'this year'], # 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'last year', 'next year'], # 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], # 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [2903040000, 'this century'], # 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'last century', 'next century'] # 60*60*24*7*4*12*100*2
  ]

  def self.duration_in_words(from_date, to_date=Time.now, granularity=HUMANE_DATE_GRANULARITY[:day])
    raise "Invalid time duration" unless to_date > from_date

    duration = (to_date - from_date).to_i

    humane_date((to_date - duration.seconds).to_i)
  end

  def self.humane_date(epoch_secs, granularity = HUMANE_DATE_GRANULARITY[:minute])
    if epoch_secs.nil? || epoch_secs == 0
      return 'None'
    end
    dt = Time.now.tv_sec
    seconds = (dt - epoch_secs)
    token = 'ago'
    list_choice = 1

    if (seconds < 0)
      seconds = seconds.abs
      token = 'from now'
      list_choice = 2
    end
    
    start = granularity
    stop = HUMANE_DATE_TIME_FORMATS.length - 1
    for i in start..stop do 
      format = HUMANE_DATE_TIME_FORMATS[i]
      
      if (seconds < format[0])
        if (format.length < 3)
          out = format[1]
        elsif (format[2].kind_of?(String))
          out = format[list_choice]
        else
          out = (seconds/format[2]).floor.to_s + ' ' + format[1] + ' ' + token
        end
        break
      end
    end
    
    # overflow for centuries
    if (seconds > 5806080000)
        out = (seconds / 2903040000).floor + ' centuries ' + token
    end
    
    out
  end
end
