import { WinnerRevealClient } from "./winner-reveal-client";

export default async function TipsWinnerRevealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <WinnerRevealClient slug={slug} />;
}
