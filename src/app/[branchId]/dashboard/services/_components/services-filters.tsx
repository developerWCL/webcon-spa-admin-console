"use client";

import React from "react";
import { Search, FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

interface ServicesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: ServiceCategory[];
  setCurrentPage?: (page: number) => void; // Optional prop for resetting pagination
  onItemsPerPageChange?: (limit: number) => void; // Optional prop for resetting items per page
}

export const ServicesFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  setCurrentPage,
  onItemsPerPageChange,
}: ServicesFiltersProps) => {
  const handleReset = () => {
    onSearchChange("");
    onCategoryChange("all");
    setCurrentPage && setCurrentPage(1);
    onItemsPerPageChange && onItemsPerPageChange(10);
  };

  return (
    <div className="flex gap-4 items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setCurrentPage && setCurrentPage(1);
          }}
        />
      </div>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="icon" onClick={handleReset}>
        <FilterX className="w-4 h-4" />
      </Button>
    </div>
  );
};
