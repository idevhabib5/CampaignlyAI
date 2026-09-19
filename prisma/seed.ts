import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Campaignly.AI POC demo data...");

  await prisma.whatsAppMessage.deleteMany();
  await prisma.whatsAppConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.adCreative.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.contactEnquiry.deleteMany();
  await prisma.diagnosticResult.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.referralCampaign.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@campaignly.ai",
      name: "Platform Admin",
      role: "ADMIN",
      passwordHash,
      subscription: {
        create: {
          plan: "AGENCY",
          status: "ACTIVE",
          stripeCustomerId: "cus_mock_admin",
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      },
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@fitstudio.demo",
      name: "Alex Rivera",
      role: "OWNER",
      passwordHash,
      business: {
        create: {
          businessName: "Pulse Fit Studio",
          industry: "Fitness",
          category: "Gym & Personal Training",
          brandTone: "energetic",
          communicationStyle: "friendly",
          targetAudience: "Busy professionals 25-40 who want strength & conditioning",
          website: "https://pulsefit.demo",
          location: "Austin, TX",
          services: "Group classes, PT packages, nutrition coaching",
          brandColors: JSON.stringify({ primary: "#0F766E", secondary: "#F97316" }),
          onboardingStep: 5,
          onboardingComplete: true,
          aiRecommendations: JSON.stringify({
            suggestedAudience: "Adults 25–40 interested in fitness near Austin",
            suggestedBudget: 25,
          }),
        },
      },
      subscription: {
        create: {
          plan: "PRO",
          status: "ACTIVE",
          stripeCustomerId: "cus_mock_owner",
          stripeSubscriptionId: "sub_mock_owner",
          currentPeriodEnd: new Date(Date.now() + 25 * 86400000),
        },
      },
    },
  });

  const creative = await prisma.adCreative.create({
    data: {
      userId: owner.id,
      headline: "Transform your body in 30 days",
      primaryText:
        "Ready to level up? Pulse Fit Studio is here for you.\n\nWe help busy professionals get real results with group classes and PT packages. Friendly team. Clear next steps. No stress.\n\nTap Learn More to get started today.",
      description: "Pulse Fit Studio · Fitness · Austin",
      cta: "Learn More",
      variations: JSON.stringify([
        {
          headline: "Join Austin's most supportive gym community",
          primaryText: "Join Austin's most supportive gym community — free trial week.",
        },
        {
          headline: "Free trial week — limited spots",
          primaryText: "Free trial week at Pulse Fit Studio. Limited spots this month.",
        },
      ]),
      audienceConfig: JSON.stringify({ ageMin: 25, ageMax: 40, gender: "all" }),
      complianceScore: 92,
      complianceNotes: "Bradley Filter (mock): Passed Meta policy checks.",
      status: "ready",
      templateId: "fitness-lead-gen",
    },
  });

  const campaign = await prisma.campaign.create({
    data: {
      userId: owner.id,
      adCreativeId: creative.id,
      name: "Austin Lead Gen — Spring Push",
      objective: "LEAD_GENERATION",
      status: "ACTIVE",
      dailyBudget: 35,
      targeting: JSON.stringify({
        countries: ["US"],
        cities: ["Austin"],
        radiusKm: 25,
        ageMin: 25,
        ageMax: 40,
        interests: ["Fitness", "Gym", "Weight Training"],
      }),
      metaCampaignId: "meta_camp_demo001",
      metaAdAccountId: "act_100200300",
      facebookPageId: "page_778899",
      impressions: 18420,
      clicks: 642,
      conversions: 48,
      spend: 412.5,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.campaign.create({
    data: {
      userId: owner.id,
      adCreativeId: creative.id,
      name: "Instagram Stories — Trial Offer",
      objective: "LEAD_GENERATION",
      status: "PAUSED",
      dailyBudget: 20,
      targeting: JSON.stringify({
        countries: ["US"],
        cities: ["Austin"],
        radiusKm: 15,
        ageMin: 22,
        ageMax: 35,
      }),
      metaCampaignId: "meta_camp_demo002",
      impressions: 5200,
      clicks: 180,
      conversions: 12,
      spend: 98.2,
      lastSyncedAt: new Date(Date.now() - 86400000),
    },
  });

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        userId: owner.id,
        campaignId: campaign.id,
        name: "Jordan Lee",
        email: "jordan.lee@email.com",
        phone: "+1-512-555-0142",
        status: "CONVERSION_READY",
        score: 82,
        category: "hot",
        engagementLevel: "high",
        notes: "Asked about evening PT packages",
      },
    }),
    prisma.lead.create({
      data: {
        userId: owner.id,
        campaignId: campaign.id,
        name: "Sam Patel",
        email: "sam.patel@email.com",
        phone: "+1-512-555-0198",
        status: "NURTURING",
        score: 48,
        category: "warm",
        engagementLevel: "medium",
      },
    }),
    prisma.lead.create({
      data: {
        userId: owner.id,
        campaignId: campaign.id,
        name: "Casey Morgan",
        email: "casey.m@email.com",
        phone: "+1-512-555-0110",
        status: "NEW",
        score: 10,
        category: "new",
        engagementLevel: "low",
      },
    }),
    prisma.lead.create({
      data: {
        userId: owner.id,
        campaignId: campaign.id,
        name: "Taylor Brooks",
        email: "taylor.b@email.com",
        phone: "+1-512-555-0177",
        status: "QUALIFIED",
        score: 61,
        category: "warm",
        engagementLevel: "medium",
      },
    }),
  ]);

  const conv = await prisma.whatsAppConversation.create({
    data: {
      userId: owner.id,
      leadId: leads[0].id,
      status: "AI_ACTIVE",
      leadScore: 82,
      sentiment: "positive",
      intent: "purchase_ready",
      intentConfidence: 90,
      escalateToOwner: true,
      followUpDelayHours: 0,
      readyForConversion: true,
      scoringBreakdown: JSON.stringify({
        intentLabel: "Purchase / book intent",
        sentimentScore: 36,
        behavioralSignals: [
          { id: "buy_signal", label: "Explicit booking/purchase language", weight: 20 },
          { id: "pos_tone", label: "Positive sentiment markers", weight: 8 },
          { id: "urgency", label: "Urgency language", weight: 7 },
        ],
        scoringBreakdown: {
          intentContribution: 28,
          sentimentContribution: 4,
          signalContribution: 12,
          previousScore: 60,
        },
        leadScoreDelta: 22,
        followUpDelayHours: 0,
        escalateToOwner: true,
      }),
      messages: {
        create: [
          {
            direction: "outbound",
            sender: "AI",
            content:
              "Hi Jordan! Thanks for your interest in Pulse Fit Studio. I'm the assistant for our fitness team — happy to answer questions or help you book. What are you looking for right now?",
          },
          {
            direction: "inbound",
            sender: "LEAD",
            content: "Hi! I'm interested in evening personal training. What's the price?",
          },
          {
            direction: "outbound",
            sender: "AI",
            content:
              "Happy to help with pricing! Most clients start with our starter package. Would you like a quick call, or should I send a simple breakdown here?",
          },
          {
            direction: "inbound",
            sender: "LEAD",
            content: "Yes, I'd like to book a call this week if available.",
          },
          {
            direction: "outbound",
            sender: "AI",
            content:
              "Perfect — you look conversion-ready. I’ve notified the team to take over. What time works best for a quick call today?",
          },
        ],
      },
    },
  });

  await prisma.whatsAppConversation.create({
    data: {
      userId: owner.id,
      leadId: leads[1].id,
      status: "AI_ACTIVE",
      leadScore: 48,
      sentiment: "neutral",
      intent: "information",
      intentConfidence: 75,
      escalateToOwner: false,
      followUpDelayHours: 24,
      readyForConversion: false,
      scoringBreakdown: JSON.stringify({
        intentLabel: "Information seeking",
        sentimentScore: 0,
        behavioralSignals: [
          { id: "asked_question", label: "Asked a question (active engagement)", weight: 5 },
        ],
        scoringBreakdown: {
          intentContribution: 8,
          sentimentContribution: 0,
          signalContribution: 2,
          previousScore: 40,
        },
        leadScoreDelta: 8,
        followUpDelayHours: 24,
        escalateToOwner: false,
      }),
      messages: {
        create: [
          {
            direction: "outbound",
            sender: "AI",
            content:
              "Hi Sam! Thanks for your interest in Pulse Fit Studio. What are you looking for right now?",
          },
          {
            direction: "inbound",
            sender: "LEAD",
            content: "Just exploring options for now.",
          },
          {
            direction: "outbound",
            sender: "AI",
            content:
              "Glad you asked. Quick question so I can personalize this: are you looking to start this month, or still comparing options?",
          },
        ],
      },
    },
  });

  await prisma.mediaAsset.createMany({
    data: [
      {
        userId: owner.id,
        filename: "studio-hero.jpg",
        mimeType: "image/jpeg",
        mediaType: "image",
        url: "https://placehold.co/1080x1080/134e4a/ecfdf5?text=Studio+Hero",
        width: 1080,
        height: 1080,
        brandApplied: true,
      },
      {
        userId: owner.id,
        filename: "trial-reel.mp4",
        mimeType: "video/mp4",
        mediaType: "video",
        url: "https://placehold.co/1080x1920/0f766e/ffffff?text=Trial+Reel",
        width: 1080,
        height: 1920,
        durationSec: 15,
        captions: "Auto captions (mock): Free trial week · Book today",
        brandApplied: true,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: owner.id,
        type: "conversion_ready",
        title: "Lead ready to convert",
        message: "Jordan Lee scored 82 and asked to book a call. Take over in WhatsApp.",
      },
      {
        userId: owner.id,
        type: "campaign",
        title: "Campaign metrics synced",
        message: "Austin Lead Gen — Spring Push updated from Meta (mock sync).",
      },
      {
        userId: admin.id,
        type: "system",
        title: "Welcome Admin",
        message: "Platform operations dashboard is ready.",
      },
    ],
  });

  // Incomplete onboarding user for resume demo
  await prisma.user.create({
    data: {
      email: "newbie@demo.com",
      name: "New Business Owner",
      role: "OWNER",
      passwordHash,
      business: {
        create: {
          businessName: "Glow Beauty Bar",
          industry: "Beauty",
          category: "Salon",
          brandTone: "luxury",
          communicationStyle: "friendly",
          onboardingStep: 3,
          onboardingComplete: false,
          location: "Dallas, TX",
        },
      },
      subscription: {
        create: {
          plan: "TRIAL",
          status: "TRIALING",
          trialEndsAt: new Date(Date.now() + 10 * 86400000),
        },
      },
    },
  });

  await prisma.contactEnquiry.create({
    data: {
      name: "Morgan Ellis",
      email: "morgan@localbiz.com",
      company: "LocalBiz Co",
      message: "Interested in a demo for our ecommerce brand.",
      source: "contact",
    },
  });

  await prisma.diagnosticResult.create({
    data: {
      businessName: "Pulse Fit Studio",
      industry: "Fitness",
      email: "owner@fitstudio.demo",
      monthlySpend: 450,
      score: 72,
      recommendations: JSON.stringify([
        "Tighten creative claims for Meta policy",
        "Add WhatsApp follow-up within 4 hours for hot leads",
        "Test a local-services template alongside fitness lead gen",
      ]),
    },
  });

  await prisma.referralCampaign.createMany({
    data: [
      {
        name: "Partner agencies Q1",
        code: "AGENCY25",
        channel: "partners",
        clicks: 420,
        signups: 38,
        active: true,
      },
      {
        name: "Fitness Facebook group",
        code: "FITLAUNCH",
        channel: "social",
        clicks: 890,
        signups: 61,
        active: true,
      },
      {
        name: "Inactive email drip",
        code: "WINBACK",
        channel: "email",
        clicks: 120,
        signups: 4,
        active: false,
      },
    ],
  });

  await prisma.adCreative.create({
    data: {
      userId: owner.id,
      headline: "Book your free trial this week",
      primaryText:
        "Limited free trial week at Pulse Fit Studio. Friendly coaches. Clear plan. Tap Book Now.",
      description: "Pulse Fit · Trial",
      cta: "Book Now",
      variations: JSON.stringify([]),
      audienceConfig: JSON.stringify({ ageMin: 22, ageMax: 45, gender: "all" }),
      complianceScore: 88,
      complianceNotes: "Bradley Filter (mock): Softened absolute claims.",
      status: "ready",
      templateId: "fitness-lead-gen",
    },
  });

  await prisma.mediaAsset.create({
    data: {
      userId: owner.id,
      filename: "feed-square-branded.jpg",
      mimeType: "image/jpeg",
      mediaType: "image",
      url: "https://placehold.co/1080x1080/f97316/ffffff?text=Branded+Feed",
      width: 1080,
      height: 1080,
      brandApplied: true,
      captions: "Brand kit applied · primary teal + orange accent",
    },
  });

  console.log("Seed complete.");
  console.log("Demo accounts:");
  console.log("  owner@fitstudio.demo / demo1234  (business owner)");
  console.log("  admin@campaignly.ai / demo1234   (admin)");
  console.log("  newbie@demo.com / demo1234       (incomplete onboarding)");
  console.log("  Continue with Google → google.demo@campaignly.ai (created on first click)");
  console.log(`  Conversation id sample: ${conv.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
