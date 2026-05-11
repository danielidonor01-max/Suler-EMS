import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up
    { duration: '1m', target: 50 },  // Sustained load
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be under 500ms
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Scenario 1: High-concurrency Attendance Ingestion
  const payload = JSON.stringify({
    deviceId: 'DEVICE_QA_001',
    events: [
      {
        biometricReference: `QA_REF_${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        action: 'CHECK_IN'
      }
    ]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': `CHAOS_${Date.now()}`
    },
  };

  const res = http.post(`${BASE_URL}/api/attendance/ingest`, payload, params);
  
  check(res, {
    'ingestion success': (r) => r.status === 200,
  });

  // Scenario 2: Concurrent Real-time Feed Polling
  // (In k6, we simulate the initial SSE handshake or long-polling fallback)
  const healthRes = http.get(`${BASE_URL}/api/system/health`);
  check(healthRes, {
    'health check success': (r) => r.status === 200,
  });

  sleep(1);
}
