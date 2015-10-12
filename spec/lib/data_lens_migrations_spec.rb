describe DataLensMigrations do

  def migrate(i, page_metadata)
    migrations = DataLensMigrations.active_migrations
    migrations[i].call(Marshal.load(Marshal.dump(page_metadata)))
  end

  describe '#active_migrations[1]' do
    it 'returns the page metadata unchanged' do
      page_metadata = {}
      expect(migrate(1, page_metadata)).to eq(page_metadata)
    end
  end

  describe '#active_migrations[2]' do
    it 'returns the page metadata unchanged' do
      page_metadata = {}
      expect(migrate(2, page_metadata)).to eq(page_metadata)
    end
  end

  describe '#active_migrations[3]' do
    page_metadata = nil

    before(:each) do
      page_metadata = {
        :pageId => 'page-4by4',
        :datasetId => 'four-four',
        :cards => [
          { :fieldName => 'location_fieldname',
            :cardType => 'feature'
          },
          { :fieldName => ':@computed_column_fieldname',
            :cardType => 'choropleth'
          },
          { :fieldName => 'new_choropleth_fieldname',
            :cardType => 'choropleth',
            :computedColumn => ':@computed_column_fieldname'
          }
        ]
      }

      dataset_columns = {
        :':@computed_column_fieldname' => {
          :computationStrategy => {
            :source_columns => ['location_fieldname']
          }
        }
      }

      allow(DataLensMigrations.page_metadata_manager).to receive(:fetch_dataset_columns).and_return(dataset_columns)
    end

    it 'returns the page metadata unchanged if it has no cards' do
      page_metadata[:cards] = []
      expect(migrate(3, page_metadata)).to eq(page_metadata)
    end

    it 'raises a DataLensMigrationException if fetching the dataset columns fails' do
      allow(DataLensMigrations.page_metadata_manager).to receive(:fetch_dataset_columns).and_raise(DataLensMigrations::DataLensMigrationException)
      expect { migrate(3, page_metadata) }.to raise_exception(DataLensMigrations::DataLensMigrationException)
    end

    it 'converts the fieldName of choropleth cards to the source column of the computed column and adds a computedColumn field referencing the original field name' do
      old_choropleth = {
        :fieldName => ':@computed_column_fieldname',
        :cardType => 'choropleth'
      }

      new_choropleth = {
        :fieldName => 'location_fieldname',
        :cardType => 'choropleth',
        :computedColumn => ':@computed_column_fieldname'
      }

      page_metadata[:cards] = [ old_choropleth ]

      expect(migrate(3, page_metadata)[:cards]).to eq([ new_choropleth ])
    end

    it 'fails if a computed column does not have any source columns' do
      dataset_columns = {
        :':@computed_column_fieldname' => {
          :computationStrategy => {
            :source_columns => []
          }
        }
      }

      allow(DataLensMigrations.page_metadata_manager).to receive(:fetch_dataset_columns).and_return(dataset_columns)

      expect { migrate(3, page_metadata) }.to raise_exception(DataLensMigrations::DataLensMigrationException)
    end

    it 'does not modify the page metadata if it fails' do
      page_metadata[:cards] = page_metadata[:cards].push({
        :fieldName => ':@bad_computed_column',
        :cardType => 'choropleth'
      })

      begin
        migrate(3, page_metadata)
      rescue DataLensMigrations::DataLensMigrationException => exception

        # Ensure choropleths weren't half-migrated
        expect(page_metadata).to eq({
          :pageId => 'page-4by4',
          :datasetId => 'four-four',
          :cards => [
            { :fieldName => 'location_fieldname',
              :cardType => 'feature'
            },
            { :fieldName => ':@computed_column_fieldname',
              :cardType => 'choropleth'
            },
            { :fieldName => 'new_choropleth_fieldname',
              :cardType => 'choropleth',
              :computedColumn => ':@computed_column_fieldname'
            },
            { :fieldName => ':@bad_computed_column',
              :cardType => 'choropleth'
            }
          ]
        })
      end
    end
  end
end
