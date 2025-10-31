// frontend/src/pages/AnnouncementsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  AlertCircle,
  Bell,
  Filter,
  Search,
  Clock,
  User,
  BookOpen
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, searchQuery, priorityFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      alert('Failed to fetch announcements: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((a) => a.priority === priorityFilter);
    }

    setFilteredAnnouncements(filtered);
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          icon: 'bg-red-500',
          label: 'URGENT'
        };
      case 'high':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          icon: 'bg-orange-500',
          label: 'HIGH'
        };
      case 'normal':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          icon: 'bg-blue-500',
          label: 'NORMAL'
        };
      case 'low':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: 'bg-gray-500',
          label: 'LOW'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: 'bg-gray-500',
          label: 'NORMAL'
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading announcements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Announcements</h1>
          </div>
          <p className="text-purple-100">Important updates and news</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Announcements</h3>
            <p className="text-gray-600">
              {searchQuery || priorityFilter !== 'all'
                ? 'No announcements match your filters'
                : 'No announcements available at this time'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Announcements List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredAnnouncements.map((announcement) => {
                const priority = getPriorityBadge(announcement.priority);
                return (
                  <div
                    key={announcement.id}
                    onClick={() => setSelectedAnnouncement(announcement)}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                      selectedAnnouncement?.id === announcement.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Priority Indicator */}
                        <div className={`w-1 h-full ${priority.icon} rounded-full flex-shrink-0`}></div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                                  {priority.label}
                                </span>
                                {announcement.class_name && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {announcement.class_code}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {announcement.title}
                              </h3>
                            </div>
                          </div>

                          {/* Content Preview */}
                          <p className="text-gray-700 mb-4 line-clamp-2">{announcement.content}</p>

                          {/* Footer */}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {announcement.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(announcement.published_at || announcement.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Announcement Detail */}
            <div className="lg:col-span-1">
              {selectedAnnouncement ? (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
                  <div className="p-6">
                    <div className="mb-4">
                      {(() => {
                        const priority = getPriorityBadge(selectedAnnouncement.priority);
                        return (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.text}`}>
                            {priority.label}
                          </span>
                        );
                      })()}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      {selectedAnnouncement.title}
                    </h2>

                    {selectedAnnouncement.class_name && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {selectedAnnouncement.class_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {selectedAnnouncement.class_code}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="prose prose-sm max-w-none mb-6">
                      <p className="whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>Posted by {selectedAnnouncement.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDate(
                            selectedAnnouncement.published_at || selectedAnnouncement.created_at
                          )}
                        </span>
                      </div>
                      {selectedAnnouncement.expires_at && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>Expires: {new Date(selectedAnnouncement.expires_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center sticky top-4">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Select an announcement to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
