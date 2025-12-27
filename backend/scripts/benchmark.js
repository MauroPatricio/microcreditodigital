import autocannon from 'autocannon';

const url = 'http://localhost:5000';

console.log('🚀 Starting Performance Benchmarks...\n');

// Test 1: Health Check
console.log('Test 1: Health Check Endpoint');
const healthResult = await autocannon({
    url: `${url}/health`,
    connections: 100,
    duration: 10,
    pipelining: 1
});

console.log(`\nHealth Check Results:
- Requests/sec: ${healthResult.requests.average}
- Latency p50: ${healthResult.latency.p50}ms
- Latency p95: ${healthResult.latency.p95}ms
- Latency p99: ${healthResult.latency.p99}ms
- Throughput: ${(healthResult.throughput.average / 1024 / 1024).toFixed(2)} MB/s
`);

// Test 2: Login Endpoint
console.log('\nTest 2: Login Endpoint');
const loginResult = await autocannon({
    url: `${url}/api/auth/login`,
    connections: 50,
    duration: 10,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123'
    })
});

console.log(`\nLogin Results:
- Requests/sec: ${loginResult.requests.average}
- Latency p50: ${loginResult.latency.p50}ms
- Latency p95: ${loginResult.latency.p95}ms
- Latency p99: ${loginResult.latency.p99}ms
- Errors: ${loginResult.errors}
`);

console.log('\n✅ Benchmark Complete!');
