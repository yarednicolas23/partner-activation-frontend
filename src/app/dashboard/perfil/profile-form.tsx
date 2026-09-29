"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import type { PartnerProfile } from "@/lib/types";
import { BRAZIL_STATES, formatCep, formatPhone, onlyDigits } from "@/lib/address";

type Status = "idle" | "saving" | "saved" | "error";
type CepStatus = "idle" | "loading" | "not-found" | "error";

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-canvas disabled:text-ink-muted";

export function ProfileForm({
  profile,
  returnTo,
}: {
  profile: PartnerProfile;
  returnTo?: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: profile.full_name ?? "",
    companyName: profile.company_name ?? "",
    phone: formatPhone(profile.phone ?? ""),
    addressCep: formatCep(profile.address_cep ?? ""),
    addressStreet: profile.address_street ?? "",
    addressNumber: profile.address_number ?? "",
    addressComplement: profile.address_complement ?? "",
    addressNeighborhood: profile.address_neighborhood ?? "",
    addressCity: profile.address_city ?? "",
    addressState: profile.address_state ?? "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    if (status === "saved") setStatus("idle");
  }

  // Autocompleta logradouro/bairro/cidade/UF pelo CEP (ViaCEP, serviço
  // público brasileiro). Número e complemento ficam por conta do parceiro.
  async function lookupCep(cep: string) {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;

    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as ViaCepResponse;
      if (!res.ok || data.erro) {
        setCepStatus("not-found");
        return;
      }
      setForm((current) => ({
        ...current,
        addressStreet: data.logradouro || current.addressStreet,
        addressNeighborhood: data.bairro || current.addressNeighborhood,
        addressCity: data.localidade || current.addressCity,
        addressState: data.uf || current.addressState,
      }));
      setCepStatus("idle");
    } catch {
      setCepStatus("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        phone: onlyDigits(form.phone),
        addressCep: onlyDigits(form.addressCep),
      }),
    });

    if (res.ok) {
      setStatus("saved");
      router.refresh();
      return;
    }

    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
    setErrorMessage(res.status === 400 && message ? message : null);
    setStatus("error");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-base font-semibold text-ink">Dados pessoais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" htmlFor="fullName" className="sm:col-span-2">
            <input
              id="fullName"
              required
              minLength={2}
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="E-mail" htmlFor="email">
            <input id="email" type="email" value={profile.email} disabled className={inputClass} />
          </Field>
          <Field label="Telefone" htmlFor="phone" hint="Usado pela transportadora para contato.">
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(11) 91234-5678"
              pattern="\(\d{2}\) \d{4,5}-\d{4}"
              title="Informe DDD + número"
              value={form.phone}
              onChange={(e) => set("phone", formatPhone(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Empresa" htmlFor="companyName" optional className="sm:col-span-2">
            <input
              id="companyName"
              autoComplete="organization"
              value={form.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section id="endereco" className="scroll-mt-32 rounded-2xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold text-ink">Endereço de entrega</h2>
        <p className="mb-4 text-sm text-ink-muted">
          Para onde enviaremos suas recompensas físicas.
        </p>
        <div className="grid gap-4 sm:grid-cols-6">
          <Field label="CEP" htmlFor="addressCep" className="sm:col-span-2">
            <input
              id="addressCep"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              pattern="\d{5}-\d{3}"
              title="CEP com 8 dígitos"
              value={form.addressCep}
              onChange={(e) => {
                const cep = formatCep(e.target.value);
                set("addressCep", cep);
                setCepStatus("idle");
                if (onlyDigits(cep).length === 8) lookupCep(cep);
              }}
              className={inputClass}
            />
          </Field>
          <div className="flex items-end pb-2.5 text-xs sm:col-span-4">
            {cepStatus === "loading" && <span className="text-ink-muted">Buscando endereço...</span>}
            {cepStatus === "not-found" && (
              <span className="text-pastel-red-text">CEP não encontrado. Preencha o endereço manualmente.</span>
            )}
            {cepStatus === "error" && (
              <span className="text-ink-muted">Não foi possível buscar o CEP. Preencha manualmente.</span>
            )}
            {cepStatus === "idle" && (
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noreferrer"
                className="text-ink-muted underline hover:text-ink"
              >
                Não sei meu CEP
              </a>
            )}
          </div>

          <Field label="Logradouro" htmlFor="addressStreet" className="sm:col-span-4">
            <input
              id="addressStreet"
              required
              autoComplete="address-line1"
              placeholder="Rua, avenida..."
              value={form.addressStreet}
              onChange={(e) => set("addressStreet", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Número" htmlFor="addressNumber" className="sm:col-span-2">
            <input
              id="addressNumber"
              required
              placeholder="123 ou S/N"
              value={form.addressNumber}
              onChange={(e) => set("addressNumber", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Complemento" htmlFor="addressComplement" optional className="sm:col-span-3">
            <input
              id="addressComplement"
              autoComplete="address-line2"
              placeholder="Apto, bloco, sala..."
              value={form.addressComplement}
              onChange={(e) => set("addressComplement", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Bairro" htmlFor="addressNeighborhood" className="sm:col-span-3">
            <input
              id="addressNeighborhood"
              required
              value={form.addressNeighborhood}
              onChange={(e) => set("addressNeighborhood", e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Cidade" htmlFor="addressCity" className="sm:col-span-4">
            <input
              id="addressCity"
              required
              autoComplete="address-level2"
              value={form.addressCity}
              onChange={(e) => set("addressCity", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="UF" htmlFor="addressState" className="sm:col-span-2">
            <select
              id="addressState"
              required
              autoComplete="address-level1"
              value={form.addressState}
              onChange={(e) => set("addressState", e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Selecione
              </option>
              {BRAZIL_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {status === "saved" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-pastel-green-bg px-4 py-3 text-sm text-pastel-green-text">
          <span>Perfil salvo com sucesso.</span>
          {returnTo && (
            <Link href={returnTo} className="font-semibold underline">
              Voltar para recompensas →
            </Link>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-pastel-red-text">
          {errorMessage ?? "Não foi possível salvar. Tente novamente."}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "saving" ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactElement<InputHTMLAttributes<HTMLInputElement>>;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {optional && <span className="font-normal text-ink-muted">(opcional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
