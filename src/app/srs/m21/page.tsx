import { Badge, Button, Card, Field, Input, Select, SiteNav, Textarea } from "@/components/srs/kit";

const questions: [string, string][] = [
  ["1. What is your industry?", "Fitness"],
  ["2. What is your main goal for the next 30 days?", "Get more enquiries"],
  ["3. Where are your customers?", "Within 5 km of my location"],
  ["4. How do you follow up enquiries today?", "Manually on WhatsApp, often late"],
  ["5. Have you run Facebook or Instagram ads before?", "Yes, boosted posts only"],
];

export default function M21() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-teal-950">Campaign diagnostic</h1>
        <p className="mt-2 text-slate-600">Five questions, three findings and a suggested Meta objective. Nothing is published.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card>
            <div className="space-y-4">
              {questions.map(([q, a]) => (
                <Field key={q} label={q}>
                  <Select defaultValue="a">
                    <option value="a">{a}</option>
                  </Select>
                </Field>
              ))}
            </div>
            <Button className="mt-5 w-full">Get my diagnostic</Button>
          </Card>
          <div className="space-y-5">
            <Card ai>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg font-semibold text-teal-950">Your results</div>
                <Badge tone="ai">Suggested objective: Leads</Badge>
              </div>
              <ol className="mt-3 space-y-3 text-sm text-slate-700">
                <li>
                  <strong>1. Late follow-up may be losing enquiries.</strong> Replying on WhatsApp while interest is fresh is easier with an automated first reply.
                </li>
                <li>
                  <strong>2. Boosted posts do not collect contact details.</strong> A Leads objective with a lead form captures name and phone directly.
                </li>
                <li>
                  <strong>3. Your audience is local.</strong> A 5 km radius around your location keeps budget on people who can visit.
                </li>
              </ol>
            </Card>
            <Card>
              <div className="font-display text-lg font-semibold text-teal-950">Talk to us</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input defaultValue="Priya Shah" />
                </Field>
                <Field label="Email">
                  <Input defaultValue="priya@spiceroute.example" />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Your enquiry">
                  <Textarea defaultValue="Can the WhatsApp agent answer menu questions for my restaurant?" className="!min-h-16" />
                </Field>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" defaultChecked className="mt-0.5 accent-teal-700" /> I agree to be contacted about my enquiry (Privacy Policy).
              </label>
              <Button className="mt-3 w-full">Send enquiry</Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
