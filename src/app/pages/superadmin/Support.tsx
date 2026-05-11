import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import {
  LifeBuoy, Search, MessageSquare, CheckCircle, Clock, AlertTriangle,
  User, ChevronRight, Tag, X, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { supportTicketStorage } from '../../lib/storage';
import { SupportTicket, SupportTicketMessage } from '../../lib/types';

const priorityConfig = {
  low:      { label: 'Low',      cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  medium:   { label: 'Medium',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high:     { label: 'High',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const statusConfig = {
  open:        { label: 'Open',        cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  resolved:    { label: 'Resolved',    cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  closed:      { label: 'Closed',      cls: 'bg-gray-50 text-gray-600 border-gray-200',   dot: 'bg-gray-400' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => supportTicketStorage.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');

  const refresh = () => setTickets(supportTicketStorage.getAll());

  const filtered = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.shopName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.priority === 'high' && t.status === 'open').length, // 'critical' not in types priority yet
  };

  const updateStatus = (ticket: SupportTicket, status: SupportTicket['status']) => {
    const updated = { ...ticket, status };
    supportTicketStorage.update(updated);
    refresh();
    if (viewTicket?.id === ticket.id) setViewTicket(updated);
    toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
  };

  const sendReply = () => {
    if (!reply.trim() || !viewTicket) return;
    const newReply: SupportTicketMessage = { 
      id: `msg_${Date.now()}`,
      senderId: 'super_admin',
      senderName: 'Rizqara Support', 
      message: reply.trim(), 
      createdAt: new Date().toISOString() 
    };
    
    const updated: SupportTicket = { 
      ...viewTicket, 
      messages: [...(viewTicket.messages || []), newReply], 
      status: 'in_progress' 
    };
    
    supportTicketStorage.update(updated);
    refresh();
    setViewTicket(updated);
    setReply('');
    toast.success('Reply sent');
  };

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        subtitle="Manage customer support requests from all shops"
        badge={`${stats.open} open`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Tickets', value: stats.open, color: 'blue', icon: MessageSquare },
          { label: 'In Progress', value: stats.in_progress, color: 'purple', icon: Clock },
          { label: 'Resolved', value: stats.resolved, color: 'green', icon: CheckCircle },
          { label: 'Critical', value: stats.critical, color: 'red', icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`bg-white rounded-2xl border p-4 shadow-sm border-${color === 'red' ? 'red' : color === 'green' ? 'green' : color === 'purple' ? 'purple' : 'blue'}-100`}>
            <div className={`w-9 h-9 rounded-xl bg-${color === 'red' ? 'red' : color === 'green' ? 'green' : color === 'purple' ? 'purple' : 'blue'}-600 flex items-center justify-center mb-3`}>
              <Icon size={16} className="text-white" />
            </div>
            <div className={`text-2xl text-${color === 'red' ? 'red' : color === 'green' ? 'green' : color === 'purple' ? 'purple' : 'blue'}-600 mb-0.5`} style={{ fontWeight: 800 }}>{value}</div>
            <div className="text-gray-500 text-xs" style={{ fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
              style={{ fontWeight: 600 }}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {filtered.map(ticket => {
          const sc = statusConfig[ticket.status];
          const pc = priorityConfig[ticket.priority];
          return (
            <div
              key={ticket.id}
              onClick={() => setViewTicket(ticket)}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <LifeBuoy size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-gray-900 text-sm group-hover:text-blue-700 transition-colors" style={{ fontWeight: 600 }}>{ticket.subject}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sc.cls}`} style={{ fontWeight: 600 }}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1`} />
                      {sc.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pc.cls}`} style={{ fontWeight: 600 }}>{pc.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={11} />{ticket.customerName || 'Anonymous'}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1"><Tag size={11} />{ticket.shopName}</span>
                    <span className="text-gray-300">·</span>
                    <span>{timeAgo(ticket.createdAt)}</span>
                    {(ticket.messages || []).length > 0 && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="flex items-center gap-1 text-blue-600"><MessageSquare size={11} />{(ticket.messages || []).length} replies</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <LifeBuoy size={24} className="text-blue-400" />
            </div>
            <p className="text-gray-500 text-sm" style={{ fontWeight: 500 }}>No tickets found</p>
            <p className="text-gray-400 text-xs mt-1">All support requests will appear here</p>
          </div>
        )}
      </div>

      {/* View/Reply Modal */}
      {viewTicket && (
        <Modal open={!!viewTicket} onClose={() => setViewTicket(null)} title={`Ticket: ${viewTicket.id}`} size="lg">
          <div className="space-y-5">
            {/* Header info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="text-gray-900 mb-2" style={{ fontWeight: 600 }}>{viewTicket.subject}</div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                <span><strong>Shop:</strong> {viewTicket.shopName || 'Unknown'}</span>
                <span><strong>Customer:</strong> {viewTicket.customerName || 'Anonymous'}</span>
                <span><strong>Email:</strong> {viewTicket.email || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className={`text-[11px] px-2 py-1 rounded-full border ${statusConfig[viewTicket.status].cls}`} style={{ fontWeight: 600 }}>
                  {statusConfig[viewTicket.status].label}
                </span>
                <span className={`text-[11px] px-2 py-1 rounded-full border ${priorityConfig[viewTicket.priority].cls}`} style={{ fontWeight: 600 }}>
                  {priorityConfig[viewTicket.priority].label} Priority
                </span>
              </div>
            </div>

            {/* Original message */}
            <div>
              <div className="text-xs text-gray-400 mb-2" style={{ fontWeight: 600 }}>ORIGINAL MESSAGE · {timeAgo(viewTicket.createdAt)}</div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100">
                {viewTicket.message}
              </div>
            </div>

            {/* Replies */}
            {(viewTicket.messages || []).length > 0 && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400" style={{ fontWeight: 600 }}>REPLIES</div>
                {(viewTicket.messages || []).map((r, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs" style={{ fontWeight: 700 }}>{r.senderName.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-900" style={{ fontWeight: 600 }}>{r.senderName}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-700">{r.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Status actions */}
            <div className="flex gap-2 flex-wrap">
              {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(viewTicket, s)}
                  disabled={viewTicket.status === s}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${viewTicket.status === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-700'}`}
                  style={{ fontWeight: 600 }}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Reply box */}
            <div>
              <div className="text-xs text-gray-500 mb-2" style={{ fontWeight: 600 }}>SEND REPLY</div>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={sendReply}
                  disabled={!reply.trim()}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Send size={14} /> Send Reply
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
