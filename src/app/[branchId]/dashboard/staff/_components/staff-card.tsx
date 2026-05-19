"use client";

import { useState, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Edit,
  Eye,
  MoreVertical,
  Trash2,
  Mail,
  Calendar,
} from "lucide-react";
import type { Staff as StaffMember } from "@/types";
import { useSession } from "next-auth/react";

interface StaffCardProps {
  member: StaffMember;
  onViewDetails: (member: StaffMember) => void;
  onEdit: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
}

export function StaffCard({
  member,
  onViewDetails,
  onEdit,
  onDelete,
}: StaffCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session } = useSession();
  const handleViewDetails = useCallback(() => {
    setDropdownOpen(false);
    setTimeout(() => {
      onViewDetails(member);
    }, 0);
  }, [member, onViewDetails]);

  const handleEdit = useCallback(() => {
    setDropdownOpen(false);
    setTimeout(() => {
      onEdit(member);
    }, 0);
  }, [member, onEdit]);

  const handleDelete = useCallback(() => {
    setDropdownOpen(false);
    setTimeout(() => {
      onDelete(member);
    }, 0);
  }, [member, onDelete]);

  const isCurrentUser = useMemo(() => {
    return session?.user?.email === member.email;
  }, [session, member]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {member.firstName} {member.lastName}
            </CardTitle>
            <CardDescription className="text-xs">
              {member.email}
            </CardDescription>
          </div>
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{"Actions"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                {"View Details"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                {"Edit Profile"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleDelete}
                disabled={isCurrentUser}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {"Remove Staff"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant={member.isActive ? "default" : "outline"}>
          {member.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              Joined {new Date(member.createdAt || "").toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
