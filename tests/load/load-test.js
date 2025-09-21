/**
 * SafeYatri Load Testing Script
 * Tests system performance under load
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],   // Error rate under 10%
    errors: ['rate<0.1'],            // Custom error rate under 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_USERS = [
  { username: 'admin', password: 'SafeYatri@2024' },
  { username: 'dispatcher', password: 'SafeYatri@2024' },
  { username: 'police', password: 'SafeYatri@2024' },
];

// Global variables
let authToken = null;
let touristId = null;

export function setup() {
  // Login and get token
  const loginData = TEST_USERS[0];
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginResponse.status === 200) {
    const loginResult = JSON.parse(loginResponse.body);
    return { token: loginResult.access_token };
  }
  
  return { token: null };
}

export default function(data) {
  const token = data.token;
  if (!token) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test scenarios
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    // 30% - Dashboard stats
    testDashboardStats(headers);
  } else if (scenario < 0.5) {
    // 20% - Tourist registration
    testTouristRegistration(headers);
  } else if (scenario < 0.7) {
    // 20% - Violence alerts
    testViolenceAlerts(headers);
  } else if (scenario < 0.85) {
    // 15% - CCTV zones
    testCCTVZones(headers);
  } else {
    // 15% - Dispatcher workflow
    testDispatcherWorkflow(headers);
  }

  sleep(1);
}

function testDashboardStats(headers) {
  const response = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
  
  const success = check(response, {
    'dashboard stats status is 200': (r) => r.status === 200,
    'dashboard stats has required fields': (r) => {
      const data = JSON.parse(r.body);
      return data.hasOwnProperty('active_tourists') && 
             data.hasOwnProperty('active_alerts') && 
             data.hasOwnProperty('iot_devices');
    },
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testTouristRegistration(headers) {
  const touristData = {
    name: `Load Test Tourist ${Math.random().toString(36).substr(2, 9)}`,
    passport_number: `P${Math.floor(Math.random() * 1000000)}`,
    nationality: 'Indian',
    emergency_contact: `+91-${Math.floor(Math.random() * 10000000000)}`,
    trip_itinerary: 'Test Itinerary'
  };

  const response = http.post(`${BASE_URL}/api/tourists/register`, JSON.stringify(touristData), { headers });
  
  const success = check(response, {
    'tourist registration status is 200': (r) => r.status === 200,
    'tourist registration returns tourist_id': (r) => {
      const data = JSON.parse(r.body);
      return data.hasOwnProperty('tourist_id');
    },
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testViolenceAlerts(headers) {
  const response = http.get(`${BASE_URL}/api/violence/alerts`, { headers });
  
  const success = check(response, {
    'violence alerts status is 200': (r) => r.status === 200,
    'violence alerts returns array': (r) => {
      const data = JSON.parse(r.body);
      return Array.isArray(data.alerts);
    },
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testCCTVZones(headers) {
  const response = http.get(`${BASE_URL}/api/cctv/zones`, { headers });
  
  const success = check(response, {
    'CCTV zones status is 200': (r) => r.status === 200,
    'CCTV zones returns zones array': (r) => {
      const data = JSON.parse(r.body);
      return Array.isArray(data.zones);
    },
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testDispatcherWorkflow(headers) {
  // Get dispatcher inbox
  const inboxResponse = http.get(`${BASE_URL}/api/workflow/dispatcher-inbox`, { headers });
  
  const success = check(inboxResponse, {
    'dispatcher inbox status is 200': (r) => r.status === 200,
    'dispatcher inbox returns alerts array': (r) => {
      const data = JSON.parse(r.body);
      return Array.isArray(data.alerts);
    },
  });
  
  errorRate.add(!success);
  responseTime.add(inboxResponse.timings.duration);
}

export function teardown(data) {
  console.log('Load test completed');
  console.log(`Final token: ${data.token ? 'Valid' : 'Invalid'}`);
}
