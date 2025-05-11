// src/components/cardify/SaveDeckDialog.tsx
"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveDeckDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (deckName: string) => void;
  defaultName?: string;
  isSaving: boolean;
}

export default function SaveDeckDialog({
  isOpen,
  onOpenChange,
  onSave,
  defaultName = "",
  isSaving,
}: SaveDeckDialogProps) {
  const [deckName, setDeckName] = useState(defaultName);

  React.useEffect(() => {
    if (isOpen) {
      setDeckName(defaultName || `My New Deck ${new Date().toLocaleDateString()}`);
    }
  }, [isOpen, defaultName]);

  const handleSave = () => {
    if (deckName.trim()) {
      onSave(deckName.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Flashcard Deck</DialogTitle>
          <DialogDescription>
            Enter a name for your new deck. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deck-name" className="text-right">
              Name
            </Label>
            <Input
              id="deck-name"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isSaving || !deckName.trim()}>
            {isSaving ? "Saving..." : "Save Deck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
