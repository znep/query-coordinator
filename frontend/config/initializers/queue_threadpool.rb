class QueueThreadPool
  def self.process_list(list)
    # Fake threadpool
    # This manages the input so that the results come back in the same order
    # (in the case of an array) or with the same keys (in the case of a hash)
    # There could be times we don't care about order,
    # but is that worth handling separately?
    q = Queue.new
    if list.is_a?(Array)
      list.each_with_index { |c, i| q.push([c, i]) }
    elsif list.is_a?(Hash)
      list.each { |k, v| q.push([v, k]) }
    end
    results = list.is_a?(Array) ? [] : {}
    threads = []
    thread_count.times do
      threads.push(Thread.new do
        r = {}
        while c = q.pop(true) rescue nil
          r[c[1]] = yield(list.is_a?(Array) ? c[0] : c[1], c[0]) if block_given?
        end
        r
      end)
    end
    threads.each do |thread|
      thread.value.each { |k, v| results[k] = v }
    end
    results
  end

private
  def self.thread_count
    tc = APP_CONFIG.threadpool_count
    tc < 1 ? 3 : tc
  end
end
