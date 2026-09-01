type LocationMapProps = {
  location: string;
  label?: string;
  compact?: boolean;
};

/** Mapa visual reutilizable ligado a una ubicación pública (sin pedir dirección privada). */
export function LocationMap({ location, label = "Ubicación", compact = false }: LocationMapProps) {
  const query = encodeURIComponent(location || "México");
  return (
    <section className={`location-map ${compact ? "compact" : ""}`} aria-label={`${label}: ${location}`}>
      <div className="location-map-head">
        <strong>{label}</strong>
        <span>{location || "Sin ubicación"}</span>
      </div>
      <div className="location-map-frame" role="img" aria-label={`Mapa de ${location}`}>
        <iframe
          title={`Mapa de ${location}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${query}&z=12&output=embed`}
        />
      </div>
    </section>
  );
}
