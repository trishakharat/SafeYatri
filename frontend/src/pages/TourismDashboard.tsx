import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  UserGroupIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

interface TourismStats {
  total_tourists: number;
  active_tourists: number;
  new_arrivals_today: number;
  departures_today: number;
  avg_stay_duration: number;
  safety_score: number;
  popular_destinations: Array<{
    name: string;
    visitors: number;
    safety_rating: number;
  }>;
  nationality_breakdown: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
}

const TourismDashboard: React.FC = () => {
  const { touristLocations, alerts } = useSocket();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [advisoryText, setAdvisoryText] = useState('');
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);

  // Mock tourism statistics
  const tourismStats: TourismStats = {
    total_tourists: 1247,
    active_tourists: touristLocations.length,
    new_arrivals_today: 89,
    departures_today: 67,
    avg_stay_duration: 4.2,
    safety_score: 8.7,
    popular_destinations: [
      { name: 'Red Fort', visitors: 342, safety_rating: 8.5 },
      { name: 'India Gate', visitors: 289, safety_rating: 9.2 },
      { name: 'Qutub Minar', visitors: 234, safety_rating: 8.8 },
      { name: 'Lotus Temple', visitors: 198, safety_rating: 9.5 },
      { name: 'Humayun\'s Tomb', visitors: 156, safety_rating: 8.9 }
    ],
    nationality_breakdown: [
      { country: 'India', count: 456, percentage: 36.6 },
      { country: 'USA', count: 234, percentage: 18.8 },
      { country: 'UK', count: 189, percentage: 15.2 },
      { country: 'Germany', count: 123, percentage: 9.9 },
      { country: 'France', count: 98, percentage: 7.9 },
      { country: 'Others', count: 147, percentage: 11.8 }
    ]
  };

  const safetyTrends = [
    { date: '2024-01-15', incidents: 2, score: 8.9 },
    { date: '2024-01-16', incidents: 1, score: 9.1 },
    { date: '2024-01-17', incidents: 3, score: 8.7 },
    { date: '2024-01-18', incidents: 0, score: 9.3 },
    { date: '2024-01-19', incidents: 1, score: 9.0 },
    { date: '2024-01-20', incidents: 2, score: 8.8 },
    { date: '2024-01-21', incidents: 1, score: 8.9 }
  ];

  const recentIncidents = alerts.slice(0, 5);
  const criticalAreas = [
    { name: 'Chandni Chowk Market', risk_level: 'medium', recent_incidents: 3 },
    { name: 'Old Delhi Railway Station', risk_level: 'high', recent_incidents: 5 },
    { name: 'Karol Bagh Market', risk_level: 'low', recent_incidents: 1 }
  ];

  const publishAdvisory = () => {
    if (!advisoryText.trim()) return;
    // In real implementation, this would call the API
    console.log('Publishing advisory:', advisoryText);
    alert('Travel advisory published successfully!');
    setAdvisoryText('');
    setShowAdvisoryModal(false);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-700 bg-red-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600';
    if (score >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tourism Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time tourist safety monitoring and analytics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className={clsx('text-2xl font-bold', getSafetyScoreColor(tourismStats.safety_score))}>
                {tourismStats.safety_score}/10
              </div>
              <div className="text-xs text-gray-600">Safety Score</div>
            </div>
            <button
              onClick={() => setShowAdvisoryModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <SpeakerWaveIcon className="h-4 w-4 mr-2" />
              Issue Advisory
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tourists</dt>
                  <dd className="text-lg font-medium text-gray-900">{tourismStats.total_tourists.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm text-green-600">
              <TrendingUpIcon className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Now</dt>
                  <dd className="text-lg font-medium text-gray-900">{tourismStats.active_tourists}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Real-time tracking enabled
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New Arrivals</dt>
                  <dd className="text-lg font-medium text-gray-900">{tourismStats.new_arrivals_today}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Today
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Stay</dt>
                  <dd className="text-lg font-medium text-gray-900">{tourismStats.avg_stay_duration} days</dd>
                </dl>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Duration
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Destinations */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Destinations</h3>
          <div className="space-y-4">
            {tourismStats.popular_destinations.map((destination, index) => (
              <div key={destination.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{destination.name}</p>
                    <p className="text-xs text-gray-500">{destination.visitors} visitors today</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-900">
                      {destination.safety_rating}/10
                    </span>
                    <div className={clsx(
                      'w-2 h-2 rounded-full',
                      destination.safety_rating >= 9 ? 'bg-green-500' :
                      destination.safety_rating >= 7 ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                  </div>
                  <p className="text-xs text-gray-500">Safety Rating</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nationality Breakdown */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tourist Demographics</h3>
          <div className="space-y-3">
            {tourismStats.nationality_breakdown.map((country) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{country.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 w-20">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {country.count}
                  </span>
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {country.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Safety Trends (Last 7 Days)</h3>
          <div className="space-y-3">
            {safetyTrends.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(day.date), 'MMM dd')}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{day.incidents}</div>
                    <div className="text-xs text-gray-500">Incidents</div>
                  </div>
                  <div className="text-center">
                    <div className={clsx('text-sm font-medium', getSafetyScoreColor(day.score))}>
                      {day.score}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Areas */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
          
          {/* Critical Areas */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Areas Requiring Attention</h4>
            <div className="space-y-3">
              {criticalAreas.map((area) => (
                <div key={area.name} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{area.name}</p>
                      <p className="text-xs text-gray-500">{area.recent_incidents} incidents this week</p>
                    </div>
                  </div>
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getRiskColor(area.risk_level)
                  )}>
                    {area.risk_level.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Incidents</h4>
            {recentIncidents.length > 0 ? (
              <div className="space-y-2">
                {recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 capitalize">{incident.type}</p>
                      <p className="text-xs text-yellow-600">
                        {format(new Date(incident.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent incidents</p>
            )}
          </div>
        </div>
      </div>

      {/* Advisory Modal */}
      {showAdvisoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Travel Advisory</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Advisory Type</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>General Safety</option>
                  <option>Weather Alert</option>
                  <option>Area Restriction</option>
                  <option>Emergency Notice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  value={advisoryText}
                  onChange={(e) => setAdvisoryText(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter advisory message for tourists..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAdvisoryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={publishAdvisory}
                disabled={!advisoryText.trim()}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Publish Advisory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourismDashboard;
