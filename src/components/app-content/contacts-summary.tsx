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
import { FedaPay, Transaction } from "fedapay";
import { Loader2 } from "lucide-react";

type SanitizedContact = {
  fn: string;
  tel: string;
  newTel: string;
};

const PricePerContact = 0.6;

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
  const [transactionStatus, setTransactionStatus] = useState<string>("");
  const [checkoutIsProcessing, setCheckoutIsProcessing] =
    useState<boolean>(false);
  const [sanitizedContacts, setSanitizedContacts] = useState<
    SanitizedContact[]
  >([]);

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

  // Fonction améliorée pour décoder le quoted-printable
  const decodeQuotedPrintable = (encodedStr: string): string => {
    // Décoder le format quoted-printable en utilisant une expression régulière
    let decodedStr = encodedStr.replace(/=([0-9A-F]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16)); // Convertir chaque valeur hexadécimale
    });

    // Maintenant, nous avons besoin de s'assurer que les caractères accentués sont décodés correctement
    try {
      // Essayer de convertir en UTF-8 si nécessaire
      decodedStr = decodeURIComponent(escape(decodedStr)); // Utiliser escape() et decodeURIComponent() pour convertir correctement
    } catch (e) {
      console.error("Erreur lors du décodage des accents :", e);
      // Si l'encodage échoue, retourner le texte d'origine
    }

    return decodedStr;
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

        // Decode quoted-printable encoding for contact.fn
        if (contact.fn && Array.isArray(contact.fn)) {
          contact.fn = contact.fn
            .map((fnObj) => {
              if (fnObj.value && fnObj.value[0]) {
                return decodeQuotedPrintable(fnObj.value[0]); // Decode the quoted-printable string
              }
              return fnObj.value[0] || "";
            })
            .join(" ");
        }

        // Handle phone number formatting (same as previous logic)
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

      setSanitizedContacts(
        uniqueContacts.map((c) => ({
          fn: (c.fn || "") as string,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          tel: c.tel[0].value[0] as string,
          newTel: c.newTel as string,
        })),
      );

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
    toEdit.length * PricePerContact < 100
      ? 100
      : Math.ceil(toEdit.length * PricePerContact);

  const downloadNewVcf = () => {
    const blob = new Blob([jsonToVcf(edited)], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contacts_update.vcf";
    link.click();
  };

  const checkTransactionStatus = async (id: string) => {
    const transaction = await Transaction.retrieve(id);
    return await transaction.status;
  };

  const handleCheckout = async () => {
    setCheckoutIsProcessing(true);
    FedaPay.setApiKey("sk_live_si3_RcLs2wwEqX_uvokJ4Drm");
    FedaPay.setEnvironment("live");
    const transaction = await Transaction.create({
      amount: billCalculator(),
      currency: { iso: "XOF" },
      description: "Contact Plus",
    });

    return await transaction
      .generateToken()
      .then(async (token) => {
        const newWindow = window.open(
          token.url,
          "_blank",
          "width=800,height=600",
        );
        if (newWindow) {
          newWindow.focus();
        }

        const intervalId = setInterval(async () => {
          const status = await checkTransactionStatus(transaction.id);
          if (status !== "pending") {
            clearInterval(intervalId);
            setTransactionStatus(status);
          }
        }, 3000);
      })
      .finally(() => setCheckoutIsProcessing(false));
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
            {sanitizedContacts.map((contact, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{contact.fn}</TableCell>
                <TableCell>{contact.tel}</TableCell>
                <TableCell>{contact.newTel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
      {toEdit.length === 0 && (
        <div className={"overflow-hidden relative"}>
          <div
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
          </div>
        </div>
      )}
      {toEdit.length > 0 && (
        <Button
          className="rounded-full w-full lg:w-1/3"
          onClick={async () => {
            if (transactionStatus === "approved") {
              downloadNewVcf();
            } else {
              await handleCheckout();
            }
          }}
          disabled={checkoutIsProcessing}
        >
          {checkoutIsProcessing ? (
            <Loader2 size={18} className={"animate-spin"} />
          ) : transactionStatus === "approved" ? (
            "Télécharger le fichier"
          ) : (
            `Payer ${FormatCFA(billCalculator())} pour télécharger`
          )}
        </Button>
      )}
    </div>
  );
};

export default ContactsSummary;
