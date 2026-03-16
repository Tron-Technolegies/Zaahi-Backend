import stripe from "../config/stripe.js";

export const createStripePaymentIntent = async ({
  amount,
  currency,
  orderId,
  userId,
}) => {
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },

      metadata: {
        orderId,
        userId,
      },
    },
    {
      idempotencyKey: orderId,
    },
  );

  return paymentIntent;
};
