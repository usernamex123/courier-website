import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronDown, ChevronUp, Mail, Clock, Search, Trash2, Loader2, RefreshCw, MessageSquare, ExternalLink, CheckCircle2 } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      // 1. Delete from API endpoint
      await fetch(`${API_URL}/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      }).catch(() => null);

      // 2. Delete from Supabase table directly
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

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-yellow-500 font-black tracking-wider uppercase text-sm gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading client messages...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-6 text-white max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141210] border border-white/15 p-8 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-white">Client Quotes & Messages</h2>
          <p className="text-sm text-white/60 uppercase tracking-widest mt-2">Manage incoming client inquiries, quote requests, and follow-ups</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            className="p-3 bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-yellow-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <span className="inline-flex items-center px-3 py-2 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-wider border border-green-500/30">
            <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
            Realtime Active
          </span>
          <span className="px-3 py-2 bg-white/5 text-yellow-500 text-xs font-black uppercase tracking-wider border border-white/10">
            Total: {quotes.length}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/30 text-red-400 p-4 font-bold uppercase tracking-wider text-xs flex items-center justify-between">
          <span>Error: {error}</span>
          <button onClick={() => fetchMessages()} className="underline hover:text-white cursor-pointer">Try Again</button>
        </div>
      )}

      {/* Search Bar Toolbar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search messages by name, email, or message content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#141210] border border-white/15 pl-11 pr-4 py-3.5 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-white/30"
        />
      </div>

      {/* Message List */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-16 bg-[#141210] border border-white/15 text-white/40 text-xs font-black uppercase tracking-widest">
          {searchTerm ? 'No messages match your search criteria.' : 'No client messages received yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map((quote) => {
            const id = quote.id || Math.random();
            const isExpanded = expandedId === id;
            const isDeleting = deletingId === id;
            const clientName = quote.client_name || quote.name || 'Unnamed Client';
            const clientEmail = quote.email || 'No email provided';
            const messageContent = quote.message || quote.service || quote.content || 'No message content provided.';
            const timestamp = quote.created_at ? new Date(quote.created_at).toLocaleString() : 'Recently';

            const gmailLink = clientEmail !== 'No email provided' 
              ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(`Inquiry Follow-up: JB Logistics`)}`
              : '#';

            return (
              <div 
                key={id}
                className="bg-[#141210] border border-white/15 transition-all duration-200 overflow-hidden shadow-xl"
              >
                {/* Compact Bar Header (Always Visible) */}
                <div 
                  onClick={() => toggleExpand(id)}
                  className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-black text-sm flex items-center justify-center shrink-0 uppercase rounded-lg">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-sm uppercase tracking-wider text-white truncate">{clientName}</span>
                        {quote.service && (
                          <span className="hidden sm:inline-block text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 border border-yellow-500/20 font-bold uppercase tracking-wider">
                            {quote.service}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/70 font-medium tracking-wide block truncate max-w-2xl mt-1">
                        {messageContent}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-white/50 hidden md:inline-block font-mono tracking-wider">{timestamp}</span>
                    
                    <button 
                      onClick={(e) => handleDeleteMessage(e, id)}
                      disabled={isDeleting}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer rounded"
                      title="Delete Message"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Trash2 className="w-4 h-4" />}
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </div>

                {/* Expanded Section */}
                {isExpanded && (
                  <div className="px-6 py-5 bg-black/50 border-t border-white/10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/80">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-yellow-500" />
                        {clientEmail !== 'No email provided' ? (
                          <a 
                            href={gmailLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(e) => e.stopPropagation()} 
                            className="text-yellow-400 hover:text-yellow-300 font-mono text-xs font-bold flex items-center gap-2 hover:underline"
                          >
                            <span>{clientEmail}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/10 px-2 py-0.5 border border-yellow-500/30 uppercase tracking-wider">
                              Open Gmail <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ) : (
                          <span className="font-mono text-white/50">{clientEmail}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs text-white/50">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span>Received: {timestamp}</span>
                      </div>
                    </div>

                    <div className="bg-black/70 p-5 border border-white/10 rounded-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Message Body</span>
                      <p className="text-sm text-white/95 font-medium tracking-wide whitespace-pre-wrap leading-relaxed">
                        {messageContent}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}