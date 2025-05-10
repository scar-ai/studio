"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageInput from "./ImageInput";
import PdfInput from "./PdfInput";
import TextInput from "./TextInput";
import type { GenerationResult } from '@/app/page'; // Updated import
import { Image as ImageIcon, FileText, Type } from 'lucide-react';

interface InputAreaProps {
  onFlashcardsGenerated: (result: GenerationResult) => void; // Updated type
  setIsLoading: (isLoading: boolean) => void;
  isLoading: boolean;
}

export default function InputArea({ onFlashcardsGenerated, setIsLoading, isLoading }: InputAreaProps) {
  return (
    <section aria-labelledby="input-method-title">
      <div className="text-center mb-6">
        <h2 id="input-method-title" className="text-2xl font-semibold text-foreground">Create Your Flashcards</h2>
        <p className="text-muted-foreground">Choose your preferred method to generate study cards.</p>
      </div>
      <Tabs defaultValue="text" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-primary/20 p-1 h-auto rounded-lg">
          <TabsTrigger value="image" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2">
            <ImageIcon className="h-5 w-5" /> Image
          </TabsTrigger>
          <TabsTrigger value="pdf" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" /> PDF
          </TabsTrigger>
          <TabsTrigger value="text" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md flex items-center justify-center gap-2">
            <Type className="h-5 w-5" /> Text
          </TabsTrigger>
        </TabsList>
        <TabsContent value="image" className="mt-4">
          <ImageInput onFlashcardsGenerated={onFlashcardsGenerated} setIsLoading={setIsLoading} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="pdf" className="mt-4">
          <PdfInput onFlashcardsGenerated={onFlashcardsGenerated} setIsLoading={setIsLoading} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="text" className="mt-4">
          <TextInput onFlashcardsGenerated={onFlashcardsGenerated} setIsLoading={setIsLoading} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </section>
  );
}