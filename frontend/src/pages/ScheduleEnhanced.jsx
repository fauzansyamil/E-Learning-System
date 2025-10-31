// frontend/src/pages/ScheduleEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Building, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function ScheduleEnhanced() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'list'
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get('/schedules/my-schedule');
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      alert('Failed to fetch schedule: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesByDay = (day) => {
    return schedules.filter(s => s.day_of_week === day);
  };

  const getSessionTypeColor = (type) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'lab':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'tutorial':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'exam':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00:00`);
    }
    return slots;
  };

  const isScheduleInTimeSlot = (schedule, slotTime) => {
    const scheduleStart = schedule.start_time;
    const scheduleEnd = schedule.end_time;
    return scheduleStart <= slotTime && scheduleEnd > slotTime;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8" />
            <h1 className="text-3xl font-bold">My Schedule</h1>
          </div>
          <p className="text-indigo-100">Your weekly class schedule</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                List View
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{schedules.length}</span> sessions per week
            </div>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Schedule Yet</h3>
            <p className="text-gray-600">
              Your class schedule will appear here once you enroll in classes.
            </p>
          </div>
        ) : viewMode === 'week' ? (
          /* Week Calendar View */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 p-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                      Time
                    </th>
                    {daysOfWeek.map((day) => (
                      <th
                        key={day}
                        className="p-4 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 min-w-[150px]"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getTimeSlots().map((timeSlot) => (
                    <tr key={timeSlot} className="border-t border-gray-200">
                      <td className="sticky left-0 z-10 bg-white p-4 text-sm text-gray-600 font-medium border-r border-gray-200">
                        {formatTime(timeSlot)}
                      </td>
                      {daysOfWeek.map((day) => {
                        const daySchedules = getSchedulesByDay(day);
                        const schedule = daySchedules.find(s => isScheduleInTimeSlot(s, timeSlot));

                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className="p-2 border-r border-gray-200 align-top"
                          >
                            {schedule && schedule.start_time === timeSlot && (
                              <div
                                className={`p-3 rounded-lg border-l-4 ${getSessionTypeColor(schedule.session_type)}`}
                              >
                                <div className="font-semibold text-sm mb-1 line-clamp-2">
                                  {schedule.class_name}
                                </div>
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                  </div>
                                  {schedule.room && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {schedule.room}
                                    </div>
                                  )}
                                  <div className="uppercase font-medium">
                                    {schedule.session_type}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const daySchedules = getSchedulesByDay(day);
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                    <h3 className="font-semibold text-gray-900">{day}</h3>
                    <p className="text-sm text-gray-600">{daySchedules.length} session(s)</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {daySchedules
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((schedule) => (
                        <div key={schedule.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div className="text-center min-w-[80px]">
                              <div className="text-lg font-bold text-gray-900">
                                {formatTime(schedule.start_time)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(schedule.end_time)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                    {schedule.class_name}
                                  </h4>
                                  <div className="text-sm text-gray-600">
                                    {schedule.class_code}
                                  </div>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getSessionTypeColor(
                                    schedule.session_type
                                  )}`}
                                >
                                  {schedule.session_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {schedule.room && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {schedule.room}
                                  </div>
                                )}
                                {schedule.building && (
                                  <div className="flex items-center gap-1">
                                    <Building className="w-4 h-4" />
                                    {schedule.building}
                                  </div>
                                )}
                                {schedule.instructor_name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {schedule.instructor_name}
                                  </div>
                                )}
                              </div>
                              {schedule.notes && (
                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {schedule.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
