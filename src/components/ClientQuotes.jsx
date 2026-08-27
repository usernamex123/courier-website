import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Mail, Clock, Search, Trash2, Loader2, RefreshCw, 
  ExternalLink, Eye, CornerUpLeft, MapPin, Package, User, X, Send, Hash
} from 'lucide-react';
import { toast } from 'sonner';

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
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
  return `${protocol}//${hostname}:5000`;
};

const API_URL = getApiUrl();

const STATUS_STYLES = {
  not_replied: "bg-amber-100 text-amber-800 border-amber-300",
  replied: "bg-emerald-100 text-emerald-800 border-emerald-300"
};

export default function ClientQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  const [replyingQuote, setReplyingQuote] = useState(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/messages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unauthorized or failed to fetch client messages.');
      }

      const data = await response.json();

      const formattedData = (data || []).map(msg => ({
        ...msg,
        status: msg.status === 'replied' ? 'replied' : 'not_replied'
      }));

      setQuotes(formattedData);
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
            fetchMessages(); 
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
      const res = await fetch(`${API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to delete message');

      setQuotes(prev => prev.filter(q => q.id !== id));
      toast.success('Message deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete message');
    } finally {
      setDeletingId(null);
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

    try {
      const res = await fetch(`${API_URL}/api/admin/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: quoteId,
          subject: replySubject,
          message: replyBody,
          recipient: replyingQuote.email
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Failed to send email reply');
      }

      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'replied' } : q));

      toast.success('Email reply sent successfully! Status updated to Replied.');
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
    const customerId = q.customer_id ? String(q.customer_id) : '';
    const query = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      message.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      customerId.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-600 font-semibold text-base gap-3 bg-gray-50 min-h-screen font-sans">
        <Loader2 className="w-7 h-7 animate-spin text-yellow-600" />
        Loading client messages...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn font-sans text-gray-900 px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/70 min-h-screen">
      
      {/* Search & Control Bar */}
      <div className="bg-white border border-gray-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:max-w-md">
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-300 px-4 py-3 w-full shadow-sm focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500 transition-all">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, email, customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm outline-none bg-transparent w-full text-gray-900 placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <button 
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-bold text-sm px-5 py-3 rounded-xl transition-all flex items-center gap-2.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-yellow-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <span className="px-4 py-3 bg-gray-100 text-gray-800 text-sm font-bold border border-gray-200 rounded-xl shadow-sm">
            Total Messages: {quotes.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-5 font-bold text-sm flex items-center justify-between rounded-xl shadow-sm">
          <span>Error: {error}</span>
          <button onClick={() => fetchMessages()} className="underline hover:text-red-950 cursor-pointer">Try Again</button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
        {quotes.length === 0 ? (
          <div className="text-center py-24 text-gray-500 font-semibold text-sm">
            No client messages received yet.
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-24 text-gray-500 font-semibold text-sm">
            No messages match your search criteria.
          </div>
        ) : (
          <>
            {/* MOBILE VIEW */}
            <div className="lg:hidden space-y-4 p-5">
              {filteredQuotes.map((quote, index) => {
                const id = quote.id;
                const clientName = quote.client_name || quote.name || 'Unnamed Client';
                const clientEmail = quote.email || 'No email provided';
                const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                const subjectText = quote.subject || (quote.service ? `${quote.service} Quote` : 'General Inquiry');
                const serviceText = quote.service || quote.mode || quote.source || 'Standard Message';
                const customerId = quote.customer_id;
                const status = quote.status || 'not_replied';
                
                const dateObj = quote.created_at ? new Date(quote.created_at) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

                return (
                  <div key={id || index} className="bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-yellow-100 text-yellow-900 font-extrabold text-xs flex items-center justify-center shrink-0 uppercase rounded-full shadow-inner">
                          {initials || 'CL'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm text-gray-900 flex flex-wrap items-center gap-2">
                            <span className="truncate">{clientName}</span>
                            {customerId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-mono font-bold rounded-md shrink-0" title={`Customer ID: ${customerId}`}>
                                <Hash className="w-3 h-3" /> #{customerId}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 font-medium truncate mt-0.5">{clientEmail}</div>
                        </div>
                      </div>
                      <span className={`self-start sm:self-auto px-3 py-1 text-xs font-extrabold uppercase border rounded-xl shadow-2xs ${STATUS_STYLES[status] || STATUS_STYLES.not_replied}`}>
                        {status === 'replied' ? 'Replied' : 'Not Replied'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm pt-2 border-t border-gray-200/80">
                      <div className="font-bold text-gray-900 truncate">{subjectText}</div>
                      <div className="text-gray-600 text-xs font-medium truncate">{serviceText}</div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200/80 text-xs">
                      <div className="font-mono text-gray-600 font-semibold">
                        <span className="font-bold text-gray-900">{dateStr}</span> ({timeStr})
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl transition-colors cursor-pointer shadow-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteMessage(e, id)}
                          disabled={deletingId === id}
                          className="p-2 bg-white hover:bg-red-50 border border-gray-300 text-gray-700 hover:text-red-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                          title="Delete"
                        >
                          {deletingId === id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100/70 text-xs font-extrabold uppercase tracking-wider text-gray-600">
                    <th className="px-4 py-4 w-[50px] text-center">#</th>
                    <th className="px-4 py-4 w-[25%]">Client</th>
                    <th className="px-4 py-4 w-[20%]">Subject / Source</th>
                    <th className="px-4 py-4 w-[18%]">Details</th>
                    <th className="px-4 py-4 w-[13%]">Status</th>
                    <th className="px-4 py-4 w-[14%]">Date (Cleveland)</th>
                    <th className="px-4 py-4 w-[10%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm font-medium text-gray-900">
                  {filteredQuotes.map((quote, index) => {
                    const id = quote.id;
                    const clientName = quote.client_name || quote.name || 'Unnamed Client';
                    const clientEmail = quote.email || 'No email provided';
                    const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    const subjectText = quote.subject || (quote.service ? `${quote.service} Quote` : 'General Inquiry');
                    const sourceText = quote.source || quote.service || 'Direct Submission';
                    const routeOrState = (quote.from_state && quote.to_state) 
                      ? `${quote.from_state} → ${quote.to_state}` 
                      : (quote.from_state || quote.to_state || quote.state || quote.origin || 'N/A');
                    const phoneNum = quote.phone || 'No phone';
                    const customerId = quote.customer_id;
                    const status = quote.status || 'not_replied';
                    
                    const dateObj = quote.created_at ? new Date(quote.created_at) : new Date();
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });

                    return (
                      <tr key={id || index} className="hover:bg-gray-50/85 transition-colors">
                        <td className="px-4 py-4 text-gray-500 font-mono text-center font-bold text-sm align-middle">
                          {index + 1}
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 text-yellow-900 font-extrabold text-xs flex items-center justify-center shrink-0 uppercase rounded-full shadow-inner">
                              {initials || 'CL'}
                            </div>
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="font-bold text-gray-900 text-sm flex flex-wrap items-center gap-1.5 mb-0.5">
                                <span className="truncate max-w-[160px]" title={clientName}>{clientName}</span>
                                {customerId && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-mono font-bold rounded-md shrink-0 shadow-2xs" title={`Customer ID: ${customerId}`}>
                                    <Hash className="w-3 h-3" /> #{customerId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 font-medium truncate" title={clientEmail}>{clientEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <div className="font-bold text-gray-900 text-sm truncate" title={subjectText}>{subjectText}</div>
                          <div className="text-xs text-gray-600 font-medium truncate mt-0.5" title={sourceText}>{sourceText}</div>
                        </td>

                        <td className="px-4 py-4 text-gray-700 space-y-1 align-middle">
                          <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
                            <MapPin className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                            <span className="truncate" title={`Route: ${routeOrState}`}>Route: {routeOrState}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium truncate">
                            <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate" title={`Phone: ${phoneNum}`}>Phone: {phoneNum}</span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-middle">
                          <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-extrabold uppercase border rounded-xl shadow-2xs whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.not_replied}`}>
                            {status === 'replied' ? 'Replied' : 'Not Replied'}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-mono text-gray-700 whitespace-nowrap align-middle">
                          <div className="text-xs font-bold text-gray-900">{dateStr}</div>
                          <div className="text-xs text-gray-500 font-medium">{timeStr}</div>
                        </td>

                        <td className="px-4 py-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="p-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 transition-colors rounded-xl cursor-pointer shadow-sm"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => handleDeleteMessage(e, id)}
                              disabled={deletingId === id}
                              className="p-2 bg-white hover:bg-red-50 border border-gray-300 text-gray-700 hover:text-red-600 transition-colors rounded-xl cursor-pointer disabled:opacity-50 shadow-sm"
                              title="Delete Message"
                            >
                              {deletingId === id ? (
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
          </>
        )}

        <div className="p-5 border-t border-gray-200 flex items-center justify-between bg-gray-50 text-sm text-gray-600 font-bold w-full">
          <span>Showing {filteredQuotes.length} of {quotes.length} total messages</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-10 h-10 bg-yellow-100 text-yellow-900 font-extrabold text-sm flex items-center justify-center uppercase rounded-full shrink-0 shadow-inner">
                  {(selectedQuote.client_name || selectedQuote.name || 'C')[0]}
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-gray-900 text-base truncate">
                    {selectedQuote.client_name || selectedQuote.name || 'Client Inquiry'}
                  </h3>
                  <span className="text-xs text-gray-600 font-mono font-semibold truncate">{selectedQuote.email || 'No email'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer rounded-xl hover:bg-gray-200/60 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
              {selectedQuote.customer_id ? (
                <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center justify-between gap-3 text-amber-950 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <Hash className="w-5 h-5 text-amber-700 shrink-0" />
                    <span className="font-bold text-sm">Registered Client Account</span>
                  </div>
                  <span className="font-mono text-xs bg-white px-3 py-1.5 rounded-lg border border-amber-300 text-amber-900 font-extrabold shadow-2xs">
                    Customer ID: #{selectedQuote.customer_id}
                  </span>
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-300 p-4 rounded-xl flex items-center gap-2.5 text-gray-700 font-semibold text-sm">
                  <User className="w-5 h-5 text-gray-500 shrink-0" />
                  <span>Submitted as a Guest (No Customer ID Match)</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                <div>
                  <span className="text-xs uppercase font-extrabold text-gray-500 block mb-1">Phone Number</span>
                  <span className="text-sm font-bold text-gray-900 block truncate">
                    {selectedQuote.phone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold text-gray-500 block mb-1">From / To State</span>
                  <span className="text-sm font-bold text-yellow-800 block truncate">
                    {selectedQuote.from_state && selectedQuote.to_state 
                      ? `${selectedQuote.from_state} → ${selectedQuote.to_state}` 
                      : (selectedQuote.from_state || selectedQuote.to_state || selectedQuote.state || 'N/A')}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-5 border border-gray-200 rounded-xl space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">Full Message Body</span>
                <p className="text-sm text-gray-900 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedQuote.message ? (() => {
                    const msg = selectedQuote.message;
                    const idx = msg.indexOf('Message:');
                    if (idx !== -1) {
                      return msg.substring(idx + 8).trim();
                    }
                    return msg;
                  })() : 'No message content provided.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-200 text-xs font-bold text-gray-600">
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
                    className="inline-flex items-center gap-2 px-5 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold text-sm transition-colors rounded-xl shadow-md cursor-pointer shrink-0"
                  >
                    <span>Reply Now</span>
                    <CornerUpLeft className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyingQuote && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 text-yellow-900 rounded-xl shadow-inner">
                  <CornerUpLeft className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
                  Reply to {replyingQuote.client_name || replyingQuote.name || 'Client'}
                </h3>
              </div>
              <button
                onClick={() => setReplyingQuote(null)}
                className="p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer rounded-xl hover:bg-gray-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs uppercase font-extrabold text-gray-600 mb-1.5">To</label>
                <input
                  type="text"
                  disabled
                  value={replyingQuote.email || 'No email provided'}
                  className="w-full bg-gray-100 border border-gray-300 px-4 py-3 text-sm text-gray-700 rounded-xl font-mono font-semibold shadow-2xs"
                />
              </div>

              <div>
                <label className="px-0 block text-xs uppercase font-extrabold text-gray-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 px-4 py-3 text-sm text-gray-900 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-bold shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-extrabold text-gray-600 mb-1.5">Message</label>
                <textarea
                  rows={6}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  required
                  placeholder="Type your reply here..."
                  className="w-full bg-white border border-gray-300 p-4 text-sm text-gray-900 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-medium shadow-sm leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setReplyingQuote(null)}
                  className="px-5 py-3 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-extrabold rounded-xl shadow-md cursor-pointer transition-colors disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
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