class Goal < Model
  def self.find( options = nil, custom_headers = {}, batch = false, is_anon = false )
    goals = parse([{
      id: 'efgh-5678',
      name: 'Water Cleanliness',
      subject: 'Improve water cleanliness from "poisinous" to "distasteful"',
      category: 'Health',
      agency: ['Department of Water', 'Health Safety Department', 'Citizen Death Management Panel'],
      related_datasets: [],
      metric_datasets: ['wpc5-2rbf', '24vs-rw4z', 'qp2v-ypgh', 'irxs-ajcp'],
      start_date: '2012-01-01',
      #end_date: 
      #goal_delta: // num
      #goal_delta_is_pct: // pct or rawunits?
      is_public: true,
      metrics: [{
        title: 'Died from water',
        unit: 'people',
        #comparison: “<”, “>”, //f(metric, baseline|burndown)  -> Great, Just oK, NEEDS WORK
        compute: {
          metric_value: 155000,
          baseline_value: 150000,
          progress: 'poor',
          delta: '-5'
        }
      }, {
        title: 'Got sick from water',
        unit: 'people',
        #comparison: “<”, “>”, //f(metric, baseline|burndown)  -> Great, Just oK, NEEDS WORK
        compute: {
          metric_value: 250000,
          baseline_value: 300000,
          progress: 'good',
          delta: '15'
        }
      }, {
        title: 'Refused to drink water',
        unit: 'people',
        #comparison: “<”, “>”, //f(metric, baseline|burndown)  -> Great, Just oK, NEEDS WORK
        compute: {
          metric_value: 500000,
          baseline_value: 500000,
          progress: 'flat',
          delta: '0'
        }
      }]
    }, {
      id: '1fgh-5678',
      name: 'Water Thickness',
      subject: 'Improve water consistency from "concrete" to "sludge"',
      category: 'Health',
      agency: ['Department of Water', 'Health Safety Department', 'Citizen Death Management Panel'],
      related_datasets: [],
      metric_datasets: [],
      #start_date: // needs to be a value in the dataset
      #end_date: 
      #goal_delta: // num
      #goal_delta_is_pct: // pct or rawunits?
      is_public: true,
      #metrics: [{compute: {delta: '-5'}}]
    }, {
      id: '2fgh-5678',
      name: 'Water Purity',
      subject: 'Improve water purity from "raw sewage" to "dirty"',
      category: 'Health',
      agency: ['Department of Water', 'Health Safety Department', 'Citizen Death Management Panel'],
      related_datasets: [],
      metric_datasets: [],
      #start_date: // needs to be a value in the dataset
      #end_date: 
      #goal_delta: // num
      #goal_delta_is_pct: // pct or rawunits?
      is_public: true,
    }, {
      id: 'abcd-1234',
      name: 'Jobs',
      subject: 'Increase jobs for Seattle in the next 12 months',
      category: 'Economy',
      agency: ['Economic Office', 'Department of Employment'],
      related_datasets: [],
      metric_datasets: [],
      #start_date: // needs to be a value in the dataset
      #end_date: 
      #goal_delta: // num
      #goal_delta_is_pct: // pct or rawunits?
      is_public: true,
      #metadata: // json hash for things like icons, etc.

      metrics: [{
        title: 'Current employment',
        unit: 'people',
        #comparison: “<”, “>”, //f(metric, baseline|burndown)  -> Great, Just oK, NEEDS WORK
        compute: {
          metric_value: 200000,
          baseline_value: 150000,
          progress: 'good',
          delta: '25'
        },
        current: {
          #dataset:4x4,
          #column1:"column_name"  
          #column2:”column_name” // Optional column in case we need numerator/denominator
          compute: {
             #aggregation_function: // how to roll up data.  see below.
             #column_function: “null”, “plus”, “divide”, “minus” //how to combine the columns if necessary
             #metric_period “continuously”, “hourly”, “daily”, “weekly”, “monthly”, “yearly” // period required for computation, so we roll up data_period, using aggregation_function
             }
          },

#        baseline: { // first baseline is prevailing
#          type: burndown
#          dataset: 4x4 // always be same as metric ds
#          column1:”column_name” // always be same as metric ds
#          column2:”column_name” // always be same as metric ds
#          start_date: // ????
#          end_date: // ????
#          compute: {
#            aggregation_function: , “extrapolate”, “sum” // some col_function(agg(col1), agg(col2))
#            column_function: “divide” //how to combine the columns if necessary/ hardcoded for now
#            metric_period: // if weekly data and we need monthly rollups.
#            }
#          }
        }]
    }].to_json)
    options.is_a?(String) ? goals[0] : goals
  end
end
