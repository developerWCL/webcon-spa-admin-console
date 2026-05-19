"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Bed, CheckCircle2, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { CreateBedDialog } from "./CreateBedDialog";
import { ConfirmDeleteDialog } from "../../../../../components/confirm-delete-dialog";
import { toast } from "sonner";
import { deleteBed } from "@/actions/beds.actions";

export interface Bed {
  id: string;
  name: string;
  bedId: string;
  type: string;
  status: string;
  room?: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    floor: string;
    size: string;
    status: string;
  };
}

const statusConfig = {
  available: {
    label: "Available",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600",
  },
  occupied: {
    label: "Occupied",
    variant: "secondary" as const,
    icon: Users,
    color: "text-blue-600",
  },
  cleaning: {
    label: "Cleaning",
    variant: "outline" as const,
    icon: XCircle,
    color: "text-yellow-600",
  },
  maintenance: {
    label: "Maintenance",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

interface RoomOption {
  id: string;
  name: string;
  type: string;
}

interface BedsTabProps {
  beds: Bed[];
  rooms: RoomOption[];
  onBedUpdated?: () => void;
}

export function BedsTab({ beds, rooms, onBedUpdated }: BedsTabProps) {
  const [editBed, setEditBed] = useState<Bed | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteBed = async () => {
    if (!editBed) return;
    setIsDeleting(true);
    try {
      const result = await deleteBed(editBed.id);

      if (result.success) {
        toast.success("Bed deleted successfully");
        onBedUpdated?.();
        setShowDeleteConfirm(false);
      } else {
        toast.error(result.error || "Failed to delete room");
      }
    } catch (error) {
      // Handle error case
      setIsDeleting(false);
      toast.error("Failed to delete bed. Please try again.");
    }
  };
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {beds.map((bed) => (
          <Card key={bed.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Bed className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="line-clamp-1">{bed.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {bed.type}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant={
                    statusConfig[bed.status as keyof typeof statusConfig]
                      ?.variant
                  }
                >
                  {statusConfig[bed.status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Assigned Room</span>
                  <span className="font-medium">{bed.room?.name || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bed ID</span>
                  <span className="font-medium">{bed.bedId || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Standalone</span>
                  <span className="font-medium">
                    {!bed.room ? (
                      <Badge variant="outline" className="text-xs">
                        Standalone
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setEditBed(bed);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setEditBed(bed);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateBedDialog
        rooms={rooms}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={
          editBed
            ? {
                name: editBed.name,
                bedId: editBed.bedId,
                type: editBed.type as "bed" | "chair",
                roomId: editBed.room?.id || "",
              }
            : undefined
        }
        editBedId={editBed?.id}
        onBedCreate={() => {
          setEditBed(null);
          setDialogOpen(false);
          if (onBedUpdated) onBedUpdated();
        }}
      />

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Bed"
        description="Are you sure you want to delete this bed?"
        itemName={editBed?.name}
        isLoading={isDeleting}
        onConfirm={handleDeleteBed}
      />
    </>
  );
}
