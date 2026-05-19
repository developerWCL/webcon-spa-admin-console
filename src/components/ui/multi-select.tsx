import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMemo } from "react";

interface MultiSelectItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface MultiSelectProps {
  items: MultiSelectItem[];
  disableItems?: string[]; // Optional array of item IDs to disable
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function MultiSelect({
  items,
  selectedIds,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  disableItems = [],
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const filteredItems = items.filter((item) => {
    return (
      !selectedIds.includes(item.id) &&
      item.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  const handleSelect = (itemId: string) => {
    onSelectionChange([...selectedIds, itemId]);
    setSearchValue("");
  };

  const handleRemove = (itemId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== itemId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white"
        >
          <div className="flex items-center gap-2 flex-wrap">
            {selectedItems.length > 0 ? (
              <>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {selectedItems.length} selected
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-2xl p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {selectedItems.length === 0 &&
              filteredItems.length === 0 &&
              items.length === 0 && <CommandEmpty>{emptyMessage}</CommandEmpty>}

            {selectedItems.length > 0 && (
              <CommandGroup heading="Selected">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                  >
                    <span className="text-sm">{item.name}</span>
                    {disableItems.includes(item.id) ? (
                      <span className="ml-2 inline-flex items-center justify-center rounded bg-gray-200 text-gray-500 cursor-not-allowed text-xs px-1">
                        default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="ml-2 inline-flex items-center justify-center rounded hover:bg-red-100"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                ))}
              </CommandGroup>
            )}

            {filteredItems.length > 0 ? (
              <CommandGroup heading="Available">
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.id)}
                  >
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              searchValue &&
              items.length > 0 && (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No {emptyMessage.toLowerCase()} matching "{searchValue}"
                </div>
              )
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
