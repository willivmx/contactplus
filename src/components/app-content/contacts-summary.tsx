import React, { useEffect, useState } from "react";
import { Contact, FormatCFA, jsonToVcf, parseVCard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@uidotdev/usehooks";
import Toolbar from "@/components/app-content/toolbar";

const ContactsSummary = ({
  contactsFile,
  setContactsFile,
}: {
  contactsFile: File;
  setContactsFile: React.Dispatch<React.SetStateAction<File | null>>;
}) => {
  const [raw, setRaw] = useState<string>("");
  const [newRaw, setNewRaw] = useState<string>("");
  const [parsed, setParsed] = useState<Contact[] | null>(null);
  const [toEdit, setToEdit] = useState<Contact[]>([]);
  const [toEditCopy, setToEditCopy] = useState<Contact[]>([]);
  const [edited, setEdited] = useState<Contact[]>([]);
  const [search, setSearch] = useState<string>("");
  const debouncedSearchTerm = useDebounce(search, 100);
  const [newFile, setNewFile] = useState<File | null>(null);

  const mergeDuplicates = (contacts: Contact[]): Contact[] => {
    const merged: Record<string, Contact> = {};

    contacts.forEach((contact) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const tel = contact.tel?.[0]?.value?.[0];
      if (tel) {
        if (!merged[tel]) {
          merged[tel] = contact;
        } else {
          merged[tel] = {
            ...merged[tel],
            fn:
              merged[tel].fn && contact.fn
                ? merged[tel].fn.length > contact.fn.length
                  ? merged[tel].fn
                  : contact.fn
                : merged[tel].fn || contact.fn || "",
          };
        }
      }
    });

    return Object.values(merged);
  };

  useEffect(() => {
    if (contactsFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setRaw(fileContent);
      };

      reader.readAsText(contactsFile);
    }
  }, [contactsFile]);

  useEffect(() => {
    if (raw) {
      const parsedContacts = parseVCard(raw);
      setParsed(parsedContacts);
    }
  }, [raw]);

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

      const toExport = finalContacts.map((c) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return { ...c, tel: [{ ...c.tel[0], value: [c.newTel] }] };
      });

      // Fusion des doublons
      const uniqueContacts = mergeDuplicates(finalContacts);

      setToEdit(uniqueContacts);
      setToEditCopy(uniqueContacts);
      setEdited(mergeDuplicates(toExport));
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

  useEffect(() => {
    if (newFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target?.result as string;
        setNewRaw(fileContent);
      };

      reader.readAsText(newFile);
    }
  }, [newFile]);

  useEffect(() => {
    if (newRaw) {
      const parsedContacts = parseVCard(newRaw);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      setParsed([...parsed, ...parsedContacts]);
    }
  }, [newRaw]);

  const billCalculator = () =>
    toEdit.length < 1000 ? 100 : toEdit.length / 10;

  const downloadNewVcf = () => {
    const blob = new Blob([jsonToVcf(edited)], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_update.vcf";
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 size-full p-8 justify-start items-center">
      <div className="bg-background text-sm text-muted-foreground w-full">
        <Toolbar
          parsed={parsed}
          toEdit={toEdit}
          search={search}
          setSearch={setSearch}
          setFile={setContactsFile}
          setNewFile={setNewFile}
        />
      </div>
      <Table>
        <TableHeader className="top-0 left-0 sticky bg-background z-10">
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Ancien numéro</TableHead>
            <TableHead>Nouveau numéro</TableHead>
          </TableRow>
        </TableHeader>
        {toEdit.length > 0 && (
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
        )}
      </Table>
      {toEdit.length === 0 && (
        <div className={"overflow-hidden relative"}>
          <TableCell
            colSpan={6}
            className={
              "text-center font-semibold text-xl text-muted-foreground h-[500px] flex flex-col items-center justify-center gap-10"
            }
          >
            <span>
              Aucun contact à éditer, vous pouvez importer un nouveau fichier de
              contacts en cliquant sur le bouton ci-dessous
            </span>
            <Button className={"rounded-full overflow-hidden relative"}>
              Importer des contacts
              <Input
                type="file"
                accept={"text/vcard, text/x-vcard"}
                className={"absolute opacity-0 cursor-pointer"}
                onChange={(e) => {
                  setContactsFile(e.target.files?.[0] as File);
                }}
              />
            </Button>
          </TableCell>
        </div>
      )}
      {toEdit.length > 0 && (
        <Button
          className="rounded-full w-full lg:w-1/3"
          onClick={downloadNewVcf}
        >
          Payer {FormatCFA(billCalculator())} pour télécharger
        </Button>
      )}
    </div>
  );
};

export default ContactsSummary;
