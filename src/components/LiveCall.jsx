import { useState, useRef } from "react";

export default function LiveCall() {
  const [status, setStatus] = useState("Idle");

  const socketRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const processorRef = useRef(null);

  const startMicrophone = async () => {
    try {
      streamRef.current =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      console.log("🎤 Microphone permission granted!");

      audioCtxRef.current = new AudioContext({
        sampleRate: 16000,
      });

      const source =
        audioCtxRef.current.createMediaStreamSource(
          streamRef.current
        );

      processorRef.current =
        audioCtxRef.current.createScriptProcessor(
          4096,
          1,
          1
        );

      source.connect(processorRef.current);
      processorRef.current.connect(
        audioCtxRef.current.destination
      );

      processorRef.current.onaudioprocess = (e) => {
        if (
          !socketRef.current ||
          socketRef.current.readyState !==
            WebSocket.OPEN
        ) {
          return;
        }

        const input =
          e.inputBuffer.getChannelData(0);

        const pcm16 =
          new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          const sample = Math.max(
            -1,
            Math.min(1, input[i])
          );

          pcm16[i] =
            sample < 0
              ? sample * 0x8000
              : sample * 0x7fff;
        }

        const bytes =
          new Uint8Array(pcm16.buffer);

        let binary = "";

        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(
            bytes[i]
          );
        }

        const base64Audio = btoa(binary);

        socketRef.current.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                data: base64Audio,
                mimeType:
                  "audio/pcm;rate=16000",
              },
            },
          })
        );

        console.log("🎤 Sent audio chunk");
      };
    } catch (err) {
      console.error(
        "Microphone Error:",
        err
      );
      setStatus("Idle");
    }
  };

  const startCall = () => {
    setStatus("Connecting");

    socketRef.current = new WebSocket(
      "ws://localhost:3001"
    );

    socketRef.current.onopen =
      async () => {
        console.log(
          "✅ Connected to backend!"
        );

        setStatus("Live");

        await startMicrophone();
      };

    socketRef.current.onmessage = (
      event
    ) => {
      console.log(
        "📨 Message from backend:",
        event.data
      );
    };

    socketRef.current.onerror = (
      err
    ) => {
      console.error(
        "❌ WebSocket Error:",
        err
      );
      setStatus("Idle");
    };

    socketRef.current.onclose = () => {
      console.log(
        "🔌 Connection Closed"
      );
      setStatus("Idle");
    };
  };

  const endCall = () => {
    processorRef.current?.disconnect();

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    audioCtxRef.current?.close();

    socketRef.current?.close();

    setStatus("Idle");
  };

  return (
    <div className="bg-zinc-900 p-10 rounded-3xl text-white shadow-2xl w-[400px] text-center">
      <div
        className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 ${
          status === "Live"
            ? "bg-green-500 animate-pulse"
            : status === "Connecting"
            ? "bg-yellow-500 animate-pulse"
            : "bg-red-500"
        }`}
      >
        🎙️
      </div>

      <h1 className="text-2xl font-bold">
        Status: {status}
      </h1>

      <button
        onClick={
          status === "Idle"
            ? startCall
            : endCall
        }
        className={`mt-8 px-6 py-3 rounded-full font-bold transition ${
          status === "Idle"
            ? "bg-green-600 hover:bg-green-500"
            : "bg-red-600 hover:bg-red-500"
        }`}
      >
        {status === "Idle"
          ? "Start Voice Agent Call"
          : "Disconnect"}
      </button>
    </div>
  );
}