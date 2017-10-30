# encoding: utf-8
require 'rails_helper'

describe MetricQueue do
  describe :push_metric do
    let(:best_day_ever) { Time.new(1987, 0o6, 17, 2, 3, 4, '-07:00') }

    let(:start_of_record) { [255].pack('C').force_encoding('iso-8859-1') }
    let(:end_of_field) { [254].pack('C').force_encoding('iso-8859-1') }

    describe 'atomic metric flushing' do
      describe 'low volume' do
        before(:each) do
          MetricQueue.instance.batch_size = 2
          allow(Thread).to receive(:new).and_yield.and_call_original
          APP_CONFIG.atomic_metrics_flush = true
        end

        it 'accepts a metric and adds it to the batch' do
          Time.should_receive(:now).exactly(6).times.and_return(best_day_ever)
          MetricQueue.instance.push_metric('test', 'metric', 42)

          expect(MetricQueue.instance.requests).to eq([{
                                                        :timestamp => 550918984000,
                                                        :entity_id => 'test',
                                                        :name => 'metric',
                                                        :value => 42,
                                                        :type => :aggregate
                                                      }])
        end

        it 'accepts two metrics and triggers a flush' do
          test_filename = 'test-metrics-filename'
          test_filepath = "tmp/metriclogs/#{test_filename}"

          Time.should_receive(:now).at_least(7).times.and_return(best_day_ever)
          MetricQueue.instance.should_receive(:atomic_metrics_filename).with(best_day_ever).at_least(1).times.
            and_return(test_filename)
          MetricQueue.instance.should_receive(:flush).twice.and_call_original

          file = double('File')
          File.should_receive(:open).once.with(test_filepath, 'ab').and_yield(file)

          records = [
            { :entity_id => 'test', :name => 'metric', :value => 42 },
            { :entity_id => 'another', :name => 'metric', :value => 1 }
          ]

          records.each do |record|
            file.should_receive(:write).with(start_of_record).once
            file.should_receive(:write).with('550918984000').once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:entity_id]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:name]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:value].to_s).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with('aggregate').once
            file.should_receive(:write).with(end_of_field).once
          end

          FileUtils.should_receive(:mv).once.with(test_filepath, "#{test_filepath}.COMPLETED")

          thread = nil

          records.each do |record|
            raise unless thread.nil?
            thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
          end

          thread.join
        end
      end

      describe 'high volume', slow: true do
        before(:each) do
          MetricQueue.instance.batch_size = 100
          allow(Thread).to receive(:new).and_yield.and_call_original
        end

        it 'accepts 100 metrics and triggers a flush' do
          test_filename = 'test-metrics-filename'
          test_filepath = "tmp/metriclogs/#{test_filename}"

          Time.should_receive(:now).at_least(6).times.and_return(best_day_ever)
          MetricQueue.instance.should_receive(:atomic_metrics_filename).with(best_day_ever).at_least(1).times.
            and_return(test_filename)
          MetricQueue.instance.should_receive(:flush).twice.and_call_original

          file = double('File')
          File.should_receive(:open).once.with(test_filepath, 'ab').and_yield(file)

          entity_ids = %w(
            another
            test
          )

          metrics = %w(
            metric
            health
          )

          records = Array.new(100) do
            {
              :entity_id => entity_ids.sample,
              :name => metrics.sample,
              :value => Random.rand(1..1000000)
            }
          end

          records.each do |record|
            file.should_receive(:write).with(start_of_record).once
            file.should_receive(:write).with('550918984000').once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:entity_id]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:name]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:value].to_s).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with('aggregate').once
            file.should_receive(:write).with(end_of_field).once
          end

          FileUtils.should_receive(:mv).once.with(test_filepath, "#{test_filepath}.COMPLETED")

          thread = nil

          records.each do |record|
            raise unless thread.nil?
            thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
          end

          thread.join
        end

        it 'accepts 1000 metrics and triggers 10 flushes' do
          test_filename = 'test-metrics-filename'
          test_filepath = "tmp/metriclogs/#{test_filename}"

          Time.should_receive(:now).at_least(6).times.and_return(best_day_ever)
          MetricQueue.instance.should_receive(:atomic_metrics_filename).with(best_day_ever).exactly(10).times.
            and_return(test_filename)
          MetricQueue.instance.should_receive(:flush).exactly(11).times.and_call_original

          files = Array.new(10) { |index| double("file-#{index}") }

          files.each do |file|
            File.should_receive(:open).with(test_filepath, 'ab').and_yield(file)
          end

          entity_ids = %w(
            another
            test
          )

          metrics = %w(
            metric
            health
          )

          records = Array.new(1000) do |index|
            {
              :entity_id => "#{entity_ids.sample}-#{index}",
              :name => metrics.sample,
              :value => Random.rand(1..1000000),
              :flush_expected => index % 100 == 0 && index > 0,
              :file => files[(index / 100).floor]
            }
          end

          records.each do |record|
            record[:file].should_receive(:write).with(start_of_record).once
            record[:file].should_receive(:write).with('550918984000').once
            record[:file].should_receive(:write).with(end_of_field).once
            record[:file].should_receive(:write).with(record[:entity_id]).once
            record[:file].should_receive(:write).with(end_of_field).once
            record[:file].should_receive(:write).with(record[:name]).once
            record[:file].should_receive(:write).with(end_of_field).once
            record[:file].should_receive(:write).with(record[:value].to_s).once
            record[:file].should_receive(:write).with(end_of_field).once
            record[:file].should_receive(:write).with('aggregate').once
            record[:file].should_receive(:write).with(end_of_field).once
          end

          FileUtils.should_receive(:mv).exactly(10).times.with(test_filepath, "#{test_filepath}.COMPLETED")

          thread = nil
          threads = []

          Thread.abort_on_exception = true

          records.each do |record|
            if record[:flush_expected]
              threads << thread
            else
              raise unless thread.nil?
            end
            thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
            Thread.pass if Random.rand(200) % 200
          end

          threads << thread unless thread.nil?

          threads.each(&:join)

          expect(threads.length).to eq(10)
        end
      end
    end

    describe 'lock-based two minute file flushing' do
      before do
        APP_CONFIG.atomic_metrics_flush = false
      end

      describe 'low volume' do
        before(:each) do
          MetricQueue.instance.batch_size = 2
          allow(Thread).to receive(:new).and_yield.and_call_original
        end

        it 'accepts a metric and adds it to the batch' do
          Time.should_receive(:now).exactly(6).times.and_return(best_day_ever)
          MetricQueue.instance.push_metric('test', 'metric', 42)

          expect(MetricQueue.instance.requests).to eq([{
                                                        :timestamp => 550918984000,
                                                        :entity_id => 'test',
                                                        :name => 'metric',
                                                        :value => 42,
                                                        :type => :aggregate
                                                      }])
        end

        it 'accepts two metrics and triggers a flush' do
          test_filename = 'metrics2012.0000008045539740.data'
          test_filepath = "tmp/metriclogs/#{test_filename}"
          lock_filepath = 'tmp/metriclogs/ruby-metrics.lock'

          Time.should_receive(:now).at_least(6).times.and_return(best_day_ever)
          MetricQueue.instance.should_receive(:flush).twice.and_call_original

          File.should_receive(:open).once.with(lock_filepath, 'wb').and_call_original

          file = double('File')
          File.should_receive(:open).once.with(test_filepath, 'ab').and_yield(file)

          records = [
            { :entity_id => 'test', :name => 'metric', :value => 42 },
            { :entity_id => 'another', :name => 'metric', :value => 1 }
          ]

          records.each do |record|
            file.should_receive(:write).with(start_of_record).once
            file.should_receive(:write).with('550918984000').once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:entity_id]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:name]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:value].to_s).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with('aggregate').once
            file.should_receive(:write).with(end_of_field).once
          end

          thread = nil

          records.each do |record|
            raise unless thread.nil?
            thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
          end

          thread.join
        end
      end

      describe 'high volume', slow: true do
        before(:each) do
          MetricQueue.instance.batch_size = 100
          allow(Thread).to receive(:new).and_yield.and_call_original
        end

        it 'accepts 100 metrics and triggers a flush' do
          test_filename = 'metrics2012.0000008045539740.data'
          test_filepath = "tmp/metriclogs/#{test_filename}"
          lock_filepath = 'tmp/metriclogs/ruby-metrics.lock'

          Time.should_receive(:now).exactly(204).times.and_return(best_day_ever)
          MetricQueue.instance.should_receive(:flush).twice.and_call_original

          File.should_receive(:open).once.with(lock_filepath, 'wb').and_call_original

          file = double('File')
          File.should_receive(:open).once.with(test_filepath, 'ab').and_yield(file)

          entity_ids = %w(
            another
            test
          )

          metrics = %w(
            metric
            health
          )

          records = Array.new(100) do
            {
              :entity_id => entity_ids.sample,
              :name => metrics.sample,
              :value => Random.rand(1..1000000)
            }
          end

          records.each do |record|
            file.should_receive(:write).with(start_of_record).once
            file.should_receive(:write).with('550918984000').once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:entity_id]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:name]).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with(record[:value].to_s).once
            file.should_receive(:write).with(end_of_field).once
            file.should_receive(:write).with('aggregate').once
            file.should_receive(:write).with(end_of_field).once
          end

          thread = nil

          records.each do |record|
            raise unless thread.nil?
            thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
          end

          thread.join
        end

        describe 'accepts 1000 metrics and triggers 10 flushes' do
          let(:best_day_ever) { DateTime.new(1987, 0o6, 17, 2, 3, 4, '-00:00') }

          it 'in the same two minute block' do
            test_filename = 'metrics2012.0000008043d311c0.data'
            test_filepath = "tmp/metriclogs/#{test_filename}"
            lock_filepath = 'tmp/metriclogs/ruby-metrics.lock'

            Time.should_receive(:now).exactly(2040).times.and_return(best_day_ever)
            MetricQueue.instance.should_receive(:flush).exactly(11).times.and_call_original

            file = double('File')

            File.should_receive(:open).exactly(10).times.with(lock_filepath, 'wb').and_call_original
            File.should_receive(:open).exactly(10).times.with(test_filepath, 'ab').and_yield(file)

            entity_ids = %w(
              another
              test
            )

            metrics = %w(
              metric
              health
            )

            records = Array.new(1000) do |index|
              {
                :entity_id => "#{entity_ids.sample}-#{index}",
                :name => metrics.sample,
                :value => Random.rand(1..1000000),
                :flush_expected => index % 100 == 0 && index > 0
              }
            end

            records.each do |record|
              file.should_receive(:write).with(start_of_record).once
              file.should_receive(:write).with('550893784000').once
              file.should_receive(:write).with(end_of_field).once
              file.should_receive(:write).with(record[:entity_id]).once
              file.should_receive(:write).with(end_of_field).once
              file.should_receive(:write).with(record[:name]).once
              file.should_receive(:write).with(end_of_field).once
              file.should_receive(:write).with(record[:value].to_s).once
              file.should_receive(:write).with(end_of_field).once
              file.should_receive(:write).with('aggregate').once
              file.should_receive(:write).with(end_of_field).once
            end

            thread = nil
            threads = []

            records.each do |record|
              if record[:flush_expected]
                threads << thread
              else
                raise unless thread.nil?
              end
              thread = MetricQueue.instance.push_metric(record[:entity_id], record[:name], record[:value])
              Thread.pass if Random.rand(200) % 200
            end

            threads << thread unless thread.nil?

            threads.each(&:join)
            expect(threads.length).to eq(10)
          end

          it 'across three two minute blocks' do
            test_filename = 'metrics2012.0000008043d311c0.data'
            test_filepath = "tmp/metriclogs/#{test_filename}"
            lock_filepath = 'tmp/metriclogs/ruby-metrics.lock'
            delay_offset = 200

            epoch_now = ((best_day_ever.strftime('%Q').to_i / 1000).floor * 1000)

            number_of_records = 1000
            number_of_flushes = 40

            times = Array.new((number_of_records + number_of_flushes)) do |index|
              milliseconds_with_delay = epoch_now + (delay_offset * index)
              now = Time.at((milliseconds_with_delay / 1000).floor)

              if index > 0 && (index % 100) == 0
                Time.should_receive(:now).exactly(4).times.and_return(now)
              elsif index < 1010
                Time.should_receive(:now).exactly(1).times.and_return(now)
              end

              now
            end

            MetricQueue.instance.should_receive(:flush).exactly(11).times.and_call_original

            files = Array.new(3) { |index| double("File-#{index}") }

            File.should_receive(:open).exactly(10).times.with(lock_filepath, 'wb').and_call_original
            File.should_receive(:open).exactly(2).times.with(test_filepath, 'ab').and_yield(files[0])
            File.should_receive(:open).exactly(6).times.
              with('tmp/metriclogs/metrics2012.0000008043d4e680.data', 'ab').and_yield(files[1])
            File.should_receive(:open).exactly(2).times.
              with('tmp/metriclogs/metrics2012.0000008043d6bb40.data', 'ab').and_yield(files[2])

            entity_ids = %w(
              another
              test
            )

            metrics = %w(
              metric
              health
            )

            records = Array.new(1000) do |index|
              page = (index / 100).floor

              file = if page < 2
                       files[0]
                     elsif page < 8
                       files[1]
                     else
                       files[2]
                     end

              flush_expected = index % 100 == 0 && index > 0

              {
                :entity_id => "#{entity_ids.sample}-#{index}",
                :name => metrics.sample,
                :value => Random.rand(1..1000000),
                :flush_expected => flush_expected,
                :time => times[index + page * 5],
                :file => file
              }
            end

            # files.each { |file| file.should_receive(:write).with(anything()).at_least(1).times }
            records.each do |record|
              record[:file].should_receive(:write).with(start_of_record).once
              record[:file].should_receive(:write).with((record[:time].to_i * 1000).to_s).once
              record[:file].should_receive(:write).with(end_of_field).once
              record[:file].should_receive(:write).with(record[:entity_id]).once
              record[:file].should_receive(:write).with(end_of_field).once
              record[:file].should_receive(:write).with(record[:name]).once
              record[:file].should_receive(:write).with(end_of_field).once
              record[:file].should_receive(:write).with(record[:value].to_s).once
              record[:file].should_receive(:write).with(end_of_field).once
              record[:file].should_receive(:write).with('aggregate').once
              record[:file].should_receive(:write).with(end_of_field).once
            end

            thread = nil
            threads = []

            records.each do |record|
              if record[:flush_expected]
                threads << thread
              else
                raise unless thread.nil?
              end
              thread = MetricQueue.instance.
                       push_metric(record[:entity_id], record[:name], record[:value], record[:time])
              Thread.pass if Random.rand(200) % 200
            end

            threads << thread unless thread.nil?

            threads.each(&:join)
            expect(threads.length).to eq(10)
          end
        end
      end
    end
  end

  after(:each) do
    thread = MetricQueue.instance.flush
    thread&.join
  end
end
