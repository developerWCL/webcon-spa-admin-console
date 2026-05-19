"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Branch } from "@/types";

interface BranchesTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}

export function BranchesTable({
  branches,
  onEdit,
  onDelete,
}: BranchesTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleEdit = (branch: Branch) => {
    setOpenDropdownId(null);
    onEdit(branch);
  };

  const handleDelete = (branch: Branch) => {
    setOpenDropdownId(null);
    onDelete(branch);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Phone</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold w-12">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{branch.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {branch.location || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {branch.phone || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {branch.email || "-"}
              </TableCell>
              <TableCell>
                <div
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    branch.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {branch.isActive ? "Active" : "Inactive"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu
                  open={openDropdownId === branch.id}
                  onOpenChange={(open) =>
                    setOpenDropdownId(open ? branch.id : null)
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 inline-flex items-center justify-center"
                    >
                      <MoreHorizontal className="h-4 w-4 flex-shrink-0" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleEdit(branch)}
                      className="cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(branch)}
                      className="cursor-pointer text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
