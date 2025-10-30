// frontend/src/pages/Schedule.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Book, Filter, Grid, List } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Schedule() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Color palette for classes
  const classColors = [
    'bg-blue-100 border-blue-500 text-blue-700',
    'bg-green-100 border-green-500 text-green-700',
    'bg-purple-100 border-purple-500 text-purple-700',
    'bg-orange-100 border-orange-500 text-orange-700',
    'bg-pink-100 border-pink-500 text-pink-700',
    'bg-indigo-100 border-indigo-500 text-indigo-700',
  ];

  useEffect(() => {
    fetchSchedules();
  }, [selectedSemester]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/classes?semester=${selectedSemester}`);
      // Parse schedule from backend
      const parsedSchedules = response.data.data.map((course, index) => ({
        id: course.id,
        code: course.code,
        name: course.name,
        instructor: course.instructor_name,
        room: course.room || 'TBA',
        credits: course.credits,
        // Parse schedule string (e.g., "Senin, 13:00-15:30")
        day: parseDay(course.schedule),
        startTime: parseStartTime(course.schedule),
        endTime: parseEndTime(course.schedule),
        color: classColors[index % classColors.length],
        semester: course.semester
      }));
      setSchedules(parsedSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      // Fallback to demo data
      setSchedules(getDemoSchedules());
    } finally {
      setLoading(false);
    }
  };

  const parseDay = (scheduleString) => {
    if (!scheduleString) return null;
    const dayMatch = scheduleString.match(/(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)/i);
    return dayMatch ? dayMatch[1] : null;
  };

  const parseStartTime = (scheduleString) => {
    if (!scheduleString) return null;
    const timeMatch = scheduleString.match(/(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[1] : null;
  };

  const parseEndTime = (scheduleString) => {
    if (!scheduleString) return null;
    const timeMatch = scheduleString.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    return timeMatch ? timeMatch[2] : null;
  };

  const getDemoSchedules = () => [
    {
      id: 1,
      code: 'TI-301',
      name: 'Pemrograman Web Lanjutan',
      instructor: 'Dr. Budi Santoso',
      room: 'Lab Komputer 3',
      credits: 3,
      day: 'Senin',
      startTime: '13:00',
      endTime: '15:30',
      color: classColors[0],
      semester: 'Genap 2024/2025'
    },
    {
      id: 2,
      code: 'TI-202',
      name: 'Struktur Data',
      instructor: 'Prof. Siti Nurhaliza',
      room: 'Ruang 401',
      credits: 3,
      day: 'Selasa',
      startTime: '08:00',
      endTime: '10:30',
      color: classColors[1],
      semester: 'Genap 2024/2025'
    },
    {
      id: 3,
      code: 'TI-103',
      name: 'Basis Data',
      instructor: 'Dr. Ahmad Rizki',
      room: 'Lab Database',
      credits: 3,
      day: 'Rabu',
      startTime: '10:00',
      endTime: '12:30',
      color: classColors[2],
      semester: 'Genap 2024/2025'
    },
    {
      id: 4,
      code: 'TI-204',
      name: 'Algoritma Lanjutan',
      instructor: 'Dr. Dewi Lestari',
      room: 'Ruang 302',
      credits: 3,
      day: 'Kamis',
      startTime: '13:00',
      endTime: '15:30',
      color: classColors[3],
      semester: 'Genap 2024/2025'
    },
    {
      id: 5,
      code: 'TI-305',
      name: 'Jaringan Komputer',
      instructor: 'Ir. Eko Prasetyo',
      room: 'Lab Jaringan',
      credits: 3,
      day: 'Jumat',
      startTime: '09:00',
      endTime: '11:30',
      color: classColors[4],
      semester: 'Genap 2024/2025'
    }
  ];

  const getSchedulesByDay = (day) => {
    return schedules.filter(s => s.day === day);
  };

  const getScheduleAtTime = (day, time) => {
    return schedules.find(s => {
      if (s.day !== day) return false;
      const scheduleStart = s.startTime;
      const scheduleEnd = s.endTime;
      return time >= scheduleStart && time < scheduleEnd;
    });
  };

  const getDayIndex = (dayName) => {
    return days.indexOf(dayName);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Jadwal Kuliah
          </h1>
          <p className="mt-2 text-gray-600">
            Lihat jadwal kuliah Anda untuk semester ini
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Semester Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="current">Semester Saat Ini</option>
                <option value="2024/2025-Genap">Genap 2024/2025</option>
                <option value="2024/2025-Ganjil">Ganjil 2024/2025</option>
                <option value="2023/2024-Genap">Genap 2023/2024</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="font-medium">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="font-medium">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-6 border-b border-gray-200">
              {days.slice(1, 7).map((day, index) => (
                <div
                  key={day}
                  className={`p-4 text-center font-semibold ${
                    index === selectedDay - 1
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="overflow-auto max-h-[600px]">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-6 border-b border-gray-100">
                  {days.slice(1, 7).map((day) => {
                    const schedule = getScheduleAtTime(day, time);
                    return (
                      <div
                        key={`${day}-${time}`}
                        className="border-r border-gray-100 p-2 min-h-[80px] relative"
                      >
                        {/* Time Label (show only in first column) */}
                        {day === 'Senin' && (
                          <div className="absolute -left-16 top-2 text-xs text-gray-500 font-medium">
                            {time}
                          </div>
                        )}

                        {/* Schedule Card */}
                        {schedule && schedule.startTime === time && (
                          <div
                            className={`${schedule.color} border-l-4 rounded-lg p-3 shadow-sm h-full`}
                          >
                            <div className="font-semibold text-sm mb-1">
                              {schedule.code}
                            </div>
                            <div className="text-xs mb-2 line-clamp-2">
                              {schedule.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <Clock className="w-3 h-3" />
                              <span>{schedule.startTime} - {schedule.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs mb-1">
                              <MapPin className="w-3 h-3" />
                              <span>{schedule.room}</span>
                            </div>
                            <div className="text-xs opacity-75">
                              {schedule.instructor}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {days.slice(1, 7).map((day) => {
              const daySchedules = getSchedulesByDay(day);
              if (daySchedules.length === 0) return null;

              return (
                <div key={day} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <h3 className="text-xl font-bold text-white">{day}</h3>
                    <p className="text-blue-100 text-sm">
                      {daySchedules.length} kelas terjadwal
                    </p>
                  </div>

                  {/* Schedule Cards */}
                  <div className="divide-y divide-gray-200">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                {schedule.code}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {schedule.credits} SKS
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">
                              {schedule.name}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span>{schedule.startTime} - {schedule.endTime}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 text-green-600" />
                                <span>{schedule.room}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-4 h-4 text-purple-600" />
                                <span>{schedule.instructor}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => window.location.href = `/course/${schedule.id}`}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Detail Kelas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Statistics Card */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Mata Kuliah</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total SKS</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedules.reduce((sum, s) => sum + s.credits, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hari Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(schedules.map(s => s.day)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}