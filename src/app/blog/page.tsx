import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/marketing-shell";

const POSTS = [
  {
    slug: "meta-lead-gen-playbook",
    title: "Meta lead-gen playbook for local businesses",
    excerpt:
      "How fitness studios and salons structure offers, audiences, and WhatsApp follow-ups for higher show rates.",
    date: "2026-03-12",
  },
  {
    slug: "bradley-filter-explained",
    title: "What the Bradley Filter checks before you publish",
    excerpt:
      "A plain-language walkthrough of compliance scoring for Meta ads — claims, CTAs, and prohibited content.",
    date: "2026-02-28",
  },
  {
    slug: "whatsapp-intent-scoring",
    title: "Intent scoring: when AI should escalate to a human",
    excerpt:
      "Purchase-ready signals, objections, and opt-outs — and how delay hours keep nurturing respectful.",
    date: "2026-01-20",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <MarketingNav />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-teal-950">Blog</h1>
        <p className="mt-3 text-slate-600">
          Short product notes for the Campaignly.AI demo. Posts are static — no CMS required.
        </p>
        <ul className="mt-10 space-y-6">
          {POSTS.map((post) => (
            <li key={post.slug} className="border-t border-teal-900/10 pt-6">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {post.date}
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold text-teal-950">{post.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
              <p className="mt-3 text-xs text-teal-700">Demo article · full CMS deferred</p>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <Link href="/diagnostic" className="btn-secondary">
            Try the campaign diagnostic
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
