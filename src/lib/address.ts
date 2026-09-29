import type { PartnerProfile, ShippingAddress } from "./types";

// Espejo de BRAZIL_STATES en backend/src/partners/dto/update-profile.dto.ts
export const BRAZIL_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE",
  "TO",
] as const;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  // Celular (9 dígitos) → 5+4; fixo (8 dígitos) → 4+4.
  const split = rest.length > 8 ? 5 : 4;
  return rest.length > split
    ? `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`
    : `(${ddd}) ${rest}`;
}

/** Mesmo critério do backend: complemento é o único campo opcional. */
export function shippingAddressFromProfile(
  profile: PartnerProfile,
): ShippingAddress | null {
  const {
    address_cep: cep,
    address_street: street,
    address_number: number,
    address_neighborhood: neighborhood,
    address_city: city,
    address_state: state,
  } = profile;

  if (!cep || !street || !number || !neighborhood || !city || !state) return null;

  return {
    recipient_name: profile.full_name,
    phone: profile.phone,
    cep,
    street,
    number,
    complement: profile.address_complement,
    neighborhood,
    city,
    state,
  };
}

/** Linhas no formato de etiqueta dos Correios. */
export function addressLines(address: ShippingAddress): string[] {
  return [
    `${address.street}, ${address.number}${address.complement ? ` — ${address.complement}` : ""}`,
    address.neighborhood,
    `${address.city} — ${address.state}`,
    `CEP ${formatCep(address.cep)}`,
  ];
}
