import React, { useEffect, useState } from "react";
import { Contact, FormatCFA, parseVCard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@uidotdev/usehooks";

const ContactsSummary = ({ contacts }: { contacts: File }) => {
  const [raw, setRaw] = useState<string>("");
  const [parsed, setParsed] = useState<Contact[] | null>(null);
  const [toEdit, setToEdit] = useState<Contact[]>([]);
  const [toEditCopy, setToEditCopy] = useState<Contact[]>([]);
  const [search, setSearch] = useState<string>("");
  const debouncedSearchTerm = useDebounce(search, 100);

  // Charger le contenu du fichier
  useEffect(() => {
    if (contacts) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setRaw(fileContent);
      };

      reader.readAsText(contacts);
    }
  }, [contacts]);

  // Parser les données VCARD
  useEffect(() => {
    if (raw) {
      const parsedContacts = parseVCard(raw);
      setParsed(parsedContacts);
    }
  }, [raw]);

  // Préparer les contacts à éditer
  useEffect(() => {
    if (parsed) {
      const editedContacts = parsed.map((c) => {
        const contact = { ...c };

        if (contact.tel?.length) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const tel = contact.tel[0]?.value[0]?.replace(/ /g, "");
          if (tel && !tel.startsWith("+") && tel.length === 8) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            contact.tel[0].value[0] = `+229${tel}`;
          }
        }

        return contact;
      });

      const validContacts = editedContacts.filter(
        (c) =>
          c.tel &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          c.tel[0]?.value[0]?.startsWith("+229") &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          c.tel[0]?.value[0]?.length === 12,
      );

      const finalContacts = validContacts.map((c) => ({
        ...c,
        newTel:
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          c.tel[0].value[0].slice(0, 4) + "01" + c.tel[0].value[0].slice(4),
      }));

      setToEdit(finalContacts);
      setToEditCopy(finalContacts);
    }
  }, [parsed]);

  // Débouncer la recherche
  useEffect(() => {
    if (debouncedSearchTerm) {
      setToEditCopy(
        toEdit.filter((contact) => {
          const nameMatch = contact.fn
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const telMatch = contact.tel?.some((t) =>
            t.value[0]
              ?.toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()),
          );

          return nameMatch || telMatch;
        }),
      );
    } else {
      setToEditCopy(toEdit);
    }
  }, [debouncedSearchTerm, toEdit]);

  // Calculer le montant à payer
  const billCalculator = () =>
    toEdit.length < 1000 ? 100 : toEdit.length / 10;

  return (
    <div className="flex flex-col gap-12 size-full p-8 justify-between items-center">
      <Table className="caption-top">
        <TableCaption className="top-0 left-0 sticky bg-background z-10">
          <div className="flex justify-between items-center pb-4">
            <div className="flex gap-4 px-2">
              <span>
                <span className="font-bold">Contacts importés</span>:{" "}
                {parsed?.length ?? 0}
              </span>
              <span>
                <span className="font-bold">Contacts à éditer</span>:{" "}
                {toEdit.length ?? 0}
              </span>
            </div>
            <Input
              type="text"
              placeholder="Rechercher un contact"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-1/3 rounded-full hidden lg:block"
            />
          </div>
        </TableCaption>
        <TableHeader className="top-12 left-0 sticky bg-background z-10">
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Ancien numéro</TableHead>
            <TableHead>Nouveau numéro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {toEditCopy.map((contact, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                {contact.fn as string}
              </TableCell>
              <TableCell>
                {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  contact.tel?.[0]?.value[0]
                }
              </TableCell>
              <TableCell>{contact.newTel as string}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button className="rounded-full w-full lg:w-1/3">
        Payer {FormatCFA(billCalculator())}
      </Button>
    </div>
  );
};

export default ContactsSummary;
