import { Badge, Button, Card, Chip, Field, Input, Notice, OwnerShell, PageHeader, Progress, SectionTitle } from "@/components/srs/kit";

const library = [
  { name: "studio-tour.mp4", meta: "MP4 · 0:42 · 96 MB", tag: "Source", tone: "draft" as const },
  { name: "studio-tour · 9:16 reel", meta: "Derivative · trimmed 0:05–0:20", tag: "In draft", tone: "reviewing" as const },
  { name: "trainer-portrait.jpg", meta: "JPG · 4.2 MB · enhanced", tag: "Saved", tone: "success" as const },
  { name: "spring-banner.png", meta: "PNG · 1080×1080 · brand kit", tag: "Saved", tone: "success" as const },
  { name: "member-story.mov", meta: "MOV · processing captions", tag: "Processing", tone: "warning" as const },
];

export default function M06() {
  return (
    <OwnerShell active="Media">
      <PageHeader
        title="Media library"
        subtitle="Upload, edit and prepare creatives for Facebook and Instagram placements. Originals are always kept."
        actions={<Button>+ Upload media</Button>}
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-teal-950">studio-tour.mp4</div>
                <div className="text-xs text-slate-500">Editing a copy · source file unchanged</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Trim", "Captions", "Resize", "Brand kit", "Snippet", "Enhance"].map((t) => (
                  <Chip key={t} selected={t === "Trim"}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="relative grid h-72 place-items-center rounded-lg bg-gradient-to-br from-teal-900 to-slate-900 text-white">
                <div className="text-center">
                  <div className="font-display text-3xl">Your first week is on us</div>
                  <div className="mt-1 text-sm opacity-80">Free trial pass at Pulse Fit Studio</div>
                </div>
                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">Join this week and get a free PT session</div>
                <div className="absolute right-3 top-3 rounded bg-white/20 px-2 py-1 text-xs">PF logo</div>
              </div>
              <div className="space-y-3">
                <Field label="Placement preview">
                  <div className="flex flex-wrap gap-2">
                    <Chip>Feed 1:1</Chip>
                    <Chip>Feed 4:5</Chip>
                    <Chip selected>Reels 9:16</Chip>
                    <Chip>Stories 9:16</Chip>
                  </div>
                </Field>
                <Field label="Start (s)">
                  <Input defaultValue="5.0" />
                </Field>
                <Field label="End (s)">
                  <Input defaultValue="20.0" />
                </Field>
                <p className="text-xs text-slate-500">Output length 15 s · end must be after start</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative h-10 rounded-md bg-slate-100">
                <div className="absolute inset-y-0 left-[12%] w-[36%] rounded-md border-2 border-teal-700 bg-teal-100/70" />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>0:00</span>
                <span>0:42</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <div className="text-xs text-slate-500">Captions: 6 lines generated · edit text and timing before saving</div>
              <div className="flex gap-2">
                <Button variant="ghost">Discard</Button>
                <Button variant="secondary">Preview</Button>
                <Button>Save as new version</Button>
              </div>
            </div>
          </Card>
          <Card className="border-dashed">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-teal-950">Drop files to upload</div>
                <div className="text-xs text-slate-500">JPG or PNG up to 30 MB · MP4 or MOV up to 250 MB</div>
              </div>
              <div className="w-72">
                <div className="mb-1 flex justify-between text-xs">
                  <span>member-story.mov</span>
                  <span>64%</span>
                </div>
                <Progress value={64} />
              </div>
            </div>
            <div className="mt-3">
              <Notice tone="danger">promo.gif was rejected: only JPG, PNG, MP4 and MOV files are supported.</Notice>
            </div>
          </Card>
        </div>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Library</SectionTitle>
            <Badge tone="ai">Image credits 3 / 5</Badge>
          </div>
          <div className="mb-3 flex gap-2">
            <Chip selected>All</Chip>
            <Chip>Images</Chip>
            <Chip>Videos</Chip>
          </div>
          <Input placeholder="Search assets…" />
          <div className="mt-3 space-y-2">
            {library.map((a) => (
              <div key={a.name} className="rounded-lg border border-[var(--line)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-semibold text-slate-800">{a.name}</div>
                  <Badge tone={a.tone}>{a.tag}</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-500">{a.meta}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Assets used by a draft campaign cannot be deleted.</p>
        </Card>
      </div>
    </OwnerShell>
  );
}
