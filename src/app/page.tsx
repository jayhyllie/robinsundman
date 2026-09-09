import Image from "next/image";

export default function SundmanEventsHome() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-black">
      <Image
        src="/images/logo.jpg"
        alt="Robin Sundman AB"
        width={800}
        height={800}
        priority
        className="h-auto w-full max-w-md px-6"
      />
    </main>
  );
}
