import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Mail, Clock, Search, Trash2, Loader2, RefreshCw, 
  ExternalLink, Eye, CornerUpLeft, MapPin, Package, User, X, Send
} from 'lucide-react';
import { toast } from 'sonner';

// Initialize Supabase Client with fail-safe fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `http://${hostname}:5000`;
};

const API_URL = getApiUrl();

export default function ClientQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null); // For detail modal
  
  // Reply Modal States
  const [replyingQuote, setReplyingQuote] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${API_URL}/api/admin/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch messages (${res.status}): ${errorText || 'Unauthorized'}`);
      }

      const resData = await res.json();
      const messageList = Array.isArray(resData) ? resData : (resData.data || resData.messages || []);
      setQuotes(messageList);
    } catch (err) {
      console.error('Failed to load quotes:', err);
      // Fallback: try fetching from Supabase directly if configured
      if (supabaseUrl && supabaseAnonKey) {
        const { data, error: sbErr } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!sbErr && data) {
          setQuotes(data);
          setError(null);
        } else {
          setError(err.message || 'Error communicating with server');
        }
      } else {
        setError(err.message || 'Failed to load client messages');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Listen to realtime inserts from Supabase if configured
    let channel;
    if (supabaseUrl && supabaseAnonKey) {
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            setQuotes((prevQuotes) => [payload.new, ...prevQuotes]);
            toast.info('New message received');
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteMessage = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    setDeletingId(id);
    const token = localStorage.getItem('admin_token');

    try {
      await fetch(`${API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      }).catch(() => null);

      if (supabaseUrl && supabaseAnonKey) {
        await supabase.from('messages').delete().eq('id', id);
      }

      setQuotes(prev => prev.filter(q => q.id !== id));
      toast.success('Message deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
      if (supabaseUrl && supabaseAnonKey) {
        await supabase.from('messages').update({ status: newStatus }).eq('id', id);
      }
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update status');
    }
  };

  // Open Reply Modal
  const openReplyModal = (quote) => {
    setReplyingQuote(quote);
    setReplySubject(`Inquiry Follow-up: JB Logistics - ${quote.subject || quote.service || 'General Inquiry'}`);
    setReplyBody(`Dear ${quote.client_name || quote.name || 'Client'},\n\nThank you for reaching out to JB Logistics. Regarding your inquiry, `);
  };

  // Send Reply Handler
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyingQuote) return;

    setSendingReply(true);
    const token = localStorage.getItem('admin_token');
    const quoteId = replyingQuote.id;

    try {
      // Try sending via backend API if available
      const res = await fetch(`${API_URL}/api/admin/messages/${quoteId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          subject: replySubject,
          message: replyBody,
          recipient: replyingQuote.email
        }),
        credentials: 'include'
      }).catch(() => null);

      // Update status to 'replied' in state and Supabase
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'replied' } : q));
      if (supabaseUrl && supabaseAnonKey) {
        await supabase.from('messages').update({ status: 'replied' }).eq('id', quoteId);
      }

      toast.success('Reply sent successfully!');
      setReplyingQuote(null);
      setReplyBody('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Filter messages based on search query
  const filteredQuotes = quotes.filter((q) => {
    const name = q.client_name || q.name || '';
    const message = q.message || q.service || q.content || '';
    const email = q.email || '';
    const query = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      message.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 font-medium text-sm gap-3 bg-white min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        Loading client messages...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-4 text-gray-900 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 bg-white min-h-screen">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-200 pl-10 pr-4 py-2 text-gray-900 text-xs focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 rounded-md"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 rounded-md shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gray-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <span className="px-2.5 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium border border-gray-200 rounded-md">
            Total: {quotes.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 font-medium text-xs flex items-center justify-between rounded-md">
          <span>Error: {error}</span>
          <button onClick={() => fetchMessages()} className="underline hover:text-red-900 cursor-pointer">Try Again</button>
        </div>
      )}

      {/* Clean table design matching screenshot */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-xs font-medium tracking-wide">
            {searchTerm ? 'No messages match your search criteria.' : 'No client messages received yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Subject / Service</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredQuotes.map((quote, index) => {
                  const id = quote.id || index + 1;
                  const clientName = quote.client_name || quote.name || 'Unnamed Client';
                  const clientEmail = quote.email || 'No email provided';
                  const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const subjectText = quote.subject || (quote.service ? `${quote.service} Quote` : 'General Inquiry');
                  const serviceText = quote.service || quote.mode || 'Standard Delivery';
                  
                  const origin = quote.origin || 'Kathmandu';
                  const destination = quote.destination || 'N/A';
                  const weightOrDetails = quote.weight || quote.message || quote.content || 'Standard Package';

                  const status = (quote.status || 'new').toLowerCase();
                  
                  const dateObj = quote.created_at ? new Date(quote.created_at) : new Date();
                  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr key={id} className="hover:bg-gray-50/65 transition-colors group">
                      {/* Index */}
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-center font-medium">
                        {index + 1}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-50/80 text-blue-600 font-semibold text-xs flex items-center justify-center shrink-0 uppercase rounded-full">
                            {initials || 'CL'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{clientName}</div>
                            <div className="text-[11px] text-gray-500 font-normal mt-0.5">{clientEmail}</div>
                          </div>
                        </div>
                      </td>

                      {/* Subject / Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{subjectText}</div>
                        <div className="text-[11px] text-gray-500 font-normal mt-0.5">{serviceText}</div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-gray-600 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <User className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>From: {origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>To: {destination}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                          <Package className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[220px]">{weightOrDetails}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 border rounded cursor-pointer focus:outline-none transition-colors ${
                            status === 'new' 
                              ? 'bg-blue-50 text-blue-600 border-blue-200' 
                              : status === 'replied' 
                              ? 'bg-purple-50 text-purple-600 border-purple-200' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}
                        >
                          <option value="new" className="bg-white text-blue-600">New</option>
                          <option value="read" className="bg-white text-emerald-600">Read</option>
                          <option value="replied" className="bg-white text-purple-600">Replied</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-gray-500 whitespace-nowrap">
                        <div className="text-[11px] font-medium text-gray-700">{dateStr}</div>
                        <div className="text-[10px] text-gray-400">{timeStr}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors rounded cursor-pointer shadow-2xs"
                            title="View Message Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Reply in Popup Modal */}
                          <button
                            onClick={() => openReplyModal(quote)}
                            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-blue-600 transition-colors rounded cursor-pointer shadow-2xs"
                            title="Reply to Client"
                          >
                            <CornerUpLeft className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteMessage(e, quote.id)}
                            disabled={deletingId === quote.id}
                            className="p-1.5 bg-white hover:bg-red-50 border border-gray-200 text-gray-600 hover:text-red-600 transition-colors rounded cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Delete Message"
                          >
                            {deletingId === quote.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 font-semibold text-xs flex items-center justify-center uppercase rounded-full">
                  {(selectedQuote.client_name || selectedQuote.name || 'C')[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedQuote.client_name || selectedQuote.name || 'Client Inquiry'}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono">{selectedQuote.email || 'No email'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-100 rounded-lg">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">Subject / Service</span>
                  <span className="text-xs font-semibold text-gray-900 mt-1 block">
                    {selectedQuote.subject || selectedQuote.service || 'General Inquiry'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block">Route / Details</span>
                  <span className="text-xs font-semibold text-blue-600 mt-1 block">
                    {selectedQuote.origin || 'Kathmandu'} → {selectedQuote.destination || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-5 border border-gray-100 rounded-lg">
                <span className="text-[10px] font-semibold tracking-wider text-gray-400 block mb-2 uppercase">Full Message Body</span>
                <p className="text-sm text-gray-800 font-normal leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.message || selectedQuote.content || 'No message content provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                <span>Received: {selectedQuote.created_at ? new Date(selectedQuote.created_at).toLocaleString() : 'Recently'}</span>
                {selectedQuote.email && (
                  <button
                    onClick={() => {
                      const q = selectedQuote;
                      setSelectedQuote(null);
                      openReplyModal(q);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors rounded-md shadow-2xs cursor-pointer"
                  >
                    <span>Reply Now</span>
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Popup Modal */}
      {replyingQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-xl rounded-xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <CornerUpLeft className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Reply to {replyingQuote.client_name || replyingQuote.name || 'Client'}
                </h3>
              </div>
              <button
                onClick={() => setReplyingQuote(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">To</label>
                <input
                  type="text"
                  disabled
                  value={replyingQuote.email || 'No email provided'}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-200 px-3 py-2 text-xs text-gray-900 rounded-md focus:outline-none focus:border-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Message</label>
                <textarea
                  rows={6}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  required
                  placeholder="Type your reply here..."
                  className="w-full bg-white border border-gray-200 p-3 text-xs text-gray-900 rounded-md focus:outline-none focus:border-gray-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReplyingQuote(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-md cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}