import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { generateAnnex3, generateAnnex6, Gen3Data, Gen6Data } from "@/lib/generator";

/**
 * Hook for generating and downloading Anexa 3 (fișa descriptivă)
 */
export function useAnexa3() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (data: Gen3Data) => {
    try {
      setIsGenerating(true);
      
      await generateAnnex3(data);
      
      toast({
        title: "Succes",
        description: "Fișa descriptivă a fost generată și descărcată cu succes.",
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la generarea fișei descriptive.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateDocument,
  };
}

/**
 * Hook for generating and downloading Anexa 6 (fișa de evaluare)
 */
export function useAnexa6() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDocument = async (data: Gen6Data) => {
    try {
      setIsGenerating(true);
      
      await generateAnnex6(data);
      
      toast({
        title: "Succes",
        description: "Fișa de evaluare a fost generată și descărcată cu succes.",
      });
    } catch (error) {
      console.error("Error generating evaluation document:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la generarea fișei de evaluare.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateDocument,
  };
}
