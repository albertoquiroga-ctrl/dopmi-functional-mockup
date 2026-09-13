type LocationMapProps = {
  location: string;
  label?: string;
  compact?: boolean;
  /** Solo el mapa: el contenedor padre aporta título y texto. */
  mapOnly?: boolean;
};

/** Mapa visual reutilizable ligado a una ubicación pública (sin pedir dirección privada). */
export function LocationMap({
  location,
  label = "Ubicación",
  compact = false,
  mapOnly = false,
}: LocationMapProps) {
  const query = encodeURIComponent(location || "México");
  return (
    <section
      className={`location-map ${compact ? "compact" : ""} ${mapOnly ? "map-only" : ""}`}
      aria-label={`${label}: ${location}`}
    >
      {mapOnly ? null : (
        <div className="location-map-head">
          <strong>{label}</strong>
          <span>{location || "Sin ubicación"}</span>
        </div>
      )}
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
