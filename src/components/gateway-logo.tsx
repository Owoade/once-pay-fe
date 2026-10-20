import Image from "next/image";

// Gateway marks, keyed by the `payment_gateway` values the backend stores
// (each gateway's `provider_name`). Note Monnify's is "monify" — the
// provider's env vars spell it that way, so the stored data does too.
const GATEWAY_ASSETS: Record<string, { src: string; label: string }> = {
  paystack: { src: "/paystack.png", label: "Paystack" },
  flutterwave: { src: "/flutterwave.png", label: "Flutterwave" },
  korapay: { src: "/korapay.jpeg", label: "Korapay" },
  seerbit: { src: "/seerbit_logo.jpeg", label: "SeerBit" },
  monify: { src: "/monnify.png", label: "Monnify" },
  // The backend spells Monnify two ways: rows are stored with its
  // provider_name "monify", while the initiate API (and the SDK's
  // PaymentGateway type) expect "monnify" — so the mark must resolve for
  // both.
  monnify: { src: "/monnify.png", label: "Monnify" },
};

// Human name for a stored gateway value ("monify" → "Monnify").
export function gateway_display_name(gateway: string): string {
  return GATEWAY_ASSETS[gateway.toLowerCase()]?.label ?? gateway;
}

// The provider's mark inside a small tile. The source images have mixed
// backgrounds (navy, cream, white, red), so the tile's padding + border keeps
// them visually even side by side. Renders nothing for unknown gateways so
// new/removed providers degrade to plain text rather than a broken image.
export default function GatewayLogo({ gateway }: { gateway: string }) {
  const asset = GATEWAY_ASSETS[gateway.toLowerCase()];
  if (!asset) return null;

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800">
      <Image
        src={asset.src}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded object-contain"
      />
    </span>
  );
}