export function HeroBackground({ imageUrl }: { imageUrl?: string | null }) {
  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-linear-to-br from-primary-dark/70 via-primary-dark/80 to-primary-dark" />
      <div className="absolute inset-0 bg-primary-dark/30" />
    </div>
  );
}
