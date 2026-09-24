import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  Phone, 
  Video, 
  Lock, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Search, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Crown, 
  Play, 
  Pause, 
  CheckCheck, 
  AlertCircle,
  GraduationCap,
  Paperclip,
  Smile,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Plus,
  Trash2,
  FolderPlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  LayoutGrid,
  List,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { encryptMessage, decryptMessage, getRoomFingerprint } from '../../utils/e2ee';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import GroupCallModal from './GroupCallModal';

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  senderAvatar?: string;
  recipientId?: string;
  encryptedContent: string;
  iv?: string;
  decryptedContent?: string;
  messageType: 'TEXT' | 'IMAGE' | 'VOICE_NOTE' | 'CLASS_ANNOUNCEMENT';
  mediaUrl?: string;
  audioDuration?: number;
  isPinned?: boolean;
  createdAt: string;
}

export interface StudentDirectoryItem {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  role: string;
  studentId: string;
  institution?: string;
  department?: string;
  level?: string;
  friendshipStatus: 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
  requestId?: string;
  dmChannelId: string;
}

export interface FriendItem {
  requestId: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePhoto?: string;
    studentId?: string;
    department?: string;
    institution?: string;
    level?: string;
  };
  status: string;
  createdAt: string;
  dmChannelId: string;
}

interface CommunityChatEngineProps {
  portalRole: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  initialTab?: 'CHANNELS' | 'FELLOW_STUDENTS' | 'FRIEND_REQUESTS' | 'DIRECT_MESSAGES';
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  category: string;
  isClass: boolean;
  createdBy?: string;
  createdByName?: string;
}

export default function CommunityChatEngine({ portalRole, initialTab = 'CHANNELS' }: CommunityChatEngineProps) {
  const { user, token } = useAuthStore();

  // Active view tabs
  const [activeTab, setActiveTab] = useState<'CHANNELS' | 'FELLOW_STUDENTS' | 'FRIEND_REQUESTS' | 'DIRECT_MESSAGES'>(initialTab);
  
  // Responsive Mobile & Tablet selection states:
  // 'SELECTION' = displays list/grid selection for classroom channels or friends
  // 'CONVERSATION' = displays active chat room
  const [mobileActiveView, setMobileActiveView] = useState<'SELECTION' | 'CONVERSATION'>('SELECTION');
  const [selectionViewMode, setSelectionViewMode] = useState<'grid' | 'list'>('grid');
  const [selectionSearchQuery, setSelectionSearchQuery] = useState('');

  // Channels and selection
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [activeChannelTitle, setActiveChannelTitle] = useState<string>('Select a Channel');
  
  // Direct Message active target
  const [activeDirectTarget, setActiveDirectTarget] = useState<StudentDirectoryItem | FriendItem | null>(null);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isInGroupCall, setIsInGroupCall] = useState(false);
  const [keyFingerprint, setKeyFingerprint] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Directory and friends state
  const [fellowStudents, setFellowStudents] = useState<StudentDirectoryItem[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [friendsList, setFriendsList] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendItem[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Channel Creation Modal & Delete State for Admin / Super Admin
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState('Classroom');
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);

  const canManageChannels = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch channels list
  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/chat/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return;
        }
        const data = await res.json();
        const fetchedChannels: Channel[] = data.channels || [];
        setChannels(fetchedChannels);
        
        // Dynamically select first channel if none active
        if (!activeChannelId && fetchedChannels.length > 0) {
          setActiveChannelId(fetchedChannels[0].id);
          setActiveChannelTitle(fetchedChannels[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
  };

  useEffect(() => {
    if (token) fetchChannels();
  }, [token]);

  // Handle Channel Creation
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || isCreatingChannel || !token) return;

    setIsCreatingChannel(true);
    setChannelError(null);
    try {
      const res = await fetch('/api/chat/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || 'Classroom study discussions',
          category: newChannelCategory
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setChannelError(data.error || 'Failed to create channel');
        return;
      }

      await fetchChannels();
      setActiveChannelId(data.channel.id);
      setActiveChannelTitle(data.channel.name);
      setIsCreateChannelModalOpen(false);
      setNewChannelName('');
      setNewChannelDescription('');
    } catch (err: any) {
      setChannelError(err.message || 'Error creating channel');
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // State for clearing chat & deleting channel
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [chatToast, setChatToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (chatToast) {
      const timer = setTimeout(() => setChatToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [chatToast]);

  const activeChannelObj = channels.find(c => c.id === activeChannelId);
  const isCurrentChannelOwner = Boolean(activeChannelObj?.createdBy && user?.id && activeChannelObj.createdBy === user.id);
  // Community chat can only be cleared by ADMIN or SUPER_ADMIN or channel creator; normal direct chat can be cleared by individuals
  const canClearCurrentChat = activeTab === 'DIRECT_MESSAGES' || (activeTab === 'CHANNELS' && (canManageChannels || isCurrentChannelOwner));

  // Open Channel Delete Modal
  const openDeleteChannelModal = (channelId: string, channelName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setChannelToDelete({ id: channelId, name: channelName });
  };

  // Confirm Channel Deletion
  const confirmDeleteChannel = async () => {
    if (!token || !channelToDelete || isDeletingChannel) return;

    setIsDeletingChannel(true);
    const targetId = channelToDelete.id;
    const targetName = channelToDelete.name;

    try {
      const res = await fetch(`/api/chat/channels/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Instant UI Removal
        setChannels(prev => {
          const nextChannels = prev.filter(c => c.id !== targetId);
          if (activeChannelId === targetId) {
            if (nextChannels.length > 0) {
              setActiveChannelId(nextChannels[0].id);
              setActiveChannelTitle(nextChannels[0].name);
            } else {
              setActiveChannelId('');
              setActiveChannelTitle('No Classroom Selected');
              setMessages([]);
            }
          }
          return nextChannels;
        });

        setChatToast({
          type: 'success',
          message: `Classroom channel #${targetName} and its records were permanently deleted.`
        });
        setChannelToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        setChatToast({
          type: 'error',
          message: data.error || 'Failed to delete channel.'
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setChatToast({
        type: 'error',
        message: 'Network error while deleting classroom channel.'
      });
    } finally {
      setIsDeletingChannel(false);
    }
  };

  // Open Clear Chat Modal
  const openClearChatModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!activeChannelId) return;
    setShowClearChatConfirm(true);
  };

  // Confirm Clear Chat
  const confirmClearChat = async () => {
    if (!token || !activeChannelId || isClearingChat) return;

    setIsClearingChat(true);
    try {
      const res = await fetch(`/api/chat/messages/${encodeURIComponent(activeChannelId)}/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setMessages([]);
        setChatToast({
          type: 'success',
          message: `Chat history in #${activeChannelTitle} has been completely cleared.`
        });
        setShowClearChatConfirm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setChatToast({
          type: 'error',
          message: data.error || 'Failed to clear chat history.'
        });
      }
    } catch (err) {
      console.error('Clear error:', err);
      setChatToast({
        type: 'error',
        message: 'Network error while clearing chat.'
      });
    } finally {
      setIsClearingChat(false);
    }
  };

  // Update room fingerprint
  useEffect(() => {
    getRoomFingerprint(activeChannelId).then(setKeyFingerprint);
  }, [activeChannelId]);

  // Fetch directory & friends
  const fetchDirectoryAndFriends = async () => {
    if (!token) return;
    try {
      // Fetch fellow students
      const studRes = await fetch('/api/chat/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studRes.ok) {
        const studentsData = await studRes.json();
        setFellowStudents(studentsData);
      }

      // Fetch friends & requests
      const friendsRes = await fetch('/api/chat/friends', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendsList(friendsData.friends || []);
        setIncomingRequests(friendsData.incomingRequests || []);
        setOutgoingRequests(friendsData.outgoingRequests || []);
      }
    } catch (err) {
      console.error('Error fetching directory/friends:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDirectoryAndFriends();
    }
  }, [token, activeTab]);

  // Fetch & Decrypt Messages for Active Channel
  const fetchAndDecryptMessages = async () => {
    if (!token || !activeChannelId) return;
    try {
      const res = await fetch(`/api/chat/messages/${activeChannelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('Expected JSON response from chat messages but received something else. Likely a 404 falling back to SPA HTML.');
          return;
        }
        
        const rawMessages: ChatMessage[] = await res.json();
        
        // Decrypt messages client-side
        const decryptedList = await Promise.all(
          rawMessages.map(async (msg) => {
            const dec = await decryptMessage(msg.encryptedContent, msg.iv, activeChannelId);
            return {
              ...msg,
              decryptedContent: dec
            };
          })
        );

        setMessages(decryptedList);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    }
  };

  useEffect(() => {
    fetchAndDecryptMessages();
    const interval = setInterval(fetchAndDecryptMessages, 3500); // Polling for real-time messages
    return () => clearInterval(interval);
  }, [token, activeChannelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send Text Message with AES-GCM Encryption
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !token || isSending) return;

    setIsSending(true);
    try {
      const textToEncrypt = inputText.trim();
      const { encryptedContent, iv } = await encryptMessage(textToEncrypt, activeChannelId);

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channelId: activeChannelId,
          encryptedContent,
          iv,
          messageType: activeChannelId === 'announcements' ? 'CLASS_ANNOUNCEMENT' : 'TEXT',
          recipientId: activeDirectTarget?.id || null
        })
      });

      if (res.ok) {
        setInputText('');
        await fetchAndDecryptMessages();
      }
    } catch (err) {
      console.error('Failed to send encrypted message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Send Voice Note with Encrypted Payload
  const handleSendVoiceNote = async (audioBlob: Blob, durationSeconds: number) => {
    if (!token) return;
    setIsRecordingVoice(false);
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('media', audioBlob, `voicenote-${Date.now()}.webm`);

      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (uploadRes.ok) {
        const { mediaUrl } = await uploadRes.json();
        const placeholderText = `[Voice Note: ${durationSeconds}s]`;
        const { encryptedContent, iv } = await encryptMessage(placeholderText, activeChannelId);

        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            channelId: activeChannelId,
            encryptedContent,
            iv,
            messageType: 'VOICE_NOTE',
            mediaUrl,
            audioDuration: durationSeconds,
            recipientId: activeDirectTarget?.id || null
          })
        });

        await fetchAndDecryptMessages();
      }
    } catch (err) {
      console.error('Failed to send voice note:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Upload and Send Image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const uploadRes = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (uploadRes.ok) {
        const { mediaUrl } = await uploadRes.json();
        const placeholderText = `[Medical Image: ${file.name}]`;
        const { encryptedContent, iv } = await encryptMessage(placeholderText, activeChannelId);

        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            channelId: activeChannelId,
            encryptedContent,
            iv,
            messageType: 'IMAGE',
            mediaUrl,
            recipientId: activeDirectTarget?.id || null
          })
        });

        await fetchAndDecryptMessages();
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Play / Pause Voice Note
  const togglePlayAudio = (messageId: string, url: string) => {
    if (playingAudioId === messageId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      setPlayingAudioId(messageId);
    }
  };

  // Friend actions
  const handleSendFriendRequest = async (recipientId: string) => {
    if (!token) return;
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/chat/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId })
      });
      if (res.ok) {
        await fetchDirectoryAndFriends();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send friend request');
      }
    } catch (err) {
      console.error('Friend request error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRespondFriendRequest = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    if (!token) return;
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/chat/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, action })
      });
      if (res.ok) {
        await fetchDirectoryAndFriends();
      }
    } catch (err) {
      console.error('Respond friend request error:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Start 1-on-1 Direct Chat with Friend
  const startDirectChatWithFriend = (friend: FriendItem | StudentDirectoryItem) => {
    const otherUser = 'user' in friend ? friend.user : friend;
    setActiveDirectTarget(otherUser);
    setActiveChannelId(friend.dmChannelId);
    setActiveChannelTitle(`Encrypted Direct Chat with ${otherUser.name}`);
    setActiveTab('DIRECT_MESSAGES');
    setMobileActiveView('CONVERSATION');
  };

  // Select Classroom Channel
  const handleSelectChannel = (chan: Channel) => {
    setActiveChannelId(chan.id);
    setActiveChannelTitle(chan.name);
    setActiveDirectTarget(null);
    setActiveTab('CHANNELS');
    setMobileActiveView('CONVERSATION');
  };

  // Switch tab with view reset
  const handleTabSwitch = (newTab: 'CHANNELS' | 'FELLOW_STUDENTS' | 'FRIEND_REQUESTS' | 'DIRECT_MESSAGES') => {
    setActiveTab(newTab);
    setMobileActiveView('SELECTION');
    setSelectionSearchQuery('');
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(selectionSearchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(selectionSearchQuery.toLowerCase())) ||
    (c.category && c.category.toLowerCase().includes(selectionSearchQuery.toLowerCase()))
  );

  const filteredFriends = friendsList.filter(f =>
    f.user.name?.toLowerCase().includes(selectionSearchQuery.toLowerCase()) ||
    (f.user.studentId && f.user.studentId.toLowerCase().includes(selectionSearchQuery.toLowerCase())) ||
    (f.user.department && f.user.department.toLowerCase().includes(selectionSearchQuery.toLowerCase()))
  );

  const filteredStudents = fellowStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.department && s.department.toLowerCase().includes(studentSearch.toLowerCase())) ||
    (s.institution && s.institution.toLowerCase().includes(studentSearch.toLowerCase())) ||
    (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[calc(100dvh-130px)] min-h-[580px] md:h-[780px] max-w-7xl mx-auto relative">
      {/* Action Toast Banner */}
      {chatToast && (
        <div className={`mx-6 mt-3 px-4 py-3 rounded-2xl border flex items-center justify-between shadow-xs transition-all z-20 animate-in fade-in slide-in-from-top-2 ${
          chatToast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {chatToast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{chatToast.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setChatToast(null)} 
            className="p-1 hover:bg-black/5 rounded-lg text-zinc-500 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Main Navigation Tabs */}
      <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl text-white shadow-md">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Medcore Community & Classroom Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> E2EE AES-256
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Encrypted end-to-end community channels, voice notes, live class group calls, and fellow student chats.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 text-xs">
          <button
            onClick={() => handleTabSwitch('CHANNELS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CHANNELS' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Classroom Channels</span>
          </button>

          {portalRole === 'STUDENT' && (
            <>
              <button
                onClick={() => handleTabSwitch('FELLOW_STUDENTS')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'FELLOW_STUDENTS' 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Fellow Students</span>
              </button>

              <button
                onClick={() => handleTabSwitch('FRIEND_REQUESTS')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 relative ${
                  activeTab === 'FRIEND_REQUESTS' 
                    ? 'bg-purple-600 text-white shadow-xs' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Friend Requests</span>
                {incomingRequests.length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
            </>
          )}

          <button
            onClick={() => handleTabSwitch('DIRECT_MESSAGES')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DIRECT_MESSAGES' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>1-on-1 Encrypted DMs</span>
            {friendsList.length > 0 && (
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full font-mono">
                {friendsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1 & 4: CHAT ROOM INTERFACE (CHANNELS or DIRECT MESSAGES) */}
        {(activeTab === 'CHANNELS' || activeTab === 'DIRECT_MESSAGES') && (
          <>
            {/* MOBILE & TABLET: Interactive List / Grid Selection View */}
            <div className={`flex-1 flex-col overflow-hidden bg-zinc-50 ${mobileActiveView === 'SELECTION' ? 'flex lg:hidden' : 'hidden'}`}>
              {/* Selection Header */}
              <div className="p-4 border-b border-zinc-200 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                      {activeTab === 'CHANNELS' ? <GraduationCap className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                        {activeTab === 'CHANNELS' ? 'Classroom Channels' : 'Chat with a Friend'}
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        {activeTab === 'CHANNELS' 
                          ? `${filteredChannels.length} classroom discussion channels` 
                          : `${filteredFriends.length} verified end-to-end encrypted chats`}
                      </p>
                    </div>
                  </div>

                  {/* View Mode Toggle: Grid or List */}
                  <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setSelectionViewMode('grid')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        selectionViewMode === 'grid' 
                          ? 'bg-white text-purple-700 shadow-2xs font-bold' 
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                      title="Grid Selection View"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="text-[10px] hidden sm:inline">Grid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectionViewMode('list')}
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                        selectionViewMode === 'list' 
                          ? 'bg-white text-purple-700 shadow-2xs font-bold' 
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                      title="List Selection View"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span className="text-[10px] hidden sm:inline">List</span>
                    </button>
                  </div>
                </div>

                {/* Search & Actions Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={selectionSearchQuery}
                      onChange={(e) => setSelectionSearchQuery(e.target.value)}
                      placeholder={activeTab === 'CHANNELS' ? "Search classroom channels..." : "Search friends by name or ID..."}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600"
                    />
                    {selectionSearchQuery && (
                      <button
                        onClick={() => setSelectionSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {activeTab === 'CHANNELS' && canManageChannels && (
                    <button
                      onClick={() => setIsCreateChannelModalOpen(true)}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Content (Grid or List) */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {activeTab === 'CHANNELS' ? (
                  filteredChannels.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-zinc-200">
                      <GraduationCap className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-700">No Classroom Channels Found</p>
                      <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                        {selectionSearchQuery ? `No channels matching "${selectionSearchQuery}"` : 'No classroom channels are available at this time.'}
                      </p>
                      {canManageChannels && (
                        <button
                          onClick={() => setIsCreateChannelModalOpen(true)}
                          className="mt-3 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Classroom Channel</span>
                        </button>
                      )}
                    </div>
                  ) : selectionViewMode === 'grid' ? (
                    /* GRID SELECTION MODE FOR CLASSROOM CHANNELS */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredChannels.map((chan) => {
                        const isSelected = activeChannelId === chan.id;
                        const isDeletable = canManageChannels || Boolean(chan.createdBy && user?.id && chan.createdBy === user.id);
                        return (
                          <div
                            key={chan.id}
                            onClick={() => handleSelectChannel(chan)}
                            className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/30'
                                : 'bg-white hover:bg-purple-50/30 text-zinc-800 border-zinc-200/90 hover:border-purple-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
                                  <GraduationCap className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                    {chan.category || 'Classroom'}
                                  </span>
                                  {isDeletable && (
                                    <button
                                      type="button"
                                      onClick={(e) => openDeleteChannelModal(chan.id, chan.name, e)}
                                      disabled={isDeletingChannel && channelToDelete?.id === chan.id}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isSelected 
                                          ? 'hover:bg-red-600 text-white/80 hover:text-white' 
                                          : 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                                      }`}
                                      title={`Delete channel #${chan.name}`}
                                    >
                                      {isDeletingChannel && channelToDelete?.id === chan.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-purple-700'}`}>
                                #{chan.name}
                              </h4>
                              <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>
                                {chan.description || 'Live lecture discussions and peer study'}
                              </p>
                            </div>

                            <div className="mt-3.5 pt-2.5 border-t border-zinc-100/50 flex items-center justify-between text-xs font-bold">
                              <span className={isSelected ? 'text-purple-100' : 'text-purple-600'}>
                                {isSelected ? 'Currently Active' : 'Open Channel'}
                              </span>
                              <ArrowRight className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST SELECTION MODE FOR CLASSROOM CHANNELS */
                    <div className="space-y-2">
                      {filteredChannels.map((chan) => {
                        const isSelected = activeChannelId === chan.id;
                        const isDeletable = canManageChannels || Boolean(chan.createdBy && user?.id && chan.createdBy === user.id);
                        return (
                          <div
                            key={chan.id}
                            onClick={() => handleSelectChannel(chan)}
                            className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200/80 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
                                <GraduationCap className="h-4 w-4" />
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                                    #{chan.name}
                                  </p>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                                    {chan.category || 'Class'}
                                  </span>
                                </div>
                                <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>
                                  {chan.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isDeletable && (
                                <button
                                  type="button"
                                  onClick={(e) => openDeleteChannelModal(chan.id, chan.name, e)}
                                  disabled={isDeletingChannel && channelToDelete?.id === chan.id}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'hover:bg-red-600 text-white/80 hover:text-white' 
                                      : 'hover:bg-red-50 text-zinc-400 hover:text-red-600'
                                  }`}
                                  title={`Delete channel #${chan.name}`}
                                >
                                  {isDeletingChannel && channelToDelete?.id === chan.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* DIRECT MESSAGES (CHAT WITH A FRIEND) */
                  friendsList.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-white border border-dashed border-zinc-200">
                      <Users className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-zinc-700">No Friends Added Yet</p>
                      <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                        Connect with fellow students to start end-to-end encrypted 1-on-1 private messaging!
                      </p>
                      <button
                        onClick={() => handleTabSwitch('FELLOW_STUDENTS')}
                        className="mt-3.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-purple-700 transition-colors cursor-pointer"
                      >
                        Browse Fellow Students
                      </button>
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400">
                      <p className="text-xs font-bold text-zinc-700">No Matching Friends Found</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Try another search term.</p>
                    </div>
                  ) : selectionViewMode === 'grid' ? (
                    /* GRID SELECTION MODE FOR CHAT WITH A FRIEND */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredFriends.map((f) => {
                        const isSelected = activeChannelId === f.dmChannelId;
                        return (
                          <div
                            key={f.requestId}
                            onClick={() => startDirectChatWithFriend(f)}
                            className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-md ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-600/30'
                                : 'bg-white hover:bg-purple-50/30 text-zinc-800 border-zinc-200/90 hover:border-purple-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div className="relative">
                                  <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {f.user.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  <Lock className="h-2.5 w-2.5" /> Encrypted
                                </span>
                              </div>

                              <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900 group-hover:text-purple-700'}`}>
                                {f.user.name}
                              </h4>
                              <p className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-purple-200' : 'text-zinc-400'}`}>
                                {f.user.studentId || 'Verified Friend'}
                              </p>
                              {f.user.department && (
                                <p className={`text-xs mt-1 truncate ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>
                                  {f.user.department}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-2.5 border-t border-zinc-100/50 flex items-center justify-between text-xs font-bold">
                              <span className={isSelected ? 'text-purple-100' : 'text-purple-600'}>
                                {isSelected ? 'Currently Active' : 'Start Chat'}
                              </span>
                              <ArrowRight className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* LIST SELECTION MODE FOR CHAT WITH A FRIEND */
                    <div className="space-y-2">
                      {filteredFriends.map((f) => {
                        const isSelected = activeChannelId === f.dmChannelId;
                        return (
                          <div
                            key={f.requestId}
                            onClick={() => startDirectChatWithFriend(f)}
                            className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200/80 hover:border-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                              <div className="relative shrink-0">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {f.user.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                              </div>
                              <div className="overflow-hidden flex-1">
                                <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                                  {f.user.name}
                                </p>
                                <span className={`text-[10px] font-mono block ${isSelected ? 'text-purple-100' : 'text-zinc-400'}`}>
                                  {f.user.studentId || 'Verified Friend'} • {f.user.department || 'Medicine'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Lock className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-zinc-300'}`} />
                              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* DESKTOP SIDEBAR: Always visible on large screens */}
            <div className="hidden lg:flex w-72 bg-zinc-50 border-r border-zinc-200 flex-col shrink-0">
              <div className="p-4 border-b border-zinc-200 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {activeTab === 'CHANNELS' ? 'Classroom Channels' : 'Encrypted DM Friends'}
                  </span>
                  {activeTab === 'CHANNELS' && canManageChannels && (
                    <button
                      onClick={() => setIsCreateChannelModalOpen(true)}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Create New Classroom Channel"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Channel</span>
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-700">
                  {activeTab === 'CHANNELS' ? 'Join live lecture & discussions' : 'End-to-End Encrypted Chats'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {activeTab === 'CHANNELS' ? (
                  channels.length === 0 ? (
                    <div className="p-4 text-center rounded-2xl bg-white border border-dashed border-zinc-200">
                      <p className="text-xs font-semibold text-zinc-600">No channels available</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Classroom channels were cleared.</p>
                      {canManageChannels && (
                        <button
                          onClick={() => setIsCreateChannelModalOpen(true)}
                          className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Channel</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    channels.map((chan) => {
                      const isSelected = activeChannelId === chan.id;
                      const isDeletable = canManageChannels || Boolean(chan.createdBy && user?.id && chan.createdBy === user.id);
                      return (
                        <div
                          key={chan.id}
                          className={`group relative w-full rounded-2xl transition-all border flex items-center shadow-2xs ${
                            isSelected 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-600/20' 
                              : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200/80 hover:border-zinc-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveChannelId(chan.id);
                              setActiveChannelTitle(chan.name);
                              setActiveDirectTarget(null);
                            }}
                            className="w-full text-left p-3 flex items-start gap-3 overflow-hidden cursor-pointer select-none rounded-2xl transition-colors"
                          >
                            <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden flex-1 pr-7">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                                #{chan.name}
                              </p>
                              <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-purple-100' : 'text-zinc-500'}`}>
                                {chan.description}
                              </p>
                            </div>
                          </button>

                          {/* Admin / Channel Creator Channel Delete Button */}
                          {isDeletable && (
                            <button
                              id="delete-channel-button"
                              type="button"
                              onClick={(e) => openDeleteChannelModal(chan.id, chan.name, e)}
                              disabled={isDeletingChannel && channelToDelete?.id === chan.id}
                              className={`absolute right-2.5 p-2 rounded-xl transition-all cursor-pointer z-10 group active:scale-90 shadow-xs hover:shadow-sm ${
                                isDeletingChannel && channelToDelete?.id === chan.id
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isSelected 
                                    ? 'bg-purple-700 hover:bg-red-600 text-white border border-purple-500/30' 
                                    : 'bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 border border-zinc-200/50'
                              }`}
                              title={`Permanently delete classroom #${chan.name}`}
                              aria-label={`Delete classroom channel #${chan.name}`}
                            >
                              {isDeletingChannel && channelToDelete?.id === chan.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  friendsList.length === 0 ? (
                    <div className="p-6 text-center text-zinc-400">
                      <Users className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
                      <p className="text-xs font-bold text-zinc-700">No Friends Added Yet</p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Go to "Fellow Students" tab to connect and start 1-on-1 encrypted chats!
                      </p>
                      <button
                        onClick={() => handleTabSwitch('FELLOW_STUDENTS')}
                        className="mt-3 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold"
                      >
                        Browse Students
                      </button>
                    </div>
                  ) : (
                    friendsList.map((f) => {
                      const isSelected = activeChannelId === f.dmChannelId;
                      return (
                        <button
                          key={f.requestId}
                          onClick={() => startDirectChatWithFriend(f)}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 border ${
                            isSelected 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                              : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200/70'
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {f.user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden flex-1">
                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                              {f.user.name}
                            </p>
                            <span className={`text-[10px] font-mono block ${isSelected ? 'text-purple-100' : 'text-zinc-400'}`}>
                              {f.user.studentId || 'Verified Friend'}
                            </span>
                          </div>
                          <Lock className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-300'}`} />
                        </button>
                      );
                    })
                  )
                )}
              </div>

              {/* Encryption Fingerprint Footer */}
              <div className="p-3 bg-zinc-100 border-t border-zinc-200 text-[10px] text-zinc-500 flex items-center justify-between">
                <div className="flex items-center gap-1 truncate font-mono">
                  <Lock className="h-3 w-3 text-purple-600 shrink-0" />
                  <span>FP: {keyFingerprint || 'AES-GCM-256'}</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">E2EE Verified</span>
              </div>
            </div>

            {/* Main Chat Conversation Stage: Visible when conversation active on mobile, or always on desktop */}
            <div className={`flex-1 flex-col bg-zinc-50/50 ${mobileActiveView === 'CONVERSATION' ? 'flex' : 'hidden lg:flex'}`}>
              {/* Chat Channel Header */}
              <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                  {/* Back to Selection button on Mobile & Tablet */}
                  <button
                    type="button"
                    onClick={() => setMobileActiveView('SELECTION')}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors cursor-pointer mr-1 shrink-0 border border-purple-200/60 shadow-2xs"
                    title="Back to channel/chat selection"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{activeTab === 'CHANNELS' ? 'Classrooms' : 'Friends'}</span>
                  </button>

                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 truncate">
                      <span className="truncate">{activeChannelTitle}</span>
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        🔒 End-to-End Encrypted
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 truncate">
                      Messages are encrypted locally before leaving your browser.
                    </p>
                  </div>
                </div>

                {/* Group Call / Live Class Button & Clear Chat Button */}
                <div className="flex items-center space-x-2">
                  {/* Clear Chat Button */}
                  {canClearCurrentChat && (
                    <button
                      id="clear-chat-button"
                      type="button"
                      onClick={openClearChatModal}
                      disabled={isClearingChat}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-red-100 hover:border-red-200 rounded-2xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2 shadow-xs hover:shadow-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed group active:scale-95"
                      title={
                        activeTab === 'CHANNELS'
                          ? 'Clear Classroom Chat History'
                          : 'Clear Direct Message History'
                      }
                    >
                      {isClearingChat ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 text-red-400 group-hover:text-red-600 transition-colors" />
                      )}
                      <span className="hidden sm:inline">{isClearingChat ? 'Clearing...' : 'Clear History'}</span>
                    </button>
                  )}

                  {activeTab === 'CHANNELS' && (
                    <button
                      type="button"
                      onClick={() => setIsInGroupCall(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="h-4 w-4" />
                      <span>Join Class Group Call</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Message Scroll List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="p-4 bg-purple-50 rounded-full text-purple-600 mb-3">
                      <Lock className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-800">End-to-End Encrypted Channel</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mt-1">
                      No messages yet. Send an encrypted message, medical diagram image, or voice note to begin the classroom conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isCurrentUser = msg.senderId === user?.id;
                    const isFaculty = msg.senderRole === 'SUPER_ADMIN' || msg.senderRole === 'ADMIN';

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                          msg.senderRole === 'SUPER_ADMIN' ? 'bg-purple-600 text-white' :
                          msg.senderRole === 'ADMIN' ? 'bg-blue-600 text-white' :
                          'bg-zinc-200 text-zinc-700'
                        }`}>
                          {msg.senderName?.charAt(0).toUpperCase()}
                        </div>

                        {/* Message Content Bubble */}
                        <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-xs ${
                          isCurrentUser 
                            ? 'bg-purple-600 text-white rounded-tr-none' 
                            : isFaculty
                            ? 'bg-purple-50/80 border border-purple-200 text-zinc-900 rounded-tl-none'
                            : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none'
                        }`}>
                          {/* Sender Header */}
                          <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${
                            isCurrentUser ? 'text-purple-200 justify-end' : 'text-zinc-500'
                          }`}>
                            <span className="font-bold">{msg.senderName}</span>
                            <span className={`text-[9px] uppercase font-mono px-1 py-0.2 rounded font-semibold ${
                              msg.senderRole === 'SUPER_ADMIN' ? 'bg-purple-200 text-purple-900' :
                              msg.senderRole === 'ADMIN' ? 'bg-blue-200 text-blue-900' :
                              'bg-zinc-100 text-zinc-600'
                            }`}>
                              {msg.senderRole === 'SUPER_ADMIN' ? 'Lead Faculty' : msg.senderRole === 'ADMIN' ? 'Instructor' : 'Student'}
                            </span>
                            <span className="text-[10px] opacity-75">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Body depending on type */}
                          {msg.messageType === 'IMAGE' && msg.mediaUrl ? (
                            <div className="space-y-2 mt-1">
                              <div 
                                onClick={() => setEnlargedImage(msg.mediaUrl || null)}
                                className="relative rounded-xl overflow-hidden border border-zinc-200/50 cursor-pointer group"
                              >
                                <img
                                  src={msg.mediaUrl}
                                  alt="Shared medical image"
                                  className="max-h-60 rounded-xl object-contain bg-zinc-950/10 group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Maximize2 className="h-6 w-6" />
                                </div>
                              </div>
                              <p className={`text-xs ${isCurrentUser ? 'text-purple-100' : 'text-zinc-600'}`}>
                                {msg.decryptedContent || 'Shared Medical Diagram'}
                              </p>
                            </div>
                          ) : msg.messageType === 'VOICE_NOTE' && msg.mediaUrl ? (
                            /* Voice Note Player */
                            <div className={`p-2.5 rounded-xl flex items-center gap-3 border ${
                              isCurrentUser ? 'bg-purple-700/60 border-purple-500' : 'bg-zinc-100 border-zinc-200'
                            }`}>
                              <button
                                onClick={() => togglePlayAudio(msg.id, msg.mediaUrl!)}
                                className={`p-2 rounded-full transition-transform active:scale-95 ${
                                  isCurrentUser ? 'bg-white text-purple-700' : 'bg-purple-600 text-white'
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4 ml-0.5" />
                                )}
                              </button>

                              <div className="flex-1">
                                <div className="flex items-center gap-0.5 h-4 mb-1">
                                  {[40, 80, 50, 100, 60, 90, 70, 85, 45, 95, 60, 75].map((h, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-1 rounded-full ${
                                        playingAudioId === msg.id 
                                          ? 'bg-amber-400 animate-pulse' 
                                          : isCurrentUser ? 'bg-purple-300' : 'bg-zinc-400'
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>
                                <span className={`text-[10px] font-mono ${isCurrentUser ? 'text-purple-200' : 'text-zinc-500'}`}>
                                  Voice Note ({msg.audioDuration || 0}s)
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Text Message */
                            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap">
                              {msg.decryptedContent}
                            </p>
                          )}

                          {/* E2EE indicator on bubble */}
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isCurrentUser ? 'text-purple-200' : 'text-zinc-400'
                          }`}>
                            <Lock className="h-2.5 w-2.5" />
                            <span>E2EE</span>
                            {isCurrentUser && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Input Area */}
              <div className="p-4 bg-white border-t border-zinc-200">
                {isRecordingVoice ? (
                  <VoiceNoteRecorder
                    onSend={handleSendVoiceNote}
                    onCancel={() => setIsRecordingVoice(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Image Attachment Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl transition-colors cursor-pointer"
                      title="Upload image or clinical scan"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>

                    {/* Voice Note Button */}
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-purple-600 rounded-2xl transition-colors cursor-pointer"
                      title="Record voice note"
                    >
                      <Mic className="h-4 w-4" />
                    </button>

                    {/* Text Field */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Send encrypted message in ${activeChannelTitle}...`}
                        className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none"
                      />
                      <div className="absolute right-3 top-2.5 text-zinc-400" title="End-to-End Encrypted">
                        <Lock className="h-4 w-4 text-purple-400" />
                      </div>
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="p-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: FELLOW STUDENTS DIRECTORY */}
        {activeTab === 'FELLOW_STUDENTS' && (
          <div className="flex-1 bg-zinc-50 p-6 overflow-y-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Fellow Medcore Students Directory
                </h3>
                <p className="text-xs text-zinc-500">
                  Connect with peer medical students across institutions, send friend requests, and start 1-on-1 private encrypted chats.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name, Medcore ID, or school..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.length === 0 ? (
                <div className="col-span-full bg-white p-12 rounded-2xl border border-zinc-200 text-center text-zinc-500">
                  <Users className="h-10 w-10 text-zinc-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-zinc-800">No fellow students found</p>
                  <p className="text-xs text-zinc-400">Try modifying your search criteria.</p>
                </div>
              ) : (
                filteredStudents.map((stud) => (
                  <div
                    key={stud.id}
                    className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-11 w-11 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200">
                          {stud.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-zinc-900 truncate">{stud.name}</h4>
                          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-semibold">
                            {stud.studentId || 'MEDCORE STUDENT'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-zinc-600 mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <p className="font-semibold text-zinc-800">{stud.institution || 'Medical Institution N/A'}</p>
                        <p className="text-[11px] text-zinc-500">{stud.department || 'General Medicine'} • {stud.level || 'Year 1'}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      {stud.friendshipStatus === 'FRIEND' ? (
                        <button
                          onClick={() => startDirectChatWithFriend(stud)}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Direct Encrypted Chat</span>
                        </button>
                      ) : stud.friendshipStatus === 'REQUEST_SENT' ? (
                        <span className="w-full py-2 text-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
                          Request Pending
                        </span>
                      ) : stud.friendshipStatus === 'REQUEST_RECEIVED' ? (
                        <div className="w-full flex items-center gap-2">
                          <button
                            onClick={() => handleRespondFriendRequest(stud.requestId!, 'ACCEPT')}
                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondFriendRequest(stud.requestId!, 'REJECT')}
                            className="py-1.5 px-3 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(stud.id)}
                          disabled={isActionLoading}
                          className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FRIEND REQUESTS */}
        {activeTab === 'FRIEND_REQUESTS' && (
          <div className="flex-1 bg-zinc-50 p-6 overflow-y-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-600" />
                Friend Requests & Networking
              </h3>
              <p className="text-xs text-zinc-500">
                Review pending friend requests from fellow students or check your sent requests.
              </p>
            </div>

            {/* Incoming Requests */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>Incoming Friend Requests</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                  {incomingRequests.length}
                </span>
              </h4>

              {incomingRequests.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No incoming friend requests right now.</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {incomingRequests.map((req) => (
                    <div key={req.requestId} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-200">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{req.user.name}</p>
                          <p className="text-[11px] text-zinc-500">{req.user.studentId} • {req.user.department || 'Medicine'}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRespondFriendRequest(req.requestId, 'ACCEPT')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => handleRespondFriendRequest(req.requestId, 'REJECT')}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>Sent Requests (Pending Response)</span>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-full text-xs font-bold">
                  {outgoingRequests.length}
                </span>
              </h4>

              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center">No pending sent requests.</p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {outgoingRequests.map((req) => (
                    <div key={req.requestId} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-700 font-bold flex items-center justify-center text-sm">
                          {req.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{req.user.name}</p>
                          <p className="text-[11px] text-zinc-500">{req.user.studentId}</p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                        Awaiting Acceptance
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Group Call / Live Classroom Modal */}
      {isInGroupCall && (
        <GroupCallModal
          channelName={activeChannelTitle}
          onClose={() => setIsInGroupCall(false)}
        />
      )}

      {/* Image Lightbox Modal */}
      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={enlargedImage}
              alt="Enlarged medical scan"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Admin / Super Admin Create Classroom Channel Modal */}
      {isCreateChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-600 rounded-xl text-white">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create Classroom Channel</h3>
                  <p className="text-[11px] text-zinc-400">Admin & Super Admin Faculty Tool</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCreateChannelModalOpen(false);
                  setChannelError(null);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
              {channelError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{channelError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Channel Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-zinc-400 font-bold text-xs">#</span>
                  <input
                    type="text"
                    required
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. pharmacology-specialist"
                    className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">Short descriptive title for lecture group or topic.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Description / Study Objective
                </label>
                <textarea
                  rows={3}
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="e.g. Dedicated case studies and interactive discussions on cardiovascular drugs."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-purple-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Category Tag
                </label>
                <select
                  value={newChannelCategory}
                  onChange={(e) => setNewChannelCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-purple-600 focus:bg-white"
                >
                  <option value="Classroom">Classroom & Lecture Hall</option>
                  <option value="Medical">Clinical & Case Studies</option>
                  <option value="Study Group">Exam Prep & Group Study</option>
                  <option value="Research">Research & Pathology</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateChannelModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChannel || !newChannelName.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isCreatingChannel ? (
                    <>
                      <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Create Channel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Classroom Channel Confirmation Modal */}
      {channelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-red-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Delete Classroom Channel</h3>
                <p className="text-xs text-zinc-500">Permanently Remove Classroom</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 mb-2 leading-relaxed">
              Are you sure you want to permanently delete classroom channel <strong className="text-zinc-900 font-mono">#{channelToDelete.name}</strong>?
            </p>
            <div className="text-xs text-red-700 bg-red-50 p-3.5 rounded-2xl mb-5 border border-red-200/80 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>
                This will erase this classroom, all its encrypted discussions, voice notes, and medical attachments permanently. This action cannot be undone.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
                disabled={isDeletingChannel}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChannel}
                disabled={isDeletingChannel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingChannel ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Classroom...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Delete Classroom</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat History Confirmation Modal */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-amber-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Clear Chat History</h3>
                <p className="text-xs text-zinc-500">Wipe Conversation History</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 mb-2 leading-relaxed">
              Are you sure you want to clear all message history in <strong className="text-zinc-900 font-mono">#{activeChannelTitle}</strong>?
            </p>
            <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-2xl mb-5 border border-amber-200/80 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                This will remove all encrypted text messages, voice recordings, and attached images for all participants.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearChatConfirm(false)}
                disabled={isClearingChat}
                className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearChat}
                disabled={isClearingChat}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isClearingChat ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Clearing Messages...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, Clear History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
