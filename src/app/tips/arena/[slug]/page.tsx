import { ArenaClient } from "./arena-client";

export default async function TipsArenaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArenaClient slug={slug} />;
}
