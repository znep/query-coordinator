export default [
  {
    output_columns: [
      { id: 50 },
      { id: 51 }
    ]
  },
  {
    offset: 0,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: "031A"
            }
          },
          message: "Failed to convert \"031A\" to number"
        }
      },
      {
        ok: "foo"
      }
    ]
  },
  {
    offset: 7,
    row: [
      {
        error: {
          inputs: {
            arrest: {
              ok: "031A"
            }
          },
          message: "Failed to convert \"031A\" to number"
        }
      },
      {
        ok: "bar"
      }
    ]
  }
];
