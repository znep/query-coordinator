export function mockResponse(body, status, statusText) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    statusText
  });
}
