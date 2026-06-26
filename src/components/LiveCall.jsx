import { useState, useRef, useEffect } from "react";
import { Mic, PhoneOff, User, Clock, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveCall() {
  const [status, setStatus] = useState("Idle");
  const [seconds, setSeconds] = useState(0);

  const [messages, setMessages] = useState([
    {
      sender: "AI",
      text: "Waiting to start conversation...",
    },
  ]);

  const [aiSpeaking, setAiSpeaking] = useState(false);

  const [persona, setPersona] = useState("Tech Support Agent");

  const [context, setContext] = useState(
    "User needs automated assistance while unavailable."
  );

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let interval;

    if (status === "Live") {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const formatTime = () => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const playPCM = (base64Audio) => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const raw = atob(base64Audio);
    const bytes = new Uint8Array(raw.length);

    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);

    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    const buffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start();
  };

  const startMicrophone = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      }

      const source = audioCtxRef.current.createMediaStreamSource(streamRef.current);

      processorRef.current = audioCtxRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processorRef.current);
      processorRef.current.connect(audioCtxRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          const sample = Math.max(-1, Math.min(1, input[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }

        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";

        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        const base64Audio = btoa(binary);

        socketRef.current.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                data: base64Audio,
                mimeType: "audio/pcm;rate=16000",
              },
            },
          })
        );
      };
    } catch (err) {
      console.error(err);
    }
  };

  const startCall = () => {
    setStatus("Connecting");

    socketRef.current = new WebSocket("ws://localhost:3001");

    socketRef.current.onopen = async () => {
      setStatus("Live");

      setMessages([
        {
          sender: "AI",
          text: "Connected. Start speaking!",
        },
      ]);

      await startMicrophone();
    };

    socketRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);

      console.log(response);

      if (response.type === "audio") {
        setAiSpeaking(true);

        playPCM(response.audio);

        setTimeout(() => {
          setAiSpeaking(false);
        }, 200);
      }

      if (response.type === "transcript") {
        setMessages((prev) => [
          ...prev,
          {
            sender: "You",
            text: response.text,
          },
        ]);
      }

      if (response.type === "text") {
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: response.text,
          },
        ]);
      }
    };

    socketRef.current.onerror = () => {
      setStatus("Idle");
    };

    socketRef.current.onclose = () => {
      setStatus("Idle");
    };
  };

  const endCall = () => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioCtxRef.current?.close();
    socketRef.current?.close();

    setStatus("Idle");
    setSeconds(0);
  };

  // ---- visual state mapping ----
  const statusTheme = {
    Idle: { label: "Idle", dot: "#a1a1aa" },
    Connecting: { label: "Connecting", dot: "#eab308" },
    Live: { label: "Live", dot: "#18181b" },
  };

  const theme = statusTheme[status];

  // Liquid blob motion speeds: idle = slow ambient drift, connecting = brisk search,
  // live = attentive breathing, speaking = fast agitated churn
  const blobSpeed = aiSpeaking ? 1 : status === "Live" ? 1.8 : status === "Connecting" ? 2.4 : 5;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex items-center justify-center p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[1040px] rounded-[28px] bg-white border border-zinc-200 shadow-sm p-6 md:p-10"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center justify-between mb-10 pb-6 border-b border-zinc-100"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
              AuraCall AI
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Your Personal Voice Representative
            </p>
          </div>

          <div className="flex gap-2.5 items-center px-3.5 py-2 rounded-full bg-zinc-50 border border-zinc-200 font-mono text-sm tabular-nums text-zinc-700">
            <Clock size={15} className="text-zinc-400" />
            <span>{formatTime()}</span>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-10 md:gap-12">
          {/* LEFT: Orb + controls */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 flex flex-col items-center"
          >
            {/* Liquid Voice Orb */}
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* outer halo, soft bloom */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 208,
                  height: 208,
                  background:
                    "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 70%)",
                  filter: "blur(8px)",
                }}
                animate={{
                  scale: aiSpeaking ? [1, 1.18, 1] : status === "Live" ? [1, 1.08, 1] : [1, 1.03, 1],
                }}
                transition={{ duration: blobSpeed, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* listening ripple ring */}
              <AnimatePresence>
                {status === "Live" && (
                  <motion.div
                    className="absolute rounded-full border border-indigo-200"
                    style={{ width: 180, height: 180 }}
                    initial={{ opacity: 0.5, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              {status === "Connecting" && (
                <motion.div
                  className="absolute rounded-full border border-dashed border-amber-300"
                  style={{ width: 180, height: 180 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* the blob: layered, independently-drifting blurred gradient circles
                  clipped to a circular viewport so they melt into one organic shape */}
              <div
                className="relative w-36 h-36 rounded-full overflow-hidden"
                style={{ boxShadow: "0 8px 40px -8px rgba(79,70,229,0.45)" }}
              >
                {/* base fill so the clipped area is never empty */}
                <div className="absolute inset-0 bg-[#0b0b14]" />

                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: "85%",
                    height: "85%",
                    left: "5%",
                    top: "0%",
                    background:
                      "radial-gradient(circle at 35% 35%, #818cf8, #6366f1 55%, transparent 80%)",
                    filter: "blur(6px)",
                    mixBlendMode: "screen",
                  }}
                  animate={{
                    x: aiSpeaking ? [0, 14, -10, 8, 0] : [0, 10, -8, 0],
                    y: aiSpeaking ? [0, -10, 12, -6, 0] : [0, -8, 6, 0],
                    scale: aiSpeaking ? [1, 1.25, 0.9, 1.15, 1] : [1, 1.1, 0.95, 1],
                  }}
                  transition={{ duration: blobSpeed, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: "75%",
                    height: "75%",
                    left: "20%",
                    top: "15%",
                    background:
                      "radial-gradient(circle at 60% 40%, #67e8f9, #22d3ee 55%, transparent 80%)",
                    filter: "blur(6px)",
                    mixBlendMode: "screen",
                  }}
                  animate={{
                    x: aiSpeaking ? [0, -16, 12, -8, 0] : [0, -9, 7, 0],
                    y: aiSpeaking ? [0, 12, -14, 8, 0] : [0, 7, -9, 0],
                    scale: aiSpeaking ? [1, 0.88, 1.2, 0.95, 1] : [1, 0.95, 1.08, 1],
                  }}
                  transition={{
                    duration: blobSpeed * 1.3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.15,
                  }}
                />

                <motion.div
                  className="absolute rounded-full"
                  style={{
                    width: "55%",
                    height: "55%",
                    left: "24%",
                    top: "24%",
                    background:
                      "radial-gradient(circle at 45% 35%, #ffffff, #c7d2fe 60%, transparent 85%)",
                    filter: "blur(3px)",
                    mixBlendMode: "screen",
                    opacity: 0.9,
                  }}
                  animate={{
                    x: aiSpeaking ? [0, 8, -10, 6, 0] : [0, 5, -5, 0],
                    y: aiSpeaking ? [0, -8, 6, -4, 0] : [0, -4, 5, 0],
                    scale: aiSpeaking ? [1, 1.3, 0.85, 1.15, 1] : [1, 1.1, 1],
                  }}
                  transition={{
                    duration: blobSpeed * 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />

                {/* subtle grain/sheen overlay for a premium glassy finish */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), transparent 45%)",
                  }}
                />
              </div>
            </div>

            {/* Status row */}
            <div className="mt-6 flex items-center gap-2 text-sm text-zinc-600">
              <motion.span
                key={status}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: theme.dot }}
                animate={status === "Live" ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              {theme.label}
              <Volume2 size={14} className="text-zinc-300 ml-1" />
            </div>

            {/* Call button */}
            <motion.button
              onClick={status === "Idle" ? startCall : endCall}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`mt-7 px-8 py-3.5 rounded-full font-medium flex gap-2.5 items-center text-sm transition-colors ${
                status === "Idle"
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              }`}
            >
              <AnimatePresence mode="wait">
                {status === "Idle" ? (
                  <motion.span
                    key="start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Mic size={16} />
                    Start Call
                  </motion.span>
                ) : (
                  <motion.span
                    key="end"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <PhoneOff size={16} />
                    Disconnect
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Persona context card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-9 w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-5"
            >
              <h2 className="font-medium mb-3.5 flex gap-2 items-center text-zinc-800 text-sm">
                <User size={15} className="text-zinc-400" />
                Persona Context
              </h2>

              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full bg-white border border-zinc-200 focus:border-zinc-400 outline-none transition-colors rounded-lg p-3 text-sm resize-none"
                rows={1}
              />

              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-white border border-zinc-200 focus:border-zinc-400 outline-none transition-colors rounded-lg p-3 mt-2.5 text-sm resize-none"
                rows={3}
              />
            </motion.div>
          </motion.div>

          {/* RIGHT: Conversation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-6 flex flex-col"
          >
            <h2 className="text-base font-medium mb-5 flex items-center gap-2 text-zinc-800">
              Conversation
              {status === "Live" && (
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-900"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </h2>

            <div className="space-y-3 h-[440px] md:h-[480px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`p-4 rounded-xl border text-sm ${
                      msg.sender === "AI"
                        ? "bg-white border-zinc-200"
                        : "bg-zinc-900 border-zinc-900 text-white ml-6"
                    }`}
                  >
                    <div
                      className={`text-[11px] font-semibold mb-1 tracking-wide uppercase ${
                        msg.sender === "AI" ? "text-zinc-400" : "text-zinc-400"
                      }`}
                    >
                      {msg.sender}
                    </div>
                    <div className="leading-relaxed">{msg.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}