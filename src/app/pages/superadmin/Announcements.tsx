import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Megaphone, Plus, Edit2, Trash2, Pin, Globe, Store, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { announcementStorage, Announcement } from '../../lib/storage';

const typeConfig = {
  info:        { label: 'Info',        bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: 'bg-blue-600',   dot: 'bg-blue-500' },
  warning:     { label: 'Warning',     bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: 'bg-yellow-500', dot: 'bg-yellow-500' },
  success:     { label: 'Success',     bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  icon: 'bg-green-600',  dot: 'bg-green-500' },
  maintenance: { label: 'Maintenance', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    icon: 'bg-red-600',    dot: 'bg-red-500' },
};

const audienceConfig: Record<string, string> = {
  all:      'All Users',
  owners:   'Shop Owners',
  managers: 'Managers',
  cashiers: 'Cashiers',
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => announcementStorage.getAll());
  const [showModal, setShowModal] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [form, setForm] = useState({
    title: '', message: '', type: 'info' as Announcement['type'],
    audience: 'all' as Announcement['audience'], pinned: false, active: true,
  });

  const openCreate = () => {
    setForm({ title: '', message: '', type: 'info', audience: 'all', pinned: false, active: true });
    setEditAnn(null);
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setForm({ title: a.title, message: a.message, type: a.type, audience: a.audience, pinned: a.pinned, active: a.active });
    setEditAnn(a);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    if (editAnn) {
      announcementStorage.update({ ...editAnn, ...form });
      toast.success('Announcement updated');
    } else {
      announcementStorage.create(form);
      toast.success('Announcement published');
    }
    setAnnouncements(announcementStorage.getAll());
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    announcementStorage.delete(id);
    setAnnouncements(announcementStorage.getAll());
    toast.success('Announcement deleted');
  };

  const togglePin = (ann: Announcement) => {
    announcementStorage.update({ ...ann, pinned: !ann.pinned });
    setAnnouncements(announcementStorage.getAll());
  };

  const toggleActive = (ann: Announcement) => {
    announcementStorage.update({ ...ann, active: !ann.active });
    setAnnouncements(announcementStorage.getAll());
  };

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Broadcast messages and updates to all shops"
        badge={`${announcements.filter(a => a.active).length} active`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25" style={{ fontWeight: 600 }}>
            <Plus size={15} /> New Announcement
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: announcements.length, color: 'blue' },
          { label: 'Active', value: announcements.filter(a => a.active).length, color: 'green' },
          { label: 'Pinned', value: announcements.filter(a => a.pinned).length, color: 'yellow' },
          { label: 'Inactive', value: announcements.filter(a => !a.active).length, color: 'gray' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className={`text-2xl text-${color === 'blue' ? 'blue' : color === 'green' ? 'green' : color === 'yellow' ? 'yellow' : 'gray'}-600 mb-0.5`} style={{ fontWeight: 800 }}>{value}</div>
            <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Announcements list */}
      <div className="space-y-4">
        {sorted.map(ann => {
          const tc = typeConfig[ann.type];
          return (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border shadow-sm transition-all ${ann.pinned ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'} ${!ann.active ? 'opacity-60' : ''}`}
            >
              <div className={`px-5 py-4 border-b ${tc.border} ${tc.bg} rounded-t-2xl flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {ann.pinned && (
                    <div className="flex items-center gap-1 text-blue-600 text-[10px]" style={{ fontWeight: 700 }}>
                      <Pin size={11} className="fill-blue-600" /> PINNED
                    </div>
                  )}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${tc.bg} ${tc.border} ${tc.text}`} style={{ fontWeight: 600 }}>
                    {tc.label}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 bg-white">
                    <Globe size={10} /> {audienceConfig[ann.audience]}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${ann.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`} style={{ fontWeight: 600 }}>
                    {ann.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(ann.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="px-5 py-4">
                <div className="text-gray-900 mb-2" style={{ fontWeight: 600 }}>{ann.title}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{ann.message}</p>
              </div>
              <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2">
                <button
                  onClick={() => togglePin(ann)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${ann.pinned ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-700'}`}
                  style={{ fontWeight: 600 }}
                >
                  <Pin size={12} /> {ann.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => toggleActive(ann)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${ann.active ? 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                  style={{ fontWeight: 600 }}
                >
                  <CheckCircle size={12} /> {ann.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => openEdit(ann)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors ml-auto"
                  style={{ fontWeight: 600 }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editAnn ? 'Edit Announcement' : 'New Announcement'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors" style={{ fontWeight: 500 }}>
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm" style={{ fontWeight: 600 }}>
              {editAnn ? 'Update' : 'Publish'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Title</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
              placeholder="Full announcement message…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Type</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as Announcement['type'] }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="success">Success / New Feature</option>
                <option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>Audience</label>
              <select
                value={form.audience}
                onChange={e => setForm(p => ({ ...p, audience: e.target.value as Announcement['audience'] }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Users</option>
                <option value="owners">Shop Owners Only</option>
                <option value="managers">Managers Only</option>
                <option value="cashiers">Cashiers Only</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Pin to top</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700" style={{ fontWeight: 500 }}>Publish immediately</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
