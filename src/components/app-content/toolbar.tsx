"use client";
import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn, Contact } from "@/lib/utils";

const Toolbar = ({
  parsed,
  toEdit,
  search,
  setSearch,
  setFile,
  setNewFile,
}: {
  parsed: Contact[] | null;
  toEdit: Contact[];
  search: string;
  setSearch: (search: string) => void;
  setFile: (file: File | null) => void;
  setNewFile: (file: File | null) => void;
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-6 px-2">
        <span>
          <span className="font-bold">Contacts importés</span>:{" "}
          {parsed?.length ?? 0}
        </span>
        <span>
          <span className="font-bold">Contacts à éditer</span>:{" "}
          {toEdit.length ?? 0}
        </span>
        <div className={"flex justify-start items-center gap-2 ml-12"}>
          <Button
            size={"icon"}
            className={"rounded-full"}
            onClick={() => setFile(null)}
          >
            <RotateCcw size={14} />
          </Button>
          <Button
            size={"icon"}
            className={"rounded-full overflow-hidden relative"}
          >
            <Plus size={14} />
            <Input
              type="file"
              accept={"text/csv, text/vcard, text/x-vcard"}
              className={"absolute opacity-0 cursor-pointer"}
              onChange={(e) => {
                setNewFile(e.target.files?.[0] as File);
              }}
            />
          </Button>
        </div>
      </div>
      <Input
        type="text"
        placeholder="Rechercher un contact"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-1/3 rounded-full hidden lg:block"
      />
    </div>
  );
};

export default Toolbar;
