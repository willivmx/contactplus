import React from "react";
import { Button } from "@/components/ui/button";
const Nav = () => {
  return (
    <div
      className={
        "w-1/3 bg-primary text-secondary p-2 flex justify-between items-center sticky top-6 left-1/2 z-50 -translate-x-1/2 rounded-full hover:-translate-y-0.5 transition-all"
      }
    >
      <span>Logo</span>
      <div className={"flex justify-end items-center gap-2"}>
        <Button
          className={"rounded-full bg-background shadow-md text-foreground"}
        >
          FAQ
        </Button>
        <Button
          variant={"secondary"}
          className={"rounded-full bg-background shadow-md text-foreground"}
        >
          Tuto
        </Button>
      </div>
    </div>
  );
};

export default Nav;
