'use client';

import { useState, useEffect, useRef } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

interface Message {
  id: string;
  swap_request_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface SwapRequest {
  id: string;
  requester_id: string;
  owner_id: string;
  requested_object_id: string;
  offered_object_id?: string;
  status: string;
  message?: string;
  created_at: string;
}

interface ChatInterfaceProps {
  swapRequestId: string;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

export function ChatInterface({ 
  swapRequestId, 
  currentUserId, 
  otherUserId, 
  otherUserName,
  otherUserAvatar 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = getBrowserSupabase();

  // Load initial messages
  useEffect(() => {
    loadMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat_${swapRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `swap_request_id=eq.${swapRequestId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
          
          // Mark as read if it's not from current user
          if (newMessage.sender_id !== currentUserId) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const otherUserPresence = Object.values(presenceState).find(
          (presence: any) => presence[0]?.user_id === otherUserId
        );
        setIsOtherUserOnline(!!otherUserPresence);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === otherUserId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [swapRequestId, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            email,
            user_profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('swap_request_id', swapRequestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data to include sender info
      const messagesWithSenderInfo = data.map(msg => ({
        ...msg,
        sender_name: msg.sender?.user_profiles?.display_name || msg.sender?.email || 'Unknown User',
        sender_avatar: msg.sender?.user_profiles?.avatar_url
      }));

      setMessages(messagesWithSenderInfo);
      
      // Mark unread messages as read
      const unreadMessages = messagesWithSenderInfo.filter(
        msg => !msg.is_read && msg.recipient_id === currentUserId
      );
      
      if (unreadMessages.length > 0) {
        await markMultipleMessagesAsRead(unreadMessages.map(msg => msg.id));
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            swap_request_id: swapRequestId,
            sender_id: currentUserId,
            recipient_id: otherUserId,
            content: newMessage.trim(),
            message_type: 'text',
            is_read: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Nu s-a putut trimite mesajul. Încearcă din nou.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    // Broadcast typing indicator
    const channel = supabase.channel(`chat_${swapRequestId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId },
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop broadcasting after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 3000);
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markMultipleMessagesAsRead = async (messageIds: string[]) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('ro-RO', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const generateAvatar = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Se încarcă conversația...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex items-center flex-1">
          <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
            {otherUserAvatar ? (
              <img 
                src={otherUserAvatar} 
                alt={otherUserName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              generateAvatar(otherUserName)
            )}
            {/* Online Status Indicator */}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUserName}</h3>
            <p className="text-sm text-gray-500">
              {isOtherUserOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Online acum
                </span>
              ) : (
                'Negociere schimb'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            📞
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            ⚙️
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Începe conversația</h4>
            <p className="text-gray-600">
              Trimite primul mesaj pentru a începe negocierea schimbului.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isCurrentUser && (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0">
                      {message.sender_avatar ? (
                        <img 
                          src={message.sender_avatar} 
                          alt={message.sender_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        generateAvatar(message.sender_name || 'U')
                      )}
                    </div>
                  )}
                  
                  <div className={`px-4 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <div className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                      {isCurrentUser && (
                        <span className="ml-2">
                          {message.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex max-w-xs">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2 flex-shrink-0">
                {otherUserAvatar ? (
                  <img 
                    src={otherUserAvatar} 
                    alt={otherUserName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  generateAvatar(otherUserName)
                )}
              </div>
              
              <div className="px-4 py-2 rounded-lg bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Scrie un mesaj..."
              rows={1}
              className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                !newMessage.trim() || sending
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {sending ? '...' : '📤'}
            </button>
            
            <button className="p-3 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              📎
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Apasă Enter pentru a trimite, Shift+Enter pentru linie nouă
        </div>
      </div>
    </div>
  );
}