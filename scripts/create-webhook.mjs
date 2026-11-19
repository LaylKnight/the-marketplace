import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://the-marketplace-ochre.vercel.app/";

const endpoint = await stripe.webhookEndpoints.create({
  url: `${appUrl.replace(/\/+$/, "")}/api/stripe/webhook`,
  connect: true,
  enabled_events: ["checkout.session.completed", "account.updated"],
});

console.log("Signing secret:", endpoint.secret);
