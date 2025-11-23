'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSimpleAuth as useAuth } from '@/hooks/useSimpleAuth';
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Users, Settings } from 'lucide-react';

export default function VideoCallPage() {
  const { user } = useAuth();
  const params = useParams();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      // Cleanup
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsConnected(true);
      
      // Simulate remote participant joining
      setTimeout(() => {
        setParticipants(['Remote User']);
      }, 2000);
      
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Unable to access camera/microphone. Please check permissions.');
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
      }
    }
  };

  const endCall = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    window.close();
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      sender: user?.name || 'You',
      content: newChatMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, message]);
    setNewChatMessage('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Video Call</h1>
          <span className="text-sm text-gray-400">Room: {params.roomId}</span>
          {isConnected && (
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Connected
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-gray-400">
            <Users className="h-4 w-4 mr-1" />
            {participants.length + 1}
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Remote Video */}
          <div className="relative bg-gray-800 flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {participants.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400">Waiting for others to join...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
              <span className="text-sm">Remote Participant</span>
            </div>
          </div>

          {/* Local Video */}
          <div className="relative bg-gray-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
            />
            {!isVideoOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-black font-bold text-2xl">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <p className="text-gray-400">Camera is off</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-lg">
              <span className="text-sm">You</span>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="absolute right-0 top-0 w-80 h-full bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">Chat</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {chatMessages.map(message => (
                  <div key={message.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-yellow-400">{message.sender}</span>
                      <span className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-black border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-6 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-all ${
              isAudioOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-all ${
              isVideoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all ${
              showChat ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <MessageSquare className="h-6 w-6" />
          </button>
          
          <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all">
            <Settings className="h-6 w-6" />
          </button>
          
          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}