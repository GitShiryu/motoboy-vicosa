import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { origin, destination, volume, price, method } = req.body;

    if (!price || typeof price !== "number") {
       return res.status(400).json({ message: "Invalid price" });
    }

    const volumeLabel = volume === "bau" ? "Baú Grande" : volume === "mochila" ? "Mochila Média" : "Sacola Pequena";

    // Set payment method types based on the request
    let payment_method_types = ["card"];
    if (method === "pix_stripe") {
       payment_method_types = ["pix"];
    }

    // Replace with your real Vercel URL in production
    const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: payment_method_types as any,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Entrega Rápida - Romão Motoboy",
              description: `De: ${origin}\nPara: ${destination}\nVolume: ${volumeLabel}`,
            },
            unit_amount: Math.round(price * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${host}/sucesso`,
      cancel_url: `${host}/`,
      // For single vendor, we don't need transfer_data, the money goes to the Stripe account owner directly (Romão)
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ message: error.message });
  }
}
