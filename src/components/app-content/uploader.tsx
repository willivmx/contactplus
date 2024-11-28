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
            accept={"text/csv, text/vcard, text/x-vcard"}
            className={"size-full opacity-0 absolute cursor-pointer"}
            onChange={(e) => {
              setFile(e.target.files?.[0] as File);
            }}
          />
          <div className={"flex flex-col items-center justify-center gap-2"}>
            <FileUp size={42} className={"text-primary"} />
            <span className={"font-bold text-2xl text-neutral-600"}>
              Glisser-déposer votre fichier CSV ici
            </span>
            <span className={"text-neutral-500"}>
              ou cliquez pour sélectionner
            </span>
          </div>
        </>
      ) : (
        <ContactsSummary contacts={file} />
      )}
    </div>
  );
};

export default Uploader;
