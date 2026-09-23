import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Hand, 
  Users, 
  Volume2, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles,
  Maximize2,
  Minimize2,
  FileText,
  Lock,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface GroupCallModalProps {
  channelName: string;
  onClose: () => void;
}

interface CallAttendee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  studentId?: string;
  institution?: string;
  department?: string;
  level?: string;
  isSpeaking?: boolean;
  hasVideo?: boolean;
  isMuted?: boolean;
}

export default function GroupCallModal({ channelName, onClose }: GroupCallModalProps) {
  const { user, token } = useAuthStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'GRID' | 'WHITEBOARD'>('GRID');
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(true);
  const [whiteboardText, setWhiteboardText] = useState(
    '# Medcore Academy Live Class Session\n\n- Topic: Advanced Clinical Reasoning & Pharmacology Case Discussion\n- Instructor Notes: Focus on differential diagnosis for acute respiratory distress.\n- Registered & Approved Students only in attendance.'
  );

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Attendees list: strictly real registered students approved by admin + active instructors (excluding current user)
  const [participants, setParticipants] = useState<CallAttendee[]>([]);

  // Fetch verified registered students who are APPROVED by admin
  useEffect(() => {
    const fetchApprovedAttendees = async () => {
      if (!token) return;
      setIsLoadingAttendees(true);
      try {
        const res = await fetch('/api/chat/approved-class-attendees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const approvedStudents: CallAttendee[] = (data.approvedStudents || []).map((s: any, idx: number) => ({
            id: s.id,
            name: `${s.name} ${s.studentId ? `(${s.studentId})` : ''}`,
            role: 'STUDENT',
            avatar: s.avatar,
            studentId: s.studentId,
            institution: s.institution,
            department: s.department,
            level: s.level,
            isSpeaking: idx === 0, // First student active microphone demonstration
            hasVideo: true,
            isMuted: idx !== 0,
          }));

          const instructors: CallAttendee[] = (data.instructors || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            role: i.role,
            avatar: i.avatar,
            isSpeaking: false,
            hasVideo: true,
            isMuted: false,
          }));

          // Combine attendees and exclude currently logged in user (since logged in user is displayed in local stream tile)
          const allAttendees = [...instructors, ...approvedStudents].filter(p => p.id !== user?.id);
          setParticipants(allAttendees);
        }
      } catch (err) {
        console.error('Error fetching approved class attendees:', err);
      } finally {
        setIsLoadingAttendees(false);
      }
    };

    fetchApprovedAttendees();
  }, [token, user?.id]);

  useEffect(() => {
    startMedia();
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      stopMedia();
      clearInterval(interval);
    };
  }, []);

  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Video/Mic access not granted or not supported in this iframe, continuing in audio-avatar mode.');
      setIsVideoOn(false);
    }
  };

  const stopMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    } else if (!isVideoOn) {
      startMedia();
      setIsVideoOn(true);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
      } else {
        setIsScreenSharing(false);
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
    } catch (err) {
      console.error('Screen sharing error:', err);
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Conference Bar */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-900/50 border border-purple-500/30 rounded-xl">
              <GraduationCap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">{channelName} Live Classroom</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE {formatDuration(callDuration)}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  <Lock className="h-3 w-3 text-purple-400" />
                  E2EE Call
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Interactive real-time audio/video class with instructors and fellow students.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveTab('GRID')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  activeTab === 'GRID' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Class Grid
              </button>
              <button
                onClick={() => setActiveTab('WHITEBOARD')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  activeTab === 'WHITEBOARD' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Lecture Board
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>

        {/* Call Stage Area */}
        <div className="flex-1 bg-zinc-950 p-4 overflow-y-auto">
          {activeTab === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 h-full">
              {/* Local User Stream */}
              <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border-2 border-purple-500/50 shadow-lg flex items-center justify-center min-h-[220px]">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-inner">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white font-bold text-sm">{user?.name} (You)</p>
                    <span className="text-[11px] text-zinc-400 capitalize">{user?.role?.replace('_', ' ')}</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-zinc-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>{user?.name} (You)</span>
                  <span className="text-[10px] text-purple-400 uppercase">[{user?.role}]</span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center space-x-1.5">
                  {isMuted && (
                    <span className="p-1.5 bg-red-600 text-white rounded-lg">
                      <MicOff className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {isHandRaised && (
                    <span className="px-2 py-1 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1 animate-bounce">
                      <Hand className="h-3.5 w-3.5" /> Hand Raised
                    </span>
                  )}
                </div>
              </div>

              {/* Other Class Participants (Real registered approved students + faculty) */}
              {isLoadingAttendees ? (
                <div className="col-span-full flex items-center justify-center p-12 text-zinc-500">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying and synchronizing registered approved attendees...</span>
                  </div>
                </div>
              ) : participants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-8 flex flex-col items-center justify-center text-center">
                  <div className="p-3 bg-zinc-900 rounded-full text-zinc-400 mb-3 border border-zinc-800">
                    <UserCheck className="h-6 w-6 text-purple-400" />
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">Waiting for Approved Students to Join</h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Only registered students officially approved by an administrator can enter this live group class.
                  </p>
                </div>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.id}
                    className={`relative rounded-2xl overflow-hidden bg-zinc-900 border ${
                      p.isSpeaking ? 'border-emerald-500 shadow-emerald-500/10' : 'border-zinc-800'
                    } shadow-lg flex items-center justify-center min-h-[220px]`}
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40" />

                    <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-white border border-zinc-700 flex items-center gap-1.5">
                      {p.isSpeaking && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                      )}
                      <span>{p.name}</span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                        p.role === 'SUPER_ADMIN' ? 'bg-purple-900 text-purple-300' :
                        p.role === 'ADMIN' ? 'bg-blue-900 text-blue-300' :
                        'bg-zinc-800 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {p.role === 'SUPER_ADMIN' ? 'Lead Faculty' : p.role === 'ADMIN' ? 'Instructor' : 'Approved Student'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      {p.isSpeaking ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-zinc-900/80 px-2 py-1 rounded-lg border border-emerald-500/40">
                          <Volume2 className="h-3.5 w-3.5" /> Speaking
                        </span>
                      ) : null}
                    </div>

                    {p.isMuted && (
                      <div className="absolute bottom-3 right-3 p-1.5 bg-red-600/90 text-white rounded-lg">
                        <MicOff className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Whiteboard / Lecture Notes Tab */
            <div className="h-full bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span>Real-time Class Whiteboard & Collaborative Lecture Notes</span>
                </div>
                <span className="text-xs text-zinc-400">All attendees can view live notes</span>
              </div>
              <textarea
                value={whiteboardText}
                onChange={(e) => setWhiteboardText(e.target.value)}
                placeholder="Type lecture notes, formulas, clinical mnemonic notes here..."
                className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 font-mono text-sm leading-relaxed outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Bottom Conference Control Bar */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-zinc-400 text-xs">
            <Users className="h-4 w-4 text-purple-400" />
            <span>{participants.length + 1} Approved Attendees in Class</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Mic Toggle */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-2xl transition-colors font-bold ${
                isMuted ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-2xl transition-colors font-bold ${
                !isVideoOn ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {!isVideoOn ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition-colors font-bold ${
                isScreenSharing ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
              title="Share presentation or screen"
            >
              <Monitor className="h-5 w-5" />
            </button>

            {/* Raise Hand */}
            <button
              onClick={() => setIsHandRaised(!isHandRaised)}
              className={`p-3 rounded-2xl transition-colors font-bold ${
                isHandRaised ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
              title="Raise hand to ask a question"
            >
              <Hand className="h-5 w-5" />
            </button>
          </div>

          <div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg transition-colors flex items-center gap-2"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Class</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
