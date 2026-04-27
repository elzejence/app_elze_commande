import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API, useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ROLE_COLORS = { client: '#5B21B6', employee: '#1E40AF', admin: '#991B1B' };
const ROLE_LABELS = { client: 'Client', employee: 'Employé', admin: 'Admin' };

function fmt(date) {
  const d = new Date(date), now = new Date(), diff = now - d;
  if (diff < 60000) return 'à l\'instant';
  if (diff < 3600000) return `${Math.floor(diff/60000)} min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr',{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString('fr',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}

export default function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const loadInbox = useCallback(() => {
    API.get('/messages/inbox').then(r => {
      setConversations(r.data.conversations);
      setUnreadTotal(r.data.totalUnread);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadInbox();
    API.get('/messages/contacts').then(r => setContacts(r.data.contacts)).catch(() => {});
    const iv = setInterval(loadInbox, 15000);

    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    socketRef.current.emit('join-user', user.id);
    if (user.role !== 'client') socketRef.current.emit('join-staff');

    socketRef.current.on('new-message', (msg) => {
      loadInbox();
      setSelected(prev => {
        if (prev) {
          const senderId = msg.sender?.id || msg.sender;
          if (senderId === prev.id || senderId?.toString() === prev.id?.toString()) {
            setMessages(m => [...m, msg]);
          }
        }
        return prev;
      });
      toast(`💬 Message de ${msg.sender?.name || '?'}`, { duration: 3000 });
    });

    return () => { clearInterval(iv); socketRef.current?.disconnect(); };
  }, [user.id, loadInbox]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openConv = async (contact) => {
    setSelected(contact);
    setLoadingMsgs(true);
    setShowContacts(false);
    try {
      const r = await API.get(`/messages/conversation/${contact.id}`);
      setMessages(r.data.messages);
      loadInbox();
    } catch { toast.error('Erreur chargement.'); }
    finally { setLoadingMsgs(false); }
  };

  const startNew = (contact) => {
    const existing = conversations.find(c => c.contact.id === contact.id);
    if (existing) openConv(contact);
    else { setSelected(contact); setMessages([]); setShowContacts(false); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    setSending(true);
    try {
      const r = await API.post('/messages', { recipientId: selected.id, content: text.trim() });
      setMessages(prev => [...prev, r.data.message]);
      setText('');
      loadInbox();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur envoi.');
    } finally { setSending(false); }
  };

  return (
    <div className="msg-layout">
      {/* SIDEBAR */}
      <div className="msg-sidebar">
        <div className="msg-sidebar-header">
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--dark)' }}>
              Messages {unreadTotal > 0 && <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '.7rem', fontWeight: 700 }}>{unreadTotal}</span>}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-m)', marginTop: 2 }}>
              {user.role === 'client' && 'Contactez un employé ou l\'admin'}
              {user.role === 'employee' && 'Clients & Administrateur'}
              {user.role === 'admin' && 'Clients & Employés'}
            </div>
          </div>
          <button onClick={() => setShowContacts(s => !s)} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '1rem' }} title="Nouvelle conversation">✏️</button>
        </div>

        {/* New conversation */}
        {showContacts && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--text-m)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Démarrer avec&nbsp;:</div>
            {contacts.length === 0 && <div style={{ fontSize: '.82rem', color: 'var(--text-m)', padding: '4px 0' }}>Aucun contact disponible.</div>}
            {contacts.map(c => (
              <button key={c.id} onClick={() => startNew(c)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 6px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                <div className="avatar" style={{ width: 30, height: 30, background: ROLE_COLORS[c.role], fontSize: '.82rem' }}>{c.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.84rem', color: 'var(--dark)' }}>{c.name}</div>
                  <div style={{ fontSize: '.7rem', color: ROLE_COLORS[c.role], fontWeight: 600 }}>{ROLE_LABELS[c.role]}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations list */}
        <div className="msg-conv-list">
          {conversations.length === 0 && !showContacts && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-m)', fontSize: '.84rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
              <div>Aucune conversation</div>
              <div style={{ marginTop: 4, fontSize: '.78rem' }}>Cliquez sur ✏️ pour commencer</div>
            </div>
          )}
          {conversations.map(conv => (
            <button key={conv.contact.id} className={`msg-conv-item ${selected?.id === conv.contact.id ? 'active' : ''}`} onClick={() => openConv(conv.contact)}>
              <div className="avatar" style={{ width: 38, height: 38, background: ROLE_COLORS[conv.contact.role], fontSize: '.95rem' }}>{conv.contact.name[0].toUpperCase()}</div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '.86rem', color: 'var(--dark)' }}>{conv.contact.name}</span>
                  <span style={{ fontSize: '.7rem', color: 'var(--text-m)', flexShrink: 0 }}>{fmt(conv.lastMessage.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: '.76rem', color: 'var(--text-l)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                    {conv.lastMessage.sender?.id === user.id || conv.lastMessage.sender === user.id ? '→ ' : ''}
                    {conv.lastMessage.content.slice(0, 40)}{conv.lastMessage.content.length > 40 ? '…' : ''}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 700, flexShrink: 0 }}>{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="msg-chat">
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-m)' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <h3 style={{ fontFamily: 'Playfair Display,serif', marginTop: 12, color: '#555' }}>Sélectionnez une conversation</h3>
            <p style={{ marginTop: 6, fontSize: '.88rem' }}>
              {user.role === 'client' && 'Envoyez un message à un employé ou à l\'administrateur.'}
              {user.role === 'employee' && 'Communiquez avec les clients ou l\'administrateur.'}
              {user.role === 'admin' && 'Communiquez avec les clients et les employés.'}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="msg-chat-header">
              <div className="avatar" style={{ width: 40, height: 40, background: ROLE_COLORS[selected.role], fontSize: '1rem' }}>
                {selected.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: '.95rem' }}>{selected.name}</div>
                <div style={{ fontSize: '.72rem', color: ROLE_COLORS[selected.role], fontWeight: 600 }}>{ROLE_LABELS[selected.role]}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-list">
              {loadingMsgs && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-m)' }}>Chargement…</div>}
              {!loadingMsgs && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-m)', fontSize: '.85rem' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>👋</div>
                  Démarrez la conversation avec <strong>{selected.name}</strong>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = (msg.sender?.id || msg.sender)?.toString() === user.id?.toString();
                return (
                  <div key={msg.id || i} className={`msg-row ${isMe ? 'mine' : ''}`}>
                    {!isMe && (
                      <div className="avatar" style={{ width: 28, height: 28, background: ROLE_COLORS[selected.role], fontSize: '.78rem', flexShrink: 0 }}>
                        {selected.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className={`msg-bubble ${isMe ? 'mine' : 'theirs'}`}>{msg.content}</div>
                      <div className={`msg-meta ${isMe ? '' : ''}`} style={{ textAlign: isMe ? 'right' : 'left' }}>
                        {fmt(msg.createdAt)}
                        {isMe && msg.isRead && <span style={{ marginLeft: 4, color: 'var(--success)' }}>✓✓</span>}
                      </div>
                    </div>
                    {isMe && (
                      <div className="avatar" style={{ width: 28, height: 28, background: ROLE_COLORS[user.role], fontSize: '.78rem', flexShrink: 0 }}>
                        {user.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form className="msg-input-bar" onSubmit={send}>
              <input
                className="msg-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Message à ${selected.name}…`}
                disabled={sending}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
              />
              <button type="submit" className="msg-send-btn" disabled={sending || !text.trim()}>
                {sending ? '…' : '➤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
