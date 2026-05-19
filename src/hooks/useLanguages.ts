import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getActiveLanguages, type Language } from "@/actions/language.actions";

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      setIsLoading(true);
      try {
        const fetchedLanguages = await getActiveLanguages();

        setLanguages(fetchedLanguages);
      } catch (error) {
        console.error("Failed to load languages:", error);
        toast.error("Failed to load languages");
        // Set fallback languages
        setLanguages([
          {
            id: "default-en",
            code: "en",
            name: "English",
            isPrimary: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "default-th",
            code: "th",
            name: "Thai",
            isPrimary: false,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, isLoading };
};
