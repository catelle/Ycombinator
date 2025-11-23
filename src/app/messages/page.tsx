'use client';

import { useState, useEffect, useRef } from 'react';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Message, User } from '@/types';
import { Send, Search, Video, Phone } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact && user) {
      const q = query(
        collection(db, 'messages'),
        where('participants', 'array-contains', user.id),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
          }))
          .filter(msg => 
            (msg.senderId === user.id && msg.receiverId === selectedContact.id) ||
            (msg.senderId === selectedContact.id && msg.receiverId === user.id)
          ) as Message[];
        
        setMessages(messagesData);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [selectedContact, user]);

  const fetchContacts = async () => {
    if (!user) return;
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
    
    setContacts(allUsers.filter(u => u.id !== user.id));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !user) return;

    const messageData = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      read: false,
      participants: [user.id, selectedContact.id]
    };

    await addDoc(collection(db, 'messages'), messageData);
    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startVideoCall = () => {
    const roomId = `${user?.id}-${selectedContact?.id}-${Date.now()}`;
    window.open(`/video-call/${roomId}`, '_blank', 'width=1200,height=800');
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Please sign in to access messages</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">Messages</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Contacts List */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-[500px]">
              {filteredContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedContact?.id === contact.id
                      ? 'bg-yellow-500/20 border border-yellow-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold mr-3">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{contact.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold mr-3">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedContact.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{selectedContact.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={startVideoCall}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-all"
                    >
                      <Video className="h-5 w-5" />
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all">
                      <Phone className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.senderId === user.id
                              ? 'bg-yellow-500 text-black'
                              : 'bg-gray-700 text-white'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === user.id ? 'text-black/70' : 'text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-6 border-t border-gray-700">
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-black p-2 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p className="text-xl mb-2">Select a contact to start messaging</p>
                  <p>Choose someone from your contacts list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}