import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:3000/v1/chat/completions';
  const payload = JSON.stringify({
    model: 'mock-gpt', // Use mock to avoid costs/latency
    messages: [
      { role: 'user', content: 'Load test message' },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-perpetuo-pro-1', // Ensure this matches config
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'status is 429': (r) => r.status === 429, // Expect some rate limits
  });

  sleep(1);
}
