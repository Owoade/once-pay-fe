import Image from "next/image";

// Brand lockup: the bolt logo mark plus the Once-Pay wordmark.
// `image_class` / `wordmark_class` set the display size of each half, so the
// header (text-2xl), auth cards (text-3xl) and landing page (text-4xl) can
// share one component. Source asset is 934×994 — slightly non-square — so the
// mark renders with object-contain inside a square box.
export default function Logo({
  image_class = "h-8 w-8",
  wordmark_class = "text-xl",
}: {
  image_class?: string;
  wordmark_class?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt=""
        width={48}
        height={48}
        priority
        className={`${image_class} rounded-xl object-contain`}
      />
      <span className={`op-wordmark whitespace-nowrap ${wordmark_class}`}>
        Once-Pay
      </span>
    </span>
  );
}