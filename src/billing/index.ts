import Stripe from "stripe";
import { AppConfig } from "../types/index.js";

const stripe = new Stripe("", { apiVersion: "2026-07-29.dahlia" });

export async function createCustomer(email: string, config: AppConfig): Promise<string> {
  const customer = await stripe.customers.create({ email });
  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  config: AppConfig
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${config.frontendUrl}/success`,
    cancel_url: `${config.frontendUrl}/cancel`,
  });
  return session.url ?? "";
}

export async function handleStripeWebhook(
  payload: string,
  signature: string,
  config: AppConfig
): Promise<{ type: string; customerId?: string; subscriptionId?: string } | null> {
  const event = stripe.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);

  switch (event.type) {
    case "checkout.session.completed":
      return { type: "subscription_started", customerId: event.data.object.customer as string };
    case "customer.subscription.updated":
      return { type: "subscription_updated", subscriptionId: event.data.object.id as string };
    case "customer.subscription.deleted":
      return { type: "subscription_cancelled", customerId: event.data.object.customer as string };
    default:
      return null;
  }
}