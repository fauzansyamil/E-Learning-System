// frontend/src/pages/Discussions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  Reply,
  Filter,
  Search,
  Plus,
  X,
  User,
  Clock,
  MessageSquare
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

export default function Discussions() {
  const [discussions, setDiscussions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set());

  // New discussion form
  const [newDiscussion, setNewDiscussion] = useState({
    class_id: '',
    title: '',
    content: ''
  });

  // Reply form
  const [replyContent, setReplyContent] = useState('');

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedClass === 'all' 
        ? '/discussions'
        : `/discussions/class/${selectedClass}`;
      const response = await api.get(url);
      setDiscussions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching discussions:', error);
      // Fallback to demo data
      setDiscussions(getDemoDiscussions());
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    fetchClasses();
    fetchDiscussions();
  }, [fetchDiscussions]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([
        { id: 1, code: 'TI-301', name: 'Pemrograman Web Lanjutan' },
        { id: 2, code: 'TI-202', name: 'Struktur Data' }
      ]);
    }
  };

  const getDemoDiscussions = () => [
    {
      id: 1,
      class_id: 1,
      class_name: 'Pemrograman Web Lanjutan',
      created_by: 2,
      author: 'Ahmad Rizki',
      author_role: 'mahasiswa',
      title: 'Cara menggunakan React Hooks dengan benar?',
      content: 'Saya masih bingung tentang penggunaan useEffect dan useState. Bisakah dijelaskan kapan harus menggunakan masing-masing?',
      created_at: '2025-10-28T10:30:00',
      replies_count: 3,
      replies: [
        {
          id: 1,
          discussion_id: 1,
          user_id: 3,
          author: 'Dr. Budi Santoso',
          author_role: 'dosen',
          content: 'useState digunakan untuk menyimpan state yang bisa berubah, sedangkan useEffect untuk side effects seperti fetching data atau subscription.',
          created_at: '2025-10-28T11:00:00'
        },
        {
          id: 2,
          discussion_id: 1,
          user_id: 4,
          author: 'Dewi Lestari',
          author_role: 'mahasiswa',
          content: 'Terima kasih Pak! Sangat jelas penjelasannya.',
          created_at: '2025-10-28T11:15:00'
        }
      ]
    },
    {
      id: 2,
      class_id: 1,
      class_name: 'Pemrograman Web Lanjutan',
      created_by: 5,
      author: 'Eko Prasetyo',
      author_role: 'mahasiswa',
      title: 'Best practice untuk folder structure React?',
      content: 'Untuk project besar, bagaimana cara mengorganisir folder structure yang baik?',
      created_at: '2025-10-27T14:20:00',
      replies_count: 2,
      replies: []
    }
  ];

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/discussions', newDiscussion);
      setShowCreateModal(false);
      setNewDiscussion({ class_id: '', title: '', content: '' });
      fetchDiscussions();
      alert('Discussion created successfully!');
    } catch (error) {
      console.error('Error creating discussion:', error);
      alert('Failed to create discussion');
    }
  };

  const handleReply = async (discussionId) => {
    if (!replyContent.trim()) return;

    try {
      await api.post(`/discussions/${discussionId}/replies`, {
        content: replyContent
      });
      setReplyingTo(null);
      setReplyContent('');
      fetchDiscussions();
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    }
  };

  const toggleExpand = (discussionId) => {
    const newExpanded = new Set(expandedDiscussions);
    if (newExpanded.has(discussionId)) {
      newExpanded.delete(discussionId);
    } else {
      newExpanded.add(discussionId);
    }
    setExpandedDiscussions(newExpanded);
  };

  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         discussion.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading discussions...</p>
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
            <MessageCircle className="w-8 h-8 text-blue-600" />
            Forum Diskusi
          </h1>
          <p className="mt-2 text-gray-600">
            Diskusikan materi kuliah dengan dosen dan teman sekelas
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari diskusi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter by Class */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} - {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Diskusi</span>
            </button>
          </div>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {filteredDiscussions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Diskusi
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai diskusi baru dengan dosen dan teman sekelas Anda
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buat Diskusi Pertama
              </button>
            </div>
          ) : (
            filteredDiscussions.map((discussion) => (
              <div
                key={discussion.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Discussion Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {discussion.author}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            discussion.author_role === 'dosen'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {discussion.author_role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(discussion.created_at)}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mb-3">
                          {discussion.class_name}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {discussion.title}
                        </h3>
                        
                        <p className="text-gray-700 leading-relaxed">
                          {discussion.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => toggleExpand(discussion.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {discussion.replies_count || 0} Balasan
                      </span>
                    </button>

                    <button
                      onClick={() => setReplyingTo(discussion.id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      <span className="text-sm font-medium">Balas</span>
                    </button>
                  </div>
                </div>

                {/* Replies Section */}
                {expandedDiscussions.has(discussion.id) && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    <div className="p-6 space-y-4">
                      {discussion.replies && discussion.replies.length > 0 ? (
                        discussion.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-4">
                            {/* Reply Avatar */}
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>

                            {/* Reply Content */}
                            <div className="flex-1 bg-white rounded-lg p-4 shadow-sm">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-sm text-gray-900">
                                  {reply.author}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  reply.author_role === 'dosen'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {reply.author_role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          Belum ada balasan. Jadilah yang pertama!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === discussion.id && (
                  <div className="bg-gray-50 border-t border-gray-200 p-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Tulis balasan Anda..."
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleReply(discussion.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            <span>Kirim Balasan</span>
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Buat Diskusi Baru
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateDiscussion} className="p-6 space-y-4">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  value={newDiscussion.class_id}
                  onChange={(e) => setNewDiscussion({...newDiscussion, class_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih kelas...</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Diskusi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  placeholder="Contoh: Cara menggunakan React Hooks?"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Isi Diskusi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                  placeholder="Jelaskan pertanyaan atau topik yang ingin Anda diskusikan..."
                  rows="6"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Buat Diskusi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}