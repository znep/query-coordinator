# Processes delayed jobs only if this version of storyteller is active
# See StorytellerService.active?

require 'rake/task'

class QueueWorker
  def initialize
    Delayed::Worker.raise_signal_exceptions = true
  end

  def stop
    @exit = true
  end

  def stop?
    !!@exit
  end

  def start
    trap('TERM') do
      stop
      raise SignalException, 'TERM'
    end

    trap('INT') do
      stop
      raise SignalException, 'INT'
    end

    loop do
      if StorytellerService.active?
        Rake::Task['jobs:workoff'].reenable
        Rake::Task['jobs:workoff'].invoke
      end

      break if stop?

      sleep(Delayed::Worker.sleep_delay)
    end
  end
end
