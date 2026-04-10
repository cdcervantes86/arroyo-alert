// Approximate arroyo corridor paths — ACTIVE arroyos only (2025)
// Canalized arroyos removed
// Use /editor to refine these coordinates with satellite imagery
// Coordinates: [lng, lat] format (GeoJSON standard)

export const ARROYO_CORRIDORS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: 1, name: "Don Juan", area: "Sur / Soledad", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8050, 10.9580], [-74.8020, 10.9550], [-74.7990, 10.9520],
          [-74.7960, 10.9490], [-74.7930, 10.9460], [-74.7900, 10.9440],
          [-74.7870, 10.9420], [-74.7840, 10.9400],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 2, name: "El Salao", area: "Villa Angelita", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8280, 10.9650], [-74.8250, 10.9620], [-74.8220, 10.9600],
          [-74.8190, 10.9580], [-74.8160, 10.9560], [-74.8130, 10.9540],
          [-74.8100, 10.9520], [-74.8070, 10.9500],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 3, name: "Platanal", area: "Soledad", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8100, 10.9480], [-74.8070, 10.9450], [-74.8040, 10.9420],
          [-74.8010, 10.9390], [-74.7980, 10.9360], [-74.7950, 10.9340],
          [-74.7920, 10.9320],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 4, name: "El Bosque", area: "Suroccidente", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8180, 10.9640], [-74.8150, 10.9620], [-74.8120, 10.9600],
          [-74.8090, 10.9580], [-74.8060, 10.9570],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 5, name: "Santo Domingo", area: "Suroccidente", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8250, 10.9620], [-74.8220, 10.9600], [-74.8200, 10.9580],
          [-74.8180, 10.9570], [-74.8160, 10.9560],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 6, name: "Coltabaco", area: "Centro-Oeste", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8100, 10.9780], [-74.8070, 10.9770], [-74.8040, 10.9760],
          [-74.8010, 10.9750], [-74.7980, 10.9740],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 7, name: "La Paz", area: "Cra 40", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7960, 10.9750], [-74.7950, 10.9735], [-74.7940, 10.9720],
          [-74.7930, 10.9705], [-74.7920, 10.9690],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 8, name: "Carrera 8", area: "Barrio Abajo", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7840, 10.9840], [-74.7835, 10.9820], [-74.7830, 10.9800],
          [-74.7825, 10.9780], [-74.7820, 10.9760],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 9, name: "Calle 94", area: "Norte", risk: "low" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8220, 11.0030], [-74.8190, 11.0025], [-74.8160, 11.0020],
          [-74.8130, 11.0015], [-74.8100, 11.0010],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 10, name: "Las Américas", area: "Suroccidente", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8180, 10.9580], [-74.8150, 10.9570], [-74.8120, 10.9560],
          [-74.8100, 10.9550],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 11, name: "La Chinita", area: "Caño La Ahuyama", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8100, 10.9530], [-74.8070, 10.9510], [-74.8050, 10.9500],
          [-74.8030, 10.9490],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 12, name: "Los Ángeles", area: "Suroccidente", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8250, 10.9570], [-74.8230, 10.9555], [-74.8210, 10.9540],
          [-74.8190, 10.9530],
        ],
      },
    },
  ],
};
