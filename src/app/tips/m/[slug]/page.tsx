import { TipsMobileClient } from "./tips-mobile-client";

export default async function TipsMobilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TipsMobileClient slug={slug} />;
}
