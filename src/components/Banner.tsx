import Image from "next/image";

export function Banner({ src, quote }: { src: string; quote: string }) {
  return (
    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl">
      <Image src={src} alt="" fill className="object-cover" sizes="600px" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
      <p className="absolute bottom-4 left-4 text-sm font-medium text-white">{quote}</p>
    </div>
  );
}
