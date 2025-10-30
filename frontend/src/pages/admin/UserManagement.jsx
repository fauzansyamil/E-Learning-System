// frontend/src/pages/admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  X,
  UserPlus,
  Filter
} from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import api from '../../services/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'mahasiswa',
    student_id: '',
    employee_id: ''
  });

  const [editForm, setEditForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', createForm);
      alert('User created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'mahasiswa',
        student_id: '',
        employee_id: ''
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}`, editForm);
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      alert('Password must be at least 6 characters!');
      return;
    }

    try {
      await api.put(`/users/${selectedUser.id}/change-password`, {
        new_password: passwordForm.new_password
      });
      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.full_name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${user.id}`);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      student_id: user.student_id || '',
      employee_id: user.employee_id || '',
      address: user.address || '',
      date_of_birth: user.date_of_birth || '',
      gender: user.gender || ''
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ new_password: '', confirm_password: '' });
    setShowPasswordModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'dosen':
        return 'bg-purple-100 text-purple-700';
      case 'mahasiswa':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
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
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage all users in the system
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="dosen">Dosen</option>
                <option value="mahasiswa">Mahasiswa</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Create User</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {user.full_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="text-green-600 hover:text-green-900"
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Create New User
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({...createForm, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="dosen">Dosen</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {createForm.role === 'mahasiswa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID (NIM)
                  </label>
                  <input
                    type="text"
                    value={createForm.student_id}
                    onChange={(e) => setCreateForm({...createForm, student_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {createForm.role === 'dosen' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID (NIP)
                  </label>
                  <input
                    type="text"
                    value={createForm.employee_id}
                    onChange={(e) => setCreateForm({...createForm, employee_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-6 h-6" />
                Edit User
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-6 h-6" />
                Change Password
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Changing password for: <span className="font-semibold">{selectedUser.full_name}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Repeat password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
