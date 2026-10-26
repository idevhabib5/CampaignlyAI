"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { EmptyState, PageHeader } from "@/components/ui";

type Asset = {
  id: string;
  filename: string;
  mediaType: string;
  url: string;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  brandApplied: boolean;
  captions: string | null;
  captionTrackUrl?: string | null;
  placement?: string | null;
  source?: string | null;
  parentId?: string | null;
  processingStatus?: string | null;
  notes: string | null;
  createdAt: string;
};

type Placement = { id: string; name: string; width: number; height: number };

type Pipeline = {
  storageMode: "s3" | "local";
  whisperConfigured: boolean;
  ffmpegAvailable: boolean;
};

function isPlayableVideo(url: string) {
  if (!url) return false;
  if (url.includes("placehold.co")) return false;
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith("/uploads/") || url.startsWith("/samples/");
}

function VideoPlayer({
  asset,
  className,
  autoShowCaptions = true,
}: {
  asset: Asset;
  className?: string;
  autoShowCaptions?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = isPlayableVideo(asset.url);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoShowCaptions) return;
    const enableTracks = () => {
      for (let i = 0; i < video.textTracks.length; i += 1) {
        video.textTracks[i].mode = "showing";
      }
    };
    video.addEventListener("loadedmetadata", enableTracks);
    enableTracks();
    return () => video.removeEventListener("loadedmetadata", enableTracks);
  }, [asset.id, asset.captionTrackUrl, autoShowCaptions]);

  if (!playable) {
    return (
      <div className={`flex items-center justify-center bg-slate-800 p-4 text-center text-sm text-white ${className || ""}`}>
        This seed placeholder is not a real video. Upload an MP4/WebM to preview and add captions.
      </div>
    );
  }

  return (
    <video
      key={`${asset.id}-${asset.captionTrackUrl || "none"}`}
      ref={videoRef}
      src={asset.url}
      className={className || "h-full w-full bg-black object-contain"}
      controls
      playsInline
      preload="metadata"
      crossOrigin="anonymous"
    >
      {asset.captionTrackUrl ? (
        <track
          kind="captions"
          src={asset.captionTrackUrl}
          srcLang="en"
          label="Captions"
          default
        />
      ) : null}
    </video>
  );
}

export default function MediaPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [placementId, setPlacementId] = useState("feed_square");
  const [snippetSec, setSnippetSec] = useState(8);
  const [captionText, setCaptionText] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(8);
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const fileRef = useRef<HTMLInputElement>(null);

  async function load(keepId?: string) {
    const res = await fetch("/api/media");
    const data = await res.json();
    const nextAssets: Asset[] = data.assets || [];
    setAssets(nextAssets);
    setPlacements(data.placements || []);
    setPipeline(data.pipeline || null);
    if (data.placements?.[0]?.id) setPlacementId((prev) => prev || data.placements[0].id);
    const id = keepId || selected?.id;
    if (id) {
      const match = nextAssets.find((a) => a.id === id) || null;
      setSelected(match);
      if (match?.captions) setCaptionText(match.captions);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected?.captions) setCaptionText(selected.captions);
  }, [selected?.id, selected?.captions]);

  async function upload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image or video file first.");
      return;
    }
    setBusy(true);
    setMessage("");
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setMessage(`Uploaded ${data.asset.filename}. Select it to play and add captions.`);
    setSelected(data.asset);
    if (fileRef.current) fileRef.current.value = "";
    await load(data.asset.id);
  }

  async function runAction(action: string, extra: Record<string, unknown> = {}) {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, assetId: selected.id, ...extra }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }
    if (action === "delete") {
      setMessage("Asset deleted.");
      setSelected(null);
      setEditorOpen(false);
      setCaptionText("");
      await load();
      return;
    }
    if (data.asset) {
      setSelected(data.asset);
      if (data.asset.captions) setCaptionText(data.asset.captions);
      const label =
        action === "caption"
          ? `Captions ready (${data.provider || "ai"}). Play the video — CC is on.`
          : action === "save_captions"
            ? "Captions saved. Play the video to see them (CC)."
            : action === "resize"
              ? "Placement variant created."
              : action === "brand"
                ? "Brand kit applied — new variant saved."
                : action === "enhance"
                  ? "Image enhanced."
                  : action === "snippet"
                    ? "Short-form snippet created."
                    : "Manual edit saved as new asset.";
      setMessage(label);
    }
    setEditorOpen(false);
    await load(data.asset?.id || selected.id);
  }

  const visible = assets.filter((a) => filter === "all" || a.mediaType === filter);

  return (
    <div>
      <PageHeader
        title="Media library"
        description="Upload creatives, play videos with controls, generate or write captions, and prepare Meta placements."
      />

      {pipeline && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-md bg-teal-50 px-2 py-1 text-teal-800">
            Storage: {pipeline.storageMode === "s3" ? "AWS S3" : "local /uploads"}
          </span>
          <span
            className={`rounded-md px-2 py-1 ${pipeline.whisperConfigured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
          >
            Captions: {pipeline.whisperConfigured ? "Whisper live" : "Gemini/Groq or demo fallback"}
          </span>
          <span
            className={`rounded-md px-2 py-1 ${pipeline.ffmpegAvailable ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
          >
            Video edit: {pipeline.ffmpegAvailable ? "FFmpeg ready" : "Preview/captions work without FFmpeg"}
          </span>
        </div>
      )}

      {message && (
        <p className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
      )}
      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <form onSubmit={upload} className="card p-5">
            <h2 className="text-base font-semibold text-[var(--ink)]">Upload media</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              JPEG, PNG, WebP, MP4, or WebM — max 25MB. Upload a real MP4 to play and caption it.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                className="block w-full max-w-md text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Working…" : "Upload"}
              </button>
            </div>
          </form>

          {selected?.mediaType === "video" && (
            <div className="card overflow-hidden p-0">
              <div className="border-b border-[var(--line)] px-4 py-3">
                <h2 className="text-base font-semibold text-[var(--ink)]">Video preview</h2>
                <p className="text-xs text-[var(--muted)]">
                  Use the player controls to play. Captions (CC) appear when a VTT track is attached.
                </p>
              </div>
              <div className="aspect-video bg-black">
                <VideoPlayer asset={selected} className="h-full w-full object-contain" />
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--ink)]">Library</h2>
              <div className="flex gap-1 rounded-lg border border-[var(--line)] bg-white p-1 text-xs font-semibold">
                {(["all", "image", "video"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-2.5 py-1 capitalize ${filter === f ? "bg-teal-700 text-white" : "text-[var(--muted)] hover:bg-teal-50"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-[var(--muted)]">Loading…</p>
            ) : visible.length === 0 ? (
              <EmptyState
                title="No media yet"
                description="Upload an image or video to start the Module 3 pipeline."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      setSelected(asset);
                      setCaptionText(asset.captions || "");
                    }}
                    className={`card overflow-hidden text-left transition ${selected?.id === asset.id ? "ring-2 ring-teal-600" : "hover:border-teal-300"}`}
                  >
                    <div className="relative aspect-square bg-slate-100">
                      {asset.mediaType === "video" ? (
                        isPlayableVideo(asset.url) ? (
                          <>
                            <video
                              src={asset.url}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">
                                Play in preview
                              </span>
                            </span>
                          </>
                        ) : (
                          <div className="flex h-full items-center justify-center bg-teal-800 p-3 text-center text-xs font-semibold text-white">
                            Placeholder (not playable)
                          </div>
                        )
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.35";
                          }}
                        />
                      )}
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{asset.filename}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {asset.mediaType}
                        {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                        {asset.durationSec ? ` · ${asset.durationSec}s` : ""}
                        {asset.captionTrackUrl ? " · captions" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {asset.source && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                            {asset.source}
                          </span>
                        )}
                        {asset.parentId && (
                          <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-700">
                            variant
                          </span>
                        )}
                        {asset.brandApplied && (
                          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-teal-700">
                            branded
                          </span>
                        )}
                        {asset.captionTrackUrl && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
                            CC
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-6">
          <h2 className="text-base font-semibold text-[var(--ink)]">Actions</h2>
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">Select an asset to caption, resize, brand, enhance, or edit.</p>
          ) : (
            <>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{selected.filename}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{selected.notes || "Ready"}</p>
              </div>

              {selected.mediaType === "video" && (
                <div className="space-y-2 rounded-lg border border-[var(--line)] bg-slate-50 p-3">
                  <label className="text-xs font-semibold text-[var(--muted)]">Captions</label>
                  <textarea
                    className="input min-h-[96px] text-sm"
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    placeholder={"Line one.\nLine two.\nLine three."}
                  />
                  <div className="grid gap-2">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || !captionText.trim()}
                      onClick={() => runAction("save_captions", { captionText })}
                    >
                      Save &amp; attach captions
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => runAction("caption")}
                    >
                      Generate captions with AI
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    After saving, press play in Video preview. Enable CC in the player if captions are hidden.
                  </p>
                </div>
              )}

              {selected.mediaType !== "video" && (
                <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => runAction("caption")}>
                  Generate captions
                </button>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[var(--muted)]">Meta placement</label>
                <select
                  className="input"
                  value={placementId}
                  onChange={(e) => setPlacementId(e.target.value)}
                >
                  {placements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.width}×{p.height})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => runAction("resize", { placementId })}
                >
                  Create placement size
                </button>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => runAction("brand")}>
                  Apply brand kit
                </button>
                {selected.mediaType === "image" && (
                  <button type="button" className="btn-secondary" disabled={busy} onClick={() => runAction("enhance")}>
                    Enhance / optimize
                  </button>
                )}
                {selected.mediaType === "video" && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={snippetSec}
                      onChange={(e) => setSnippetSec(Number(e.target.value) || 8)}
                      className="input w-20"
                      title="Snippet seconds"
                    />
                    <button
                      type="button"
                      className="btn-secondary flex-1"
                      disabled={busy || !pipeline?.ffmpegAvailable}
                      onClick={() => runAction("snippet", { durationSec: snippetSec })}
                      title={!pipeline?.ffmpegAvailable ? "Install FFmpeg to create snippets" : undefined}
                    >
                      Create snippet
                    </button>
                  </div>
                )}
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => setEditorOpen(true)}>
                  Manual edit
                </button>
                <button
                  type="button"
                  className="btn-ghost text-red-700"
                  disabled={busy}
                  onClick={() => runAction("delete")}
                >
                  Delete asset
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      {editorOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-auto p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">Manual editor</h3>
                <p className="text-sm text-[var(--muted)]">
                  {selected.mediaType === "image"
                    ? "Adjust crop ratios (0–1) then save a new variant."
                    : "Set start/end seconds to trim a new video clip (needs FFmpeg)."}
                </p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setEditorOpen(false)}>
                Close
              </button>
            </div>

            <div className="mb-4 overflow-hidden rounded-lg bg-slate-100">
              {selected.mediaType === "video" ? (
                <VideoPlayer asset={selected} className="mx-auto max-h-64 w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.url} alt="" className="mx-auto max-h-64 object-contain" />
              )}
            </div>

            {selected.mediaType === "image" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(["x", "y", "w", "h"] as const).map((key) => (
                  <label key={key} className="text-xs font-semibold text-[var(--muted)]">
                    Crop {key}
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      className="input mt-1"
                      value={crop[key]}
                      onChange={(e) => setCrop({ ...crop, [key]: Number(e.target.value) })}
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[var(--muted)]">
                  Start (sec)
                  <input
                    type="number"
                    min={0}
                    className="input mt-1"
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-semibold text-[var(--muted)]">
                  End (sec)
                  <input
                    type="number"
                    min={0.5}
                    className="input mt-1"
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                  />
                </label>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setEditorOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={busy || (selected.mediaType === "video" && !pipeline?.ffmpegAvailable)}
                onClick={() =>
                  runAction(
                    "manual_edit",
                    selected.mediaType === "image"
                      ? { crop }
                      : { trim: { startSec: trimStart, endSec: trimEnd } }
                  )
                }
              >
                Save as new asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
