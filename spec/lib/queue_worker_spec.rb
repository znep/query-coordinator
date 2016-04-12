require 'rails_helper'

describe QueueWorker do
  let(:jobs_task) { spy('Rake::Task') }

  let(:subject) { QueueWorker.new }

  before do
    allow(Rake::Task).to receive(:[]).with('jobs:workoff').and_return(jobs_task)
    @saved_sleep_delay = Delayed::Worker.sleep_delay
    Delayed::Worker.sleep_delay = 1
  end

  after do
    Delayed::Worker.sleep_delay = @saved_sleep_delay
  end

  context 'when this storyteller version is active' do
    before do
      allow(StorytellerService).to receive(:active?).and_return(true)
    end

    it 'invokes jobs:workoff task' do
      run_worker(0.1)
      expect(jobs_task).to have_received(:reenable)
      expect(jobs_task).to have_received(:invoke)
    end

    it 'loops calling jobs:workoff task' do
      run_worker(1.1)
      expect(jobs_task).to have_received(:reenable).twice
      expect(jobs_task).to have_received(:invoke).twice
    end
  end

  context 'when this storyteller version is not active' do
    before do
      allow(StorytellerService).to receive(:active?).and_return(false)
    end

    it 'never invokes jobs:workoff task' do
      run_worker(0.1)
      expect(jobs_task).to_not have_received(:reenable)
      expect(jobs_task).to_not have_received(:invoke)
    end
  end

  def run_worker(timeout = 1)
    begin
      # We want to kill execution of the loop
      Timeout.timeout(timeout) do
        subject.start
      end
    rescue Timeout::Error
    end
  end
end
