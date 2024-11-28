"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import ContactsSummary from "@/components/app-content/contacts-summary";

const Uploader = () => {
  const [file, setFile] = React.useState<File | null>(null);
  return (
    <div
      className={
        "flex flex-col items-center justify-center size-full border-2 border-dashed border-primary rounded-xl "
      }
    >
      {!file ? (
        <>
          <input
            type={"file"}
            accept={"text/vcard, text/x-vcard"}
            className={"size-full opacity-0 absolute"}
            onChange={(e) => {
              setFile(e.target.files?.[0] as File);
            }}
          />
          <div className={"flex flex-col items-center justify-center gap-2"}>
            <FileUp size={42} className={"text-neutral-600"} />
            <span className={"font-bold text-2xl text-neutral-600"}>
              Glisser-déposer votre fichier VCF ici
            </span>
            <span className={"text-neutral-500"}>
              ou cliquez pour sélectionner
            </span>
            <span
              className={
                "text-primary text-sm font-semibold underline underline-offset-2 z-[10] cursor-pointer"
              }
            >
              Comment importer mes contacts ?
            </span>
          </div>
        </>
      ) : (
        <ContactsSummary contactsFile={file} setContactsFile={setFile} />
      )}
    </div>
  );
};

export default Uploader;
