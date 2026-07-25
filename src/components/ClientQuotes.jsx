import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronDown, ChevronUp, Mail, Clock, Search } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ClientQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // 1. Fetch initial messages securely from your backend API
    fetch('http://localhost:5000/api/admin/messages', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized or failed to fetch messages');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setQuotes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load quotes:', err);
        setError(err.message);
        setLoading(false);
      });

    // 2. Listen to live realtime inserts from Supabase
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setQuotes((prevQuotes) => [payload.new, ...prevQuotes]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter messages based on search input
  const filteredQuotes = quotes.filter((q) => {
    const name = q.client_name || q.name || '';
    const message = q.message || q.service || '';
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
      <div className="flex justify-center items-center h-64 text-yellow-500 font-black tracking-wider uppercase text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mr-3"></div>
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-950/50 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl font-bold uppercase tracking-wider text-xs">
          <p className="font-black text-sm">Error Loading Dashboard</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto">
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1c1917] border border-white/10 p-6 shadow-xl">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">Client Messages</h2>
          <p className="text-xs text-white/50 tracking-widest uppercase mt-1">Manage incoming inquiries in a compact view</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-400 text-xs font-black uppercase tracking-wider border border-green-500/20">
            <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
            Realtime Active
          </span>
          <span className="px-3 py-1 bg-white/5 text-yellow-500 text-xs font-black uppercase tracking-wider border border-white/10">
            Total: {quotes.length}
          </span>
        </div>
      </div>

      {/* Search Bar Toolbar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search messages by name, email, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1c1917] border border-white/10 pl-11 pr-4 py-3 text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-yellow-500 transition-colors placeholder:text-white/30"
        />
      </div>

      {/* Message Bars List */}
      {filteredQuotes.length === 0 ? (
        <div className="text-center py-12 bg-[#1c1917] border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest">
          No messages found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredQuotes.map((quote) => {
            const id = quote.id || Math.random();
            const isExpanded = expandedId === id;
            const clientName = quote.client_name || quote.name || 'Unnamed Client';
            const clientEmail = quote.email || 'No email provided';
            const messageContent = quote.message || quote.service || 'No message content provided.';
            const timestamp = quote.created_at ? new Date(quote.created_at).toLocaleString() : 'Just now';

            // Construct direct Gmail compose link with pre-filled recipient and subject line
            const gmailLink = clientEmail !== 'No email provided' 
              ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(`Inquiry Follow-up: JB Logistics`)}`
              : '#';

            return (
              <div 
                key={id}
                className="bg-[#1c1917] border border-white/10 transition-all duration-200 overflow-hidden"
              >
                {/* Compact Bar (Always Visible) */}
                <div 
                  onClick={() => toggleExpand(id)}
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-black text-xs flex items-center justify-center shrink-0 uppercase">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-xs uppercase tracking-wider text-white block truncate">{clientName}</span>
                      <span className="text-xs text-white/70 font-medium tracking-wide block truncate max-w-md mt-0.5">{messageContent}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-white/60 hidden sm:inline-block font-mono tracking-wider">{timestamp}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/50" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-black/40 border-t border-white/10 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-yellow-500" />
                        <a 
                          href={gmailLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="text-yellow-500 hover:underline font-mono text-xs font-bold flex items-center gap-1.5"
                        >
                          {clientEmail} <span className="text-[10px] bg-yellow-500/10 px-1.5 py-0.5 border border-yellow-500/30 uppercase tracking-wider">Open Gmail &rarr;</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs text-white/60">
                        <Clock className="w-4 h-4 text-white/60" />
                        <span>{timestamp}</span>
                      </div>
                    </div>
                    <div className="bg-black/60 p-4 border border-white/5">
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