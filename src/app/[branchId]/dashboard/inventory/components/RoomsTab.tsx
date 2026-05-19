"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { CheckCircle2, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { CreateRoomDialog } from "./CreateRoomDialog";
import { deleteRoom } from "@/actions/rooms.actions";
import { ConfirmDeleteDialog } from "../../../../../components/confirm-delete-dialog";
interface Room {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  amenities: string[];
  floor: number;
  size: string;
  beds: string[];
}

interface RoomsTabProps {
  rooms: Room[];
  onRoomUpdated?: () => void;
}

export function RoomsTab({ rooms, onRoomUpdated }: RoomsTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} onRoomUpdated={onRoomUpdated} />
      ))}
    </div>
  );
}

interface RoomCardProps {
  room: Room;
  onRoomUpdated?: () => void;
}

function RoomCard({ room, onRoomUpdated }: RoomCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const statusConfig = {
    available: { label: "Available", variant: "default" as const },
    occupied: { label: "Occupied", variant: "secondary" as const },
    cleaning: { label: "Cleaning", variant: "outline" as const },
    maintenance: { label: "Maintenance", variant: "destructive" as const },
  };

  const handleDeleteRoom = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRoom(room.id);

      if (result.success) {
        toast.success("Room deleted successfully");
        onRoomUpdated?.();
        setShowDeleteConfirm(false);
      } else {
        toast.error(result.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="line-clamp-1">{room.name}</CardTitle>
            <Badge
              variant={
                statusConfig[room.status as keyof typeof statusConfig]?.variant
              }
            >
              {statusConfig[room.status as keyof typeof statusConfig]?.label}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            {room.type}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Floor</span>
              <span className="font-medium">{room.floor}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">
                {room.capacity} {room.capacity === 1 ? "person" : "people"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{room.size} m²</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beds</span>
              <span className="font-medium">
                {room.beds.length} bed{room.beds.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {room.amenities && room.amenities.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Amenities:
              </div>
              <div className="flex flex-wrap gap-1">
                {room.amenities.slice(0, 3).map((amenity, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setShowEditDialog(true);
              }}
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <CreateRoomDialog
        editRoomId={room.id}
        editRoomData={{
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          floor: String(room.floor),
          size: room.size,
          status: room.status as
            | "available"
            | "occupied"
            | "cleaning"
            | "maintenance",
        }}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onRoomCreate={onRoomUpdated}
      />

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Room"
        description="Are you sure you want to delete"
        itemName={room.name}
        isLoading={isDeleting}
        onConfirm={handleDeleteRoom}
      />
    </>
  );
}
