"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { soundEngine } from "@/lib/audio";
import { getFallbackAvatar } from "@/lib/avatars";

interface CallModalProps {
  call: {
    _id: string;
    conversationId: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: "audio" | "video";
    status: "ringing" | "accepted" | "declined" | "ended";
    offer?: string;
    answer?: string;
    callerCandidates?: string[];
    recipientCandidates?: string[];
  };
  currentUserId: string;
  onEndCall: () => void;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.services.mozilla.com:3478" },
    // Public high-speed TURN relay servers for NAT / Cellular traversal
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Resilient media stream requester with secure-context check & legacy fallback
async function requestUserMedia(callType: "audio" | "video"): Promise<MediaStream | null> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  // Modern navigator.mediaDevices (available in secure contexts: HTTPS or localhost)
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
    } catch (videoErr) {
      console.warn("Video getUserMedia failed, attempting audio-only:", videoErr);
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (audioErr) {
        console.warn("Audio getUserMedia failed:", audioErr);
        return null;
      }
    }
  }

  // Legacy webkit/moz fallbacks
  const legacyGetUserMedia =
    (navigator as any).getUserMedia ||
    (navigator as any).webkitGetUserMedia ||
    (navigator as any).mozGetUserMedia ||
    (navigator as any).msGetUserMedia;

  if (legacyGetUserMedia) {
    return new Promise<MediaStream | null>((resolve) => {
      legacyGetUserMedia.call(
        navigator,
        { audio: true, video: callType === "video" },
        (s: MediaStream) => resolve(s),
        () => {
          legacyGetUserMedia.call(
            navigator,
            { audio: true, video: false },
            (s: MediaStream) => resolve(s),
            () => resolve(null)
          );
        }
      );
    });
  }

  return null;
}

export default function CallModal({
  call,
  currentUserId,
  onEndCall,
  onAcceptCall,
  onDeclineCall,
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFloatingPiP, setIsFloatingPiP] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [, setLocalStreamState] = useState<MediaStream | null>(null);
  const [, setRemoteStreamState] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const timerRef = useRef<any>(null);
  const hasRemoteDescRef = useRef(false);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const processedCandidatesRef = useRef<Set<string>>(new Set());
  const isCallerStartedRef = useRef(false);
  const isRecipientStartedRef = useRef(false);

  const isCaller = call.callerId === currentUserId;
  const isIncoming = call.recipientId === currentUserId && call.status === "ringing";
  const isOutgoing = call.callerId === currentUserId && call.status === "ringing";
  const isConnected = call.status === "accepted";

  // Peer metadata
  const peerName = isCaller ? call.recipientName : call.callerName;
  const peerAvatar = isCaller ? call.recipientAvatar : call.callerAvatar;

  // Sound ringtones: outgoing calling tone for caller, incoming marimba ringtone for recipient
  useEffect(() => {
    if (call.status === "ringing") {
      if (isOutgoing) {
        soundEngine.startCallingTone();
      } else if (isIncoming) {
        soundEngine.startRingtone();
      }
    } else {
      soundEngine.stopAllTones();
    }
    return () => {
      soundEngine.stopAllTones();
    };
  }, [call.status, isOutgoing, isIncoming]);

  // Duration timer when connected
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Ensure remote and local streams are continuously attached to video/audio elements
  const bindLocalVideo = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el && localStreamRef.current) {
      if (el.srcObject !== localStreamRef.current) {
        el.srcObject = localStreamRef.current;
      }
      el.play().catch(() => {});
    }
  }, []);

  const bindRemoteVideo = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el && remoteStreamRef.current) {
      if (el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
      }
      el.play().catch(() => {
        el.muted = true;
        el.play().catch(() => {});
      });
    }
  }, []);

  const bindRemoteAudio = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el;
    if (el && remoteStreamRef.current) {
      if (el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
      }
      el.play().catch(() => {});
    }
  }, []);

  // Cleanup helper
  const cleanupMedia = useCallback(() => {
    soundEngine.stopAllTones();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  // Peer Connection factory
  const getOrCreatePeerConnection = useCallback(
    (stream: MediaStream | null): RTCPeerConnection => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      // Add local tracks if media is accessible
      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      // Ensure transceivers exist for both audio and video
      if (typeof pc.getTransceivers === "function") {
        const transceivers = pc.getTransceivers();
        const hasAudio = transceivers.some((t) => t.receiver.track.kind === "audio");
        const hasVideo = transceivers.some((t) => t.receiver.track.kind === "video");
        if (!hasAudio) {
          pc.addTransceiver("audio", { direction: "sendrecv" });
        }
        if (!hasVideo && call.callType === "video") {
          pc.addTransceiver("video", { direction: "sendrecv" });
        }
      }

      // Monitor ICE connection state & auto-recover if disconnected or failed
      pc.oniceconnectionstatechange = () => {
        if (
          (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") &&
          typeof (pc as any).restartIce === "function"
        ) {
          try {
            (pc as any).restartIce();
          } catch (_) {}
        }
      };

      // Local ICE candidate generated -> send to signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candJSON = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
          if (!candJSON || !candJSON.candidate) return;
          fetch("/api/chat/call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "candidate",
              callId: call._id,
              isCaller,
              candidate: JSON.stringify(candJSON),
            }),
          }).catch(() => {});
        }
      };

      // Remote track arrived
      pc.ontrack = (event) => {
        let remoteStream = remoteStreamRef.current;
        if (!remoteStream) {
          remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
          remoteStreamRef.current = remoteStream;
          setRemoteStreamState(remoteStream);
        }

        if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }

        if (event.track.kind === "video") {
          setHasRemoteVideo(true);
          event.track.onended = () => {
            const hasLive = remoteStream?.getVideoTracks().some((t) => t.readyState === "live");
            setHasRemoteVideo(!!hasLive);
          };
        }

        if (remoteVideoRef.current) {
          if (remoteVideoRef.current.srcObject !== remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          remoteVideoRef.current.play().catch(() => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.muted = true;
              remoteVideoRef.current.play().catch(() => {});
            }
          });
        }

        if (remoteAudioRef.current) {
          if (remoteAudioRef.current.srcObject !== remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      return pc;
    },
    [call._id, call.callType, isCaller]
  );

  // 1. Caller workflow: acquire camera/mic, create SDP offer & send to DB
  useEffect(() => {
    if (!isCaller || isCallerStartedRef.current) return;
    isCallerStartedRef.current = true;

    let isCancelled = false;

    const startCaller = async () => {
      try {
        const stream = await requestUserMedia(call.callType);

        if (isCancelled) {
          if (stream) stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (stream) {
          localStreamRef.current = stream;
          setLocalStreamState(stream);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(() => {});
          }
        } else {
          if (typeof window !== "undefined" && !window.isSecureContext) {
            setMediaWarning("Camera & Mic require HTTPS or localhost. If on mobile, please open the HTTPS URL (https://imessage-web.vercel.app).");
          } else {
            setMediaWarning("Camera / microphone access was denied or not found.");
          }
        }

        const pc = getOrCreatePeerConnection(stream);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: call.callType === "video",
        });

        if (isCancelled) return;
        await pc.setLocalDescription(offer);

        await fetch("/api/chat/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "signal-offer",
            callId: call._id,
            offer: JSON.stringify(offer),
          }),
        });
      } catch (err) {
        console.error("Error starting caller WebRTC session:", err);
      }
    };

    startCaller();

    return () => {
      isCancelled = true;
    };
  }, [isCaller, call._id, call.callType, getOrCreatePeerConnection]);

  // 2. Recipient workflow: called when accepted
  const startRecipientSession = useCallback(async () => {
    if (isRecipientStartedRef.current) return;
    isRecipientStartedRef.current = true;

    try {
      const stream = await requestUserMedia(call.callType);

      if (stream) {
        localStreamRef.current = stream;
        setLocalStreamState(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }
      } else {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          setMediaWarning("Camera & Mic require HTTPS or localhost. If on mobile, please open the HTTPS URL (https://imessage-web.vercel.app).");
        } else {
          setMediaWarning("Camera / microphone access was denied or not found.");
        }
      }

      const pc = getOrCreatePeerConnection(stream);

      // Check if offer is present or fetch it
      let offerStr = call.offer;
      if (!offerStr) {
        const res = await fetch(`/api/chat/call?callId=${call._id}`);
        if (res.ok) {
          const data = await res.json();
          offerStr = data?.offer;
        }
      }

      if (offerStr && !hasRemoteDescRef.current) {
        const offerObj = JSON.parse(offerStr);
        await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
        hasRemoteDescRef.current = true;

        // Drain queued ICE candidates
        while (iceCandidatesQueueRef.current.length > 0) {
          const cand = iceCandidatesQueueRef.current.shift();
          if (cand) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {
              console.warn("Error adding queued candidate:", e);
            }
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch("/api/chat/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "signal-answer",
            callId: call._id,
            answer: JSON.stringify(answer),
          }),
        });
      }
    } catch (err) {
      console.error("Error starting recipient WebRTC session:", err);
    }
  }, [call._id, call.offer, call.callType, getOrCreatePeerConnection]);

  // If call status switches to accepted on recipient side, trigger session
  useEffect(() => {
    if (!isCaller && isConnected && !isRecipientStartedRef.current) {
      startRecipientSession();
    }
  }, [isCaller, isConnected, startRecipientSession]);

  // 3. Polling interval to exchange SDP answer/offer and ICE candidates
  useEffect(() => {
    let isCancelled = false;

    const pollInterval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`/api/chat/call?callId=${call._id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || isCancelled) return;

        // Auto-end call if declined or ended by other party
        if (data.status === "declined" || data.status === "ended") {
          cleanupMedia();
          onEndCall();
          return;
        }

        const pc = pcRef.current;
        if (!pc) return;

        // Caller awaits Answer
        if (isCaller && !hasRemoteDescRef.current && data.answer) {
          try {
            const answerObj = JSON.parse(data.answer);
            await pc.setRemoteDescription(new RTCSessionDescription(answerObj));
            hasRemoteDescRef.current = true;

            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              if (cand) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn("Error adding queued candidate:", e);
                }
              }
            }
          } catch (e) {
            console.error("Caller setRemoteDescription error:", e);
          }
        }

        // Recipient awaits Offer if not ready initially
        if (!isCaller && !hasRemoteDescRef.current && data.offer && data.status === "accepted") {
          try {
            const offerObj = JSON.parse(data.offer);
            await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
            hasRemoteDescRef.current = true;

            while (iceCandidatesQueueRef.current.length > 0) {
              const cand = iceCandidatesQueueRef.current.shift();
              if (cand) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {
                  console.warn("Error adding queued candidate:", e);
                }
              }
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch("/api/chat/call", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "signal-answer",
                callId: call._id,
                answer: JSON.stringify(answer),
              }),
            });
          } catch (e) {
            console.error("Recipient late offer processing error:", e);
          }
        }

        // Process incoming ICE candidates
        const candidates = isCaller
          ? data.recipientCandidates || []
          : data.callerCandidates || [];

        for (const candStr of candidates) {
          if (!candStr || processedCandidatesRef.current.has(candStr)) continue;
          processedCandidatesRef.current.add(candStr);
          try {
            const candObj = JSON.parse(candStr);
            if (hasRemoteDescRef.current && pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candObj));
            } else {
              iceCandidatesQueueRef.current.push(candObj);
            }
          } catch (e) {}
        }
      } catch (_) {}
    }, 600);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [call._id, isCaller, cleanupMedia, onEndCall]);

  // Media Controls
  const toggleMute = () => {
    if (localStreamRef.current) {
      const nextMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const nextVideoOff = !isVideoOff;
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
      setIsVideoOff(nextVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        if (!navigator?.mediaDevices?.getDisplayMedia) {
          alert("Screen sharing is not supported on mobile browsers or insecure connections.");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (localStreamRef.current) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (pcRef.current && videoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
    setIsScreenSharing(false);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* -------------------------------------------------------------
     A. FLOATING PICTURE-IN-PICTURE OVERLAY MODE
     ------------------------------------------------------------- */
  if (isFloatingPiP) {
    return (
      <motion.div
        drag
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
        className="fixed bottom-20 right-6 z-50 w-72 bg-neutral-900/95 border border-white/20 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white truncate">{peerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFloatingPiP(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-white"
              title="Expand Call"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                cleanupMedia();
                onEndCall();
              }}
              className="p-1 rounded-full text-red-400 hover:bg-red-500/20"
              title="End Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {call.callType === "video" && (
          <div className="relative w-full h-36 bg-black rounded-2xl overflow-hidden mb-2">
            <video
              ref={bindRemoteVideo}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${hasRemoteVideo ? "block" : "hidden"}`}
            />
            {!hasRemoteVideo && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-950">
                <img
                  src={peerAvatar || getFallbackAvatar(peerName, "user")}
                  alt={peerName}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
                <span className="text-[10px] text-neutral-400 mt-1">Connecting video...</span>
              </div>
            )}
            <video
              ref={bindLocalVideo}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 w-16 h-20 bg-neutral-800 rounded-lg object-cover border border-white/20 transform -scale-x-100"
            />
          </div>
        )}

        <audio
          ref={bindRemoteAudio}
          autoPlay
          playsInline
          aria-hidden="true"
          style={{
            position: "fixed",
            top: -9999,
            left: -9999,
            width: "1px",
            height: "1px",
            opacity: 0.001,
            pointerEvents: "none",
          }}
        />

        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>{formatDuration(callSeconds)}</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="p-1 rounded text-white">
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* -------------------------------------------------------------
     B. FULL SCREEN / MODAL CALL INTERFACE
     ------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 sm:backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ height: "var(--app-height, 100%)" }}
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-neutral-900 border-0 sm:border border-white/15 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        {/* TOP BAR */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {call.status === "ringing" ? "Connecting..." : `Call in Progress • ${formatDuration(callSeconds)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                type="button"
                onClick={() => setIsFloatingPiP(true)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Minimize to Picture-in-Picture"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                cleanupMedia();
                if (isIncoming) {
                  onDeclineCall();
                } else {
                  onEndCall();
                }
              }}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Close Call"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INSECURE CONTEXT / PERMISSION WARNING BANNER */}
        {mediaWarning && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2.5 text-amber-300 text-xs z-20">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="flex-1 leading-snug">{mediaWarning}</span>
          </div>
        )}

        {/* MAIN VIDEO / AVATAR VIEWPORT */}
        <div className="relative flex-1 min-h-0 bg-neutral-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream */}
          {call.callType === "video" && (
            <video
              ref={bindRemoteVideo}
              autoPlay
              playsInline
              className={`w-full h-full object-cover min-h-[380px] transition-opacity duration-300 ${
                hasRemoteVideo && isConnected ? "opacity-100" : "opacity-0 absolute pointer-events-none"
              }`}
            />
          )}

          {/* Off-screen Remote Audio Player (must not be display:none for iOS Safari/Mobile playback) */}
          <audio
            ref={bindRemoteAudio}
            autoPlay
            playsInline
            aria-hidden="true"
            style={{
              position: "fixed",
              top: -9999,
              left: -9999,
              width: "1px",
              height: "1px",
              opacity: 0.001,
              pointerEvents: "none",
            }}
          />

          {/* Avatar / Placeholder view when video not receiving or call is audio */}
          {(!hasRemoteVideo || !isConnected || call.callType === "audio") && (
            <div className="flex flex-col items-center gap-4 py-12 z-0">
              <div className="relative">
                <img
                  src={peerAvatar || getFallbackAvatar(peerName, "user")}
                  alt={peerName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-2xl"
                />
                {call.status === "ringing" && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-40" />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{peerName}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {call.status === "ringing"
                    ? isIncoming
                      ? "Incoming Call..."
                      : "Calling..."
                    : call.callType === "video"
                    ? "Connecting video feed..."
                    : `Encrypted Voice Session (${formatDuration(callSeconds)})`}
                </p>
              </div>
            </div>
          )}

          {/* Local Video Stream (Self Preview PiP) */}
          {call.callType === "video" && (isOutgoing || isConnected) && (
            <div className="absolute top-4 right-4 z-20 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-900">
              <video
                ref={bindLocalVideo}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${
                  isVideoOff ? "hidden" : "block"
                }`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-neutral-400 text-[10px] gap-1">
                  <VideoOff className="w-5 h-5 text-neutral-500" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[9px] font-medium text-white/75 px-1 py-0.5 rounded bg-black/40 backdrop-blur-xs">
                You
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CALL CONTROLS */}
        <div className="p-4 sm:p-5 bg-neutral-900/95 border-t border-white/10 flex items-center justify-center gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {isIncoming ? (
            /* INCOMING ACTIONS: ACCEPT OR DECLINE */
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  cleanupMedia();
                  onDeclineCall();
                }}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.stopAllTones();
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.play().catch(() => {});
                  }
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play().catch(() => {});
                  }
                  onAcceptCall();
                  startRecipientSession();
                }}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Accept Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          ) : (
            /* ACTIVE / OUTGOING CONTROLS */
            <div className="flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isMuted ? "bg-red-600/30 text-red-400 border border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Camera Toggle */}
              {call.callType === "video" && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                    isVideoOff ? "bg-red-600/30 text-red-400 border border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Screen Share */}
              {call.callType === "video" && isConnected && (
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                    isScreenSharing ? "bg-blue-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title="Share Screen"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              {/* Hang Up Button */}
              <button
                type="button"
                onClick={() => {
                  cleanupMedia();
                  onEndCall();
                }}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-500/40 transition-all hover:scale-105 active:scale-95 ml-2 cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
