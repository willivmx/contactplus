import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FormatCFA = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(value);
};

type Meta = { [key: string]: string };
type FieldValue = {
  meta: Meta;
  value: string[];
};
export type Contact = { [key: string]: string | FieldValue[] };

export function parseVCard(input: string): Contact[] {
  const Re1 = /^(version|fn|title|org):(.+)$/i;
  const Re2 = /^([^:;]+);([^:]+):(.+)$/;
  const ReKey = /item\d{1,2}\./;

  const contacts: Contact[] = [];
  let currentContact: Contact = {};
  let insideContact = false;

  input.split(/\r\n|\r|\n/).forEach((line) => {
    // Detect start and end of a contact
    if (line.trim() === "BEGIN:VCARD") {
      insideContact = true;
      currentContact = {};
      return;
    }
    if (line.trim() === "END:VCARD") {
      if (Object.keys(currentContact).length > 0) {
        contacts.push(currentContact);
        currentContact = {};
      }
      insideContact = false;
      return;
    }

    if (insideContact) {
      let results: RegExpMatchArray | null;
      let key: string;

      // Match simple fields like "version", "fn", etc.
      if (Re1.test(line)) {
        results = line.match(Re1);
        if (results) {
          key = results[1].toLowerCase();
          currentContact[key] = results[2].trim(); // Add to the current contact
        }
      } else if (Re2.test(line)) {
        results = line.match(Re2);
        if (results) {
          key = results[1].replace(ReKey, "").toLowerCase();

          const meta: Meta = {};
          results[2].split(";").forEach((p, i) => {
            const match = p.match(/([a-z]+)=(.*)/i);
            if (match) {
              meta[match[1].toLowerCase()] = match[2];
            } else {
              meta[`type${i === 0 ? "" : i}`] = p;
            }
          });

          if (!currentContact[key]) currentContact[key] = [];

          if (Array.isArray(currentContact[key])) {
            (currentContact[key] as FieldValue[]).push({
              meta,
              value: results[3].split(";").map((v) => v.trim()),
            });
          }
        }
      }
    }
  });

  return contacts;
}

export function jsonToVcf(contacts: Contact[]): string {
  const vcfLines: string[] = [];

  contacts.forEach((contact) => {
    vcfLines.push("BEGIN:VCARD");
    vcfLines.push("VERSION:3.0");

    for (const key in contact) {
      const value = contact[key];
      if (typeof value === "string") {
        // Simple fields
        vcfLines.push(`${key.toUpperCase()}:${value}`);
      } else if (Array.isArray(value)) {
        // Fields with metadata and multiple values
        value.forEach((field) => {
          const metaString = Object.entries(field.meta)
            .map(([metaKey, metaValue]) => `${metaKey}=${metaValue}`)
            .join(";");
          const valueString = field.value.join(";");
          vcfLines.push(`${key.toUpperCase()};${metaString}:${valueString}`);
        });
      }
    }

    vcfLines.push("END:VCARD");
  });

  return vcfLines.join("\r\n");
}
