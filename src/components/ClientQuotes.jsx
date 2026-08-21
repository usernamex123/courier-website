import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Mail, Clock, Search, Trash2, Loader2, RefreshCw, 
  ExternalLink, Eye, CornerUpLeft, MapPin, Package, User, X, Send
} from 'lucide-react';
import { toast } from 'sonner';

// Initialize Supabase Client with fail-safe fallbacks[cite: 4]
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Supabase Edge Function URL for sending emails[cite: 4]
const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/notify-admin`;

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  read: "bg-green-50 text-green-700 border-green-200",
  replied: "bg-purple-50 text-purple-700 border-purple-200"
};

export default function ClientQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  // Reply Modal States[cite: 4]
  const [replyingQuote, setReplyingQuote] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      if (supabaseUrl && supabaseAnonKey) {
        const { data, error: sbErr } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbErr) throw sbErr;
        setQuotes(data || []);
      } else {
        throw new Error('Supabase configuration missing');
      }
    } catch (err) {
      console.error('Failed to load quotes:', err);
      setError(err.message || 'Failed to load client messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();

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
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    setDeletingId(id);

    try {
      if (supabaseUrl && supabaseAnonKey) {
        const { error: sbErr } = await supabase.from('messages').delete().eq('id', id);
        if (sbErr) throw sbErr;
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
    if (!id) return;
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

  const openReplyModal = (quote) => {
    setReplyingQuote(quote);
    setReplySubject(`Inquiry Follow-up: JB Logistics - ${quote.subject || quote.service || 'General Inquiry'}`);
    setReplyBody(`Dear ${quote.client_name || quote.name || 'Client'},\n\nThank you for reaching out to JB Logistics. Regarding your inquiry, `);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyingQuote || !replyingQuote.id) return;

    setSendingReply(true);
    const quoteId = replyingQuote.id;
    const token = supabaseAnonKey;

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'admin_reply',
          messageId: quoteId,
          subject: replySubject,
          message: replyBody,
          recipient: replyingQuote.email
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to send email via Edge Function');
      }

      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'replied' } : q));

      toast.success('Email reply sent successfully!');
      setReplyingQuote(null);
      setReplyBody('');
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error(err.message || 'Failed to send email reply');
    } finally {
      setSendingReply(false);
    }
  };

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
      <div className="flex justify-center items-center h-64 text-gray-500 font-bold text-sm gap-3 bg-gray-50 min-h-screen font-sans">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
        Loading client messages...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn font-sans text-gray-900 px-2 sm:px-4 lg:px-8 py-6 bg-gray-50 min-h-screen overflow-hidden">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-gray-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3.5 py-2.5 w-full shadow-sm">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <button 
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gray-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <span className="px-3.5 py-2.5 bg-gray-50 text-gray-700 text-xs font-bold border border-gray-200 rounded-xl shadow-sm">
            Total: {quotes.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 font-bold text-xs flex items-center justify-between rounded-xl">
          <span>Error: {error}</span>
          <button onClick={() => fetchMessages()} className="underline hover:text-red-900 cursor-pointer">Try Again</button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
        {quotes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium text-xs">
            No client messages received yet.
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-medium text-xs">
            No messages match your search criteria.
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD VIEW */}
            <div className="lg:hidden space-y-3 p-4">
              {filteredQuotes.map((quote, index) => {
                const id = quote.id;
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
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

                return (
                  <div key={id || index} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 bg-yellow-100 text-yellow-800 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase rounded-full">
                          {initials || 'CL'}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs text-gray-900 truncate" title={clientName}>{clientName}</div>
                          <div className="text-[10px] text-gray-500 font-medium truncate" title={clientEmail}>{clientEmail}</div>
                        </div>
                      </div>
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(id, e.target.value)}
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 border rounded-lg cursor-pointer focus:outline-none transition-colors shadow-2xs ${STATUS_STYLES[status] || STATUS_STYLES.new}`}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-xs pt-1 border-t border-gray-200/60">
                      <div className="font-bold text-gray-900 truncate" title={subjectText}>{subjectText}</div>
                      <div className="text-gray-500 text-[11px] truncate" title={serviceText}>{serviceText}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200/60">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">From: {origin}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">To: {destination}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[11px]">
                      <div className="font-mono text-gray-500">
                        <span className="font-bold text-gray-800">{dateStr}</span> ({timeStr})
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openReplyModal(quote)}
                          className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-yellow-600 rounded-lg transition-colors cursor-pointer"
                          title="Reply"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteMessage(e, id)}
                          disabled={deletingId === id}
                          className="p-1.5 bg-white hover:bg-red-50 border border-gray-200 text-gray-700 hover:text-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-3 py-3.5 w-[45px] text-center">#</th>
                    <th className="px-3 py-3.5 w-[18%]">Client</th>
                    <th className="px-3 py-3.5 w-[18%]">Subject / Service</th>
                    <th className="px-3 py-3.5 w-[22%]">Details</th>
                    <th className="px-3 py-3.5 w-[11%]">Status</th>
                    <th className="px-3 py-3.5 w-[14%]">Date (Cleveland)</th>
                    <th className="px-3 py-3.5 w-[12%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-800">
                  {filteredQuotes.map((quote, index) => {
                    const id = quote.id;
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
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

                    return (
                      <tr key={id || index} className="hover:bg-gray-50/65 transition-colors">
                        <td className="px-3 py-4 text-gray-400 font-mono text-center font-bold">
                          {index + 1}
                        </td>

                        <td className="px-3 py-4 truncate">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-yellow-100 text-yellow-800 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase rounded-full">
                              {initials || 'CL'}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-gray-900 truncate" title={clientName}>{clientName}</div>
                              <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5" title={clientEmail}>{clientEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 truncate">
                          <div className="font-bold text-gray-900 truncate" title={subjectText}>{subjectText}</div>
                          <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5" title={serviceText}>{serviceText}</div>
                        </td>

                        <td className="px-3 py-4 text-gray-600 space-y-0.5 truncate">
                          <div className="flex items-center gap-1 text-[11px] truncate">
                            <User className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">From: {origin}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] truncate">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">To: {destination}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 truncate">
                            <Package className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{weightOrDetails}</span>
                          </div>
                        </td>

                        <td className="px-3 py-4 truncate">
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(id, e.target.value)}
                            className={`text-[10px] font-bold uppercase px-2 py-1 border rounded-lg cursor-pointer focus:outline-none transition-colors shadow-2xs ${STATUS_STYLES[status] || STATUS_STYLES.new}`}
                          >
                            <option value="new" className="bg-white text-blue-700 font-bold">New</option>
                            <option value="read" className="bg-white text-green-700 font-bold">Read</option>
                            <option value="replied" className="bg-white text-purple-700 font-bold">Replied</option>
                          </select>
                        </td>

                        <td className="px-3 py-4 font-mono text-gray-500 whitespace-nowrap truncate">
                          <div className="text-[11px] font-bold text-gray-800">{dateStr}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{timeStr}</div>
                        </td>

                        <td className="px-3 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors rounded-lg cursor-pointer shadow-2xs"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => openReplyModal(quote)}
                              className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-yellow-600 transition-colors rounded-lg cursor-pointer shadow-2xs"
                              title="Reply to Client"
                            >
                              <CornerUpLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleDeleteMessage(e, id)}
                              disabled={deletingId === id}
                              className="p-1.5 bg-white hover:bg-red-50 border border-gray-200 text-gray-700 hover:text-red-600 transition-colors rounded-lg cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Delete Message"
                            >
                              {deletingId === id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
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
          </>
        )}

        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50 text-xs text-gray-500 font-medium w-full">
          <span>Showing {filteredQuotes.length} of {quotes.length} total messages</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 bg-yellow-100 text-yellow-800 font-bold text-xs flex items-center justify-center uppercase rounded-full shrink-0">
                  {(selectedQuote.client_name || selectedQuote.name || 'C')[0]}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-gray-900 text-xs truncate">
                    {selectedQuote.client_name || selectedQuote.name || 'Client Inquiry'}
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono font-medium truncate">{selectedQuote.email || 'No email'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer rounded-lg hover:bg-gray-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3.5 border border-gray-200 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Subject / Service</span>
                  <span className="text-xs font-bold text-gray-900 block truncate">
                    {selectedQuote.subject || selectedQuote.service || 'General Inquiry'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Route / Details</span>
                  <span className="text-xs font-bold text-yellow-700 block truncate">
                    {selectedQuote.origin || 'Kathmandu'} → {selectedQuote.destination || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Full Message Body</span>
                <p className="text-xs text-gray-800 font-normal leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.message || selectedQuote.content || 'No message content provided.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[11px] font-bold text-gray-500">
                <span className="truncate">
                  Received: {selectedQuote.created_at ? new Date(selectedQuote.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'} (Cleveland, OH)
                </span>
                {selectedQuote.email && (
                  <button
                    onClick={() => {
                      const q = selectedQuote;
                      setSelectedQuote(null);
                      openReplyModal(q);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs transition-colors rounded-xl shadow-2xs cursor-pointer shrink-0"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 text-yellow-800 rounded-lg">
                  <CornerUpLeft className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs">
                  Reply to {replyingQuote.client_name || replyingQuote.name || 'Client'}
                </h3>
              </div>
              <button
                onClick={() => setReplyingQuote(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">To</label>
                <input
                  type="text"
                  disabled
                  value={replyingQuote.email || 'No email provided'}
                  className="w-full bg-gray-50 border border-gray-200 px-3.5 py-2 text-xs text-gray-600 rounded-xl font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 px-3.5 py-2 text-xs text-gray-900 rounded-xl focus:outline-none focus:border-gray-400 font-bold shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Message</label>
                <textarea
                  rows={5}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  required
                  placeholder="Type your reply here..."
                  className="w-full bg-white border border-gray-300 p-3 text-xs text-gray-900 rounded-xl focus:outline-none focus:border-gray-400 font-medium shadow-2xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setReplyingQuote(null)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-xl shadow-2xs cursor-pointer transition-colors disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
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