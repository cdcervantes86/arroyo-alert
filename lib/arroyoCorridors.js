// Approximate arroyo corridor paths based on Barranquilla street grid
// These trace the main flow direction of each arroyo when active
// Coordinates: [lng, lat] format (GeoJSON standard)

export const ARROYO_CORRIDORS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { id: 1, name: "Calle 84", area: "Country", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8180, 10.9970], [-74.8150, 10.9968], [-74.8120, 10.9965],
          [-74.8095, 10.9963], [-74.8060, 10.9960], [-74.8030, 10.9958],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 2, name: "Calle 79", area: "La Cumbre", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8100, 10.9935], [-74.8070, 10.9932], [-74.8040, 10.9930],
          [-74.8010, 10.9928], [-74.7980, 10.9925], [-74.7950, 10.9922],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 3, name: "Calle 72", area: "Jardín", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8050, 10.9885], [-74.8020, 10.9882], [-74.7990, 10.9880],
          [-74.7960, 10.9878], [-74.7935, 10.9876], [-74.7900, 10.9873],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 4, name: "Calle 47", area: "Rebolo", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7880, 10.9738], [-74.7850, 10.9735], [-74.7830, 10.9732],
          [-74.7810, 10.9730], [-74.7790, 10.9728], [-74.7760, 10.9725],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 5, name: "Cra 21", area: "San Roque", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7785, 10.9800], [-74.7783, 10.9790], [-74.7780, 10.9775],
          [-74.7778, 10.9760], [-74.7775, 10.9745], [-74.7773, 10.9730],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 6, name: "Calle 92", area: "La Castellana", risk: "high" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8250, 11.0028], [-74.8220, 11.0025], [-74.8190, 11.0022],
          [-74.8160, 11.0020], [-74.8130, 11.0018], [-74.8100, 11.0015],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 7, name: "Calle 75", area: "El Prado", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.8040, 10.9908], [-74.8010, 10.9905], [-74.7985, 10.9902],
          [-74.7960, 10.9900], [-74.7935, 10.9898], [-74.7910, 10.9895],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 8, name: "Cra 15", area: "Barrio Abajo", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7855, 10.9840], [-74.7853, 10.9830], [-74.7850, 10.9820],
          [-74.7848, 10.9810], [-74.7845, 10.9800], [-74.7843, 10.9790],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 9, name: "Calle 30", area: "Centro", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7890, 10.9688], [-74.7870, 10.9685], [-74.7850, 10.9682],
          [-74.7830, 10.9680], [-74.7810, 10.9678], [-74.7790, 10.9675],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 10, name: "Calle 53", area: "Boston", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7960, 10.9768], [-74.7940, 10.9765], [-74.7920, 10.9762],
          [-74.7900, 10.9760], [-74.7870, 10.9757], [-74.7840, 10.9755],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 11, name: "Calle 17", area: "San José", risk: "low" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7860, 10.9628], [-74.7840, 10.9625], [-74.7825, 10.9622],
          [-74.7810, 10.9620], [-74.7795, 10.9618], [-74.7780, 10.9615],
        ],
      },
    },
    {
      type: "Feature",
      properties: { id: 12, name: "Cra 38", area: "Chiquinquirá", risk: "medium" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-74.7925, 10.9740], [-74.7923, 10.9730], [-74.7920, 10.9720],
          [-74.7918, 10.9710], [-74.7915, 10.9700], [-74.7913, 10.9690],
        ],
      },
    },
  ],
};
