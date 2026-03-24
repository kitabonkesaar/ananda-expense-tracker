/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { Phone, UserPlus, Shield, User, Search, Check, X, ShieldAlert, BadgeCheck, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { allUsers, user: currentUser } = useAuth();
  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const removeUser = useMutation(api.users.remove);

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setPhone('');
    setRole('staff');
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (user: any) => {
    setName(user.name);
    setPhone(user.phone);
    setRole(user.role);
    setIsActive(user.isActive);
    setEditingId(user._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and Phone are required.');
      return;
    }

    if (editingId) {
      await updateUser({
        id: editingId as any,
        name: name.trim(),
        phone: phone.trim(),
        role,
        isActive,
      });
      toast.success('User updated successfully');
    } else {
      await createUser({
        name: name.trim(),
        phone: phone.trim(),
        role,
        isActive,
      });
      toast.success('User created successfully');
    }
    resetForm();
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentUser?._id) {
       toast.error("You cannot deactivate your own account.");
       return;
    }
    await updateUser({ id: id as any, isActive: !currentStatus });
    toast.success(`User set to ${!currentStatus ? 'Active' : 'Inactive'}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?._id) {
       toast.error("You cannot delete your own account.");
       return;
    }
    if (confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
       try {
          await removeUser({ id: id as any });
          toast.success('User deleted successfully');
          if (editingId === id) resetForm();
       } catch (error) {
          toast.error('Failed to delete user');
       }
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    const lower = searchQuery.toLowerCase();
    return allUsers.filter(u => u.name.toLowerCase().includes(lower) || u.phone.includes(lower));
  }, [allUsers, searchQuery]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team Management</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Manage team members, roles, and access.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm ${
            showForm 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><UserPlus className="w-4 h-4" /> Add Member</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100/50">
            <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" /> {editingId ? 'Edit Team Member' : 'New Team Member'}
            </h3>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Role</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['staff', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                        role === r 
                          ? r === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-700 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                      }`}
                    >
                      {r === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setIsActive(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Active
                  </button>
                  <button
                    onClick={() => setIsActive(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      !isActive ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Inactive
                  </button>
                </div>
              </div>

            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-sm shadow-indigo-200 mt-4 flex items-center justify-center gap-2"
            >
              <BadgeCheck className="w-4 h-4" />
              {editingId ? 'Update Team Member' : 'Save Team Member'}
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all shadow-sm placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl border-dashed">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-sm">No team members found.</p>
          </div>
        ) : (
          filteredUsers.map(member => (
            <div key={member._id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-indigo-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 shadow-sm ${
                    member.isActive 
                      ? member.role === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-900 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {member.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className={`font-bold text-[15px] ${member.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{member.name}</h3>
                    <div className={`mt-1 inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border ${
                      member.role === 'admin' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {member.role}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                    title="Edit User"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleUserStatus(member._id, member.isActive)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      member.isActive 
                        ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' 
                        : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={member.isActive ? 'Deactivate User' : 'Activate User'}
                  >
                    {member.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(member._id, member.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Phone className="w-3.5 h-3.5" />
                  {member.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-rose-400'}`}></span>
                  <span className={`text-[11px] font-bold ${member.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
