export interface DeliveryCalculation {
  fee: number;
  distanceKm: number;
  zone: 'local' | 'media' | 'longa' | 'free' | 'unknown';
  label: string;
  freeEligible: boolean;
}

const ORIGIN_ADDRESS = 'Rua Joaquim Francisco Rosa de Azevedo, 41, Ville Blanche, Cabo Frio - RJ';

const FREE_DELIVERY_THRESHOLD = 50.0;

const LOCAL_FEE = 5.5;
const MEDIA_FEE = 8.0;
const MEDIA_BASE = 8.0;
const LONGA_PER_KM = 1.5;

type Zone = 'local' | 'media' | 'longa';

interface AreaInfo {
  distance: number;
  zone: Zone;
}

// All known neighborhoods in Cabo Frio with distance from the store (Ville Blanche)
export const NEIGHBORHOOD_LIST: { label: string; value: string; distance: number; zone: Zone }[] = [
  { label: 'Ville Blanche', value: 'ville blanche', distance: 0.5, zone: 'local' },
  { label: 'Porto Roxo', value: 'porto roxo', distance: 1.0, zone: 'local' },
  { label: 'Prainha', value: 'prainha', distance: 1.2, zone: 'local' },
  { label: 'Centro', value: 'centro', distance: 1.5, zone: 'local' },
  { label: 'Braga', value: 'braga', distance: 1.6, zone: 'local' },
  { label: 'Passagem', value: 'passagem', distance: 1.8, zone: 'local' },
  { label: 'Ogiva', value: 'ogiva', distance: 2.0, zone: 'local' },
  { label: 'Dique', value: 'dique', distance: 2.0, zone: 'local' },
  { label: 'Praia do Forno', value: 'praia do forno', distance: 2.0, zone: 'local' },
  { label: 'Vila Esperança', value: 'vila esperanca', distance: 2.5, zone: 'media' },
  { label: 'Jardim Caçara', value: 'jardim cacara', distance: 3.0, zone: 'media' },
  { label: 'Parque União', value: 'parque uniao', distance: 3.2, zone: 'media' },
  { label: 'Costazul', value: 'costazul', distance: 3.0, zone: 'media' },
  { label: 'Interlagos', value: 'interlagos', distance: 3.5, zone: 'media' },
  { label: 'Vila Verde', value: 'vila verde', distance: 3.8, zone: 'media' },
  { label: 'São Cristóvão', value: 'sao cristovao', distance: 4.0, zone: 'media' },
  { label: 'Jardim Bandeirantes', value: 'jardim bandeirantes', distance: 4.2, zone: 'media' },
  { label: 'Jardim Primavera', value: 'jardim primavera', distance: 4.5, zone: 'media' },
  { label: 'Parque Santa Helena', value: 'parque santa helena', distance: 4.5, zone: 'media' },
  { label: 'Vila Caranguejo', value: 'vila caranguejo', distance: 4.8, zone: 'media' },
  { label: 'Iguariba', value: 'iguariba', distance: 5.0, zone: 'media' },
  { label: 'Jacaré', value: 'jacare', distance: 5.0, zone: 'media' },
  { label: 'Manoel Corrêa', value: 'manoel correia', distance: 5.5, zone: 'longa' },
  { label: 'Brucutu', value: 'brucutu', distance: 6.0, zone: 'longa' },
  { label: 'Rainha do Mar', value: 'rainha do mar', distance: 6.5, zone: 'longa' },
  { label: 'Tamoio', value: 'tamoio', distance: 7.0, zone: 'longa' },
  { label: 'Nova Cocos', value: 'nova cocos', distance: 7.0, zone: 'longa' },
  { label: 'Unidade', value: 'unidade', distance: 7.5, zone: 'longa' },
  { label: 'Jardim Marisol', value: 'jardim marisol', distance: 8.0, zone: 'longa' },
  { label: 'São Januário', value: 'sao januário', distance: 8.5, zone: 'longa' },
  { label: 'Campo Verde', value: 'campo verde', distance: 9.0, zone: 'longa' },
  { label: 'Praia do Sino', value: 'praia do sino', distance: 9.0, zone: 'longa' },
  { label: 'São Mateus', value: 'sao mateus', distance: 10.0, zone: 'longa' },
  { label: 'Rosário', value: 'rosario', distance: 11.0, zone: 'longa' },
  { label: 'Peró', value: 'pero', distance: 12.0, zone: 'longa' },
  { label: 'Conde de Modú', value: 'conde de modu', distance: 15.0, zone: 'longa' },
];

const NEIGHBORHOOD_MAP: Record<string, AreaInfo> = Object.fromEntries(
  NEIGHBORHOOD_LIST.map((n) => [n.value, { distance: n.distance, zone: n.zone }])
);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function findNeighborhood(text: string): AreaInfo | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  if (NEIGHBORHOOD_MAP[normalized]) {
    return NEIGHBORHOOD_MAP[normalized];
  }

  for (const [name, info] of Object.entries(NEIGHBORHOOD_MAP)) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return info;
    }
  }
  return null;
}

function feeFromDistance(distance: number): { fee: number; zone: Zone } {
  if (distance <= 2) {
    return { fee: LOCAL_FEE, zone: 'local' };
  }
  if (distance <= 5) {
    return { fee: MEDIA_FEE, zone: 'media' };
  }
  const extraKm = distance - 5;
  return { fee: MEDIA_BASE + extraKm * LONGA_PER_KM, zone: 'longa' };
}

export function calculateDelivery(
  neighborhood: string,
  subtotal: number
): DeliveryCalculation {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return {
      fee: 0,
      distanceKm: 0,
      zone: 'free',
      label: 'Frete grátis (pedido acima de R$ 50,00)',
      freeEligible: true,
    };
  }

  if (!neighborhood.trim()) {
    return {
      fee: 0,
      distanceKm: 0,
      zone: 'unknown',
      label: 'Selecione seu bairro para calcular o frete',
      freeEligible: false,
    };
  }

  const area = findNeighborhood(neighborhood);

  if (!area) {
    return {
      fee: 0,
      distanceKm: 0,
      zone: 'unknown',
      label: 'Bairro não encontrado na lista. Selecione um bairro da lista.',
      freeEligible: false,
    };
  }

  const { fee, zone } = feeFromDistance(area.distance);

  const zoneLabels: Record<Zone, string> = {
    local: 'Entrega local (até 2 km)',
    media: 'Entrega média (2 a 5 km)',
    longa: `Entrega longa (${area.distance.toFixed(1)} km)`,
  };

  return {
    fee,
    distanceKm: area.distance,
    zone,
    label: zoneLabels[zone],
    freeEligible: false,
  };
}

export { ORIGIN_ADDRESS, FREE_DELIVERY_THRESHOLD };
