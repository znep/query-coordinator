require 'test_helper'

class PageMetadataManagerTest < Test::Unit::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    Phidippides.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '2401'
    })
    SodaFountain.any_instance.stubs(connection_details: {
      'address' => 'localhost',
      'port' => '6010'
    })
  end

  def test_create_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: page_metadata },
      fetch_dataset_metadata: { status: '200', body: dataset_metadata }
    )
    result = manager.create(page_metadata.to_json)
    assert(result.fetch(:status) == '200', result.inspect)
    assert(result.fetch(:body).fetch(:pageId), 'Expected a non-nil pageId to be created')
  end

  def test_create_does_not_try_to_create_rollup_table_when_not_given_eligible_columns
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(0)
    # Make sure our assumptions about the dataset we're using are true
    rollup_column_doesnt_exist = dataset_metadata_without_rollup_columns['columns'].none? do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_doesnt_exist)
    rollup_column_exists = dataset_metadata['columns'].find do |column|
      column['logicalDatatype'] == 'category'
    end
    assert(rollup_column_exists)

    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: page_metadata },
      fetch_dataset_metadata: { status: '200', body: dataset_metadata_without_rollup_columns }
    )
    result = manager.create(page_metadata.to_json)

    assert(result.fetch(:status) == '200', result.inspect)
    assert(result.fetch(:body).fetch(:pageId), 'Expected a non-nil pageId to be created')
  end

  def test_create_ensures_table_card
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: dataset_metadata }
    )
    Phidippides.any_instance.expects(:create_page_metadata).times(1).then.with do |json, options|
      json['cards'].find { |card| card['cardType'] == 'table' }
    end.then.returns(
      status: '200',
      body: page_metadata
    )

    result = manager.create(page_metadata_without_tablecard.to_json)
    assert(result.fetch(:status) == '200', result.inspect)
  end

  def test_fetch_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(1)
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: page_metadata },
      fetch_dataset_metadata: { status: '200', body: dataset_metadata },
      fetch_page_metadata: { status: '200', body: page_metadata }
    )
    page_id = manager.create(page_metadata.to_json).fetch(:body).fetch(:pageId)
    result = manager.fetch(page_id)
    assert(result.fetch(:status) == '200', result.inspect)
    assert_equal(page_id, result.fetch(:body).fetch(:pageId))
  end

  def test_update_succeeds
    PageMetadataManager.any_instance.expects(:update_rollup_table).times(2)
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: page_metadata },
      fetch_dataset_metadata: { status: '200', body: dataset_metadata },
      fetch_page_metadata: { status: '200', body: page_metadata },
      update_page_metadata: { status: '200', body: page_metadata.merge('bunch' => 'other stuff', 'foo' => 'bar')}
    )
    result = manager.create(page_metadata.to_json)
    page_id = result.fetch(:body).fetch(:pageId)
    result = manager.fetch(page_id)
    assert(result[:status] == '200', result.inspect)
    assert_equal(page_id, result.fetch(:body).fetch(:pageId))
    updated_result = manager.update(result.fetch(:body).to_json)
    assert_equal('other stuff', updated_result.fetch(:body).fetch(:bunch))
    assert_equal('bar', updated_result.fetch(:body).fetch(:foo))
  end

  def test_update_does_not_delete_rollup_first
    SodaFountain.any_instance.expects(:delete_rollup_table).never
    SodaFountain.any_instance.stubs(create_or_update_rollup_table: { status: 204 })
    Phidippides.any_instance.stubs(
      create_page_metadata: { status: '200', body: page_metadata },
      fetch_dataset_metadata: { status: '200', body: dataset_metadata },
      fetch_page_metadata: { status: '200', body: page_metadata },
      update_page_metadata: { status: '200', body: page_metadata }
    )
    result = manager.create(page_metadata.to_json)
    page_id = result.fetch(:body).fetch(:pageId)
    result = manager.fetch(page_id)
    assert(result[:status] == '200', result.inspect)
    manager.update(result.fetch(:body).to_json)
  end

  def test_pages_for_dataset_with_dataset_object_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { publisher: [page_metadata] } }
    )
    pages = manager.pages_for_dataset(OpenStruct.new(id: 'dd76-j9yp'))[:body]
    assert(pages[:publisher].length > 0)
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'dd76-j9yp' })
  end

  def test_pages_for_dataset_with_id_string_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { publisher: [page_metadata] } }
    )
    pages = manager.pages_for_dataset('dd76-j9yp')[:body]
    assert(pages[:publisher].length > 0)
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'dd76-j9yp' })
  end

  def test_pages_for_dataset_with_id_in_hash_succeeds
    Phidippides.any_instance.stubs(
      fetch_pages_for_dataset: { status: '200', body: { publisher: [page_metadata] } }
    )
    pages = manager.pages_for_dataset(id: 'dd76-j9yp')[:body]
    assert(pages[:publisher].length > 0)
    assert(pages[:publisher].all? { |page| page[:datasetId] == 'dd76-j9yp' })
  end

  # Yes, this is a private method, but it warranted at least some unit testing
  def test_build_soql
    manager.stubs(phidippides: stub(fetch_dataset_metadata: { body: dataset_metadata }))
    soql = manager.send(:build_rollup_soql, page_metadata)
    assert_equal('select sex, race, status, unit, type, action, count(*) as value group by sex, race, status, unit, type, action', soql)
  end

  private

  def manager
    @manager ||= PageMetadataManager.new
  end

  def page_metadata
    JSON.parse('
      {
        "pageId": "phip-crm1",
        "datasetId": "dd76-j9yp",
        "name": "Philadelphia Police Advisory Commission Complaints",
        "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
        "primaryAmountField": null,
        "primaryAggregation": "count",
        "filterSoql": null,
        "isDefaultPage": true,
        "pageSource": "admin",
        "cards": [
          {
            "description": "All Data",
            "fieldName": "*",
            "cardSize": 1,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "table card"
          },
          {
            "description": "Race",
            "fieldName": "race",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          },
          {
            "description": "Sex",
            "fieldName": "sex",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          },
          {
            "description": "Type",
            "fieldName": "type",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          },
          {
            "description": "Date",
            "fieldName": "date",
            "cardSize": 1,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "time"
          },
          {
            "description": "Police Districts",
            "fieldName": ":Computed_7mve5gn9_location_1",
            "cardSize": 1,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "shapeFile": "7mve-5gn9",
            "logicalType": "location"
          },
          {
            "description": "Status",
            "fieldName": "status",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          },
          {
            "description": "Unit",
            "fieldName": "unit",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          },
          {
            "description": "Neighborhoods",
            "fieldName": ":Computed_82gfy944_location_1",
            "cardSize": 1,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "shapeFile": "82gf-y944",
            "logicalType": "location"
          },
          {
            "description": "Action",
            "fieldName": "action",
            "cardSize": 2,
            "cardCustomStyle": {},
            "expandedCustomStyle": {},
            "displayMode": "visualization",
            "expanded": false,
            "logicalType": "category"
          }
        ]
      }
    ').with_indifferent_access
  end

  def page_metadata_without_tablecard
    page_metadata.dup.tap do |page_md|
      page_md['cards'] = page_md['cards'].select { |card| card['fieldName'] != '*' }
    end
  end

  def dataset_metadata
    JSON.parse('
      {
        "id": "dd76-j9yp",
        "rowDisplayUnit": "Complaint",
        "defaultAggregateColumn": ":count",
        "domain": "dataspace.demo.socrata.com",
        "ownerId": "nzs9-qk7u",
        "updatedAt": "2014-09-07T10:25:11.000-07:00",
        "columns": [
          {
            "physicalDatatype": "point",
            "name": "location_1",
            "title": "Location 1",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "location",
            "importance": 3
          },
          {
            "physicalDatatype": "number",
            "name": "latitude",
            "title": "Latitude",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "text",
            "importance": 3
          },
          {
            "physicalDatatype": "timestamp",
            "name": ":created_at",
            "title": ":Created_at",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "text",
            "importance": 3
          },
          {
            "physicalDatatype": "number",
            "name": "age",
            "title": "Age",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "amount",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": ":Computed_7mve5gn9_location_1",
            "title": "Police Districts",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "location",
            "importance": 3
          },
          {
            "physicalDatatype": "number",
            "name": "longitude",
            "title": "Longitude",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "text",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "sex",
            "title": "Sex",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          },
          {
            "physicalDatatype": "timestamp",
            "name": "date",
            "title": "Date",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "time",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "race",
            "title": "Race",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "status",
            "title": "Status",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          },
          {
            "physicalDatatype": "timestamp",
            "name": ":updated_at",
            "title": ":Updated_at",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "text",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "unit",
            "title": "Unit",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "type",
            "title": "Type",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": ":Computed_82gfy944_location_1",
            "title": "Neighborhoods",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "location",
            "importance": 3
          },
          {
            "physicalDatatype": "text",
            "name": "action",
            "title": "Action",
            "description": "Information about complaints filed with the Police Advisory Commission against Philadelphia Police officers from 2009 - 2012. Source data is availabe on Open Data Philly.",
            "logicalDatatype": "category",
            "importance": 3
          }
        ]
      }
   ').with_indifferent_access
  end

  def dataset_metadata_without_rollup_columns
    dataset_metadata.dup.tap do |dataset_md|
      dataset_md['columns'] = dataset_md['columns'].reject do |column|
        %w(category location).include?(column['logicalDatatype'])
      end
    end
  end
end
