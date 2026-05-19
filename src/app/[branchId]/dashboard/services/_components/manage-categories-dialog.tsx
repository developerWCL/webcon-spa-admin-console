"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tag, MoreVertical } from "lucide-react";
import { ServiceCategory } from "@/types";

interface ManageCategoriesDialogProps {
  categories: ServiceCategory[];
  onAddCategory: (data: { name: string; description: string }) => void;
}

export const ManageCategoriesDialog = ({
  categories,
  onAddCategory,
}: ManageCategoriesDialogProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [categoryData, setCategoryData] = useState({
    name: "",
    description: "",
  });

  const handleAddCategory = () => {
    onAddCategory(categoryData);
    setCategoryData({ name: "", description: "" });
    setOpenDialog(false);
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hidden">
          <Tag className="h-4 w-4 mr-2" />
          Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Service Categories</DialogTitle>
          <DialogDescription>
            Create and manage service categories with descriptions
          </DialogDescription>
        </DialogHeader>

        {/* Categories List */}
        <div className="space-y-4 my-6">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Category Form */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Add New Category</h3>
          <div className="space-y-3">
            <div>
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Hair Treatment"
                value={categoryData.name}
                onChange={(e) =>
                  setCategoryData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of this service category"
                value={categoryData.description}
                onChange={(e) =>
                  setCategoryData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="h-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddCategory}>Add Category</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
