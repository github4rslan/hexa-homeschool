"use client";

export function VideoRoom({
  roomName,
  displayName,
}: {
  roomName: string;
  displayName: string;
}) {
  const safeRoom = encodeURIComponent(roomName);
  const safeName = encodeURIComponent(displayName);
  const src = `https://meet.jit.si/${safeRoom}#userInfo.displayName="${safeName}"&config.prejoinPageEnabled=false`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        title="Tutoring video room"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-[70vh] min-h-[520px] w-full"
      />
    </div>
  );
}
