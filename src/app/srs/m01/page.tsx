import { Button, Card, Field, Input, Notice, SiteNav } from "@/components/srs/kit";

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5 text-center">
      <h2 className="font-display text-2xl font-semibold text-teal-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{sub}</p>
    </div>
  );
}

function Or() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-[var(--line)]" /> or <span className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}

export default function M01() {
  return (
    <div className="min-h-screen bg-hero-mesh">
      <SiteNav />
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-3">
        <Card className="p-7 shadow-sm">
          <Head title="Welcome back" sub="Log in to your Campaignly.AI workspace" />
          <div className="space-y-4">
            <Field label="Email">
              <Input defaultValue="alex@pulsefit.example" />
            </Field>
            <Field label="Password">
              <Input type="password" defaultValue="correct-horse-battery" />
            </Field>
            <div className="text-right text-xs font-semibold text-teal-700">Forgot password?</div>
            <Button className="w-full">Sign in</Button>
          </div>
          <Or />
          <Button variant="secondary" className="w-full">
            <span className="font-bold text-[#4285F4]">G</span> Continue with Google
          </Button>
          <p className="mt-4 text-center text-xs text-slate-500">
            No account? <span className="font-semibold text-teal-700">Start free trial</span>
          </p>
        </Card>
        <Card className="p-7 shadow-sm">
          <Head title="Start your free trial" sub="14 days free · card required · cancel anytime" />
          <div className="space-y-4">
            <Field label="Your name">
              <Input defaultValue="Alex Rivera" />
            </Field>
            <Field label="Work email">
              <Input defaultValue="alex@pulsefit.example" />
            </Field>
            <Field label="Password">
              <Input type="password" defaultValue="short-pass" className="!border-red-600" />
            </Field>
            <p className="-mt-2 text-xs font-medium text-red-700">Use at least 15 characters. Any characters are allowed (10 of 15).</p>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" defaultChecked className="mt-0.5 accent-teal-700" /> I agree to the Terms of Service and Privacy Policy.
            </label>
            <Button className="w-full" disabled>
              Create account
            </Button>
          </div>
          <Or />
          <Button variant="secondary" className="w-full">
            <span className="font-bold text-[#4285F4]">G</span> Sign up with Google
          </Button>
        </Card>
        <Card className="p-7 shadow-sm">
          <Head title="Reset password" sub="We will email a one-time reset link" />
          <div className="space-y-4">
            <Field label="Email">
              <Input defaultValue="alex@pulsefit.example" />
            </Field>
            <Button className="w-full">Send reset link</Button>
          </div>
          <div className="mt-5">
            <Notice tone="success">
              If an account exists for this email, a reset link has been sent. The link expires after 30 minutes and can be used once.
            </Notice>
          </div>
          <p className="mt-5 text-center text-xs font-semibold text-teal-700">Back to login</p>
        </Card>
      </div>
    </div>
  );
}
