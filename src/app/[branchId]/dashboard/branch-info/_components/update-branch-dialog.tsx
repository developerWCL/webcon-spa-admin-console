"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Trash2, Upload, ImageIcon, Plus } from "lucide-react";
import {
  UpdateBranchSchema,
  UpdateBranchFormData,
} from "../../../../../schemas/branch.schema";
import { updateBranch } from "@/actions/branch.actions";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { Branch } from "@/types";
import { OperatingHoursManager } from "./operating-hours-manager";

interface UpdateBranchDialogProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateBranch?: () => void;
}

export const UpdateBranchDialog = ({
  branch,
  open,
  onOpenChange,
  onUpdateBranch,
}: UpdateBranchDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [removedMediaIds, setRemovedMediaIds] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);

  const form = useForm<UpdateBranchFormData>({
    resolver: zodResolver(UpdateBranchSchema),
    mode: "onSubmit",
    defaultValues: {
      name: branch?.name || "",
      location: branch?.location || "",
      phone: branch?.phone || "",
      email: branch?.email || "",
      imageUrls: [],
      mediaIds: [],
      operatingHours: [],
    },
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    if (branch && open) {
      reset({
        name: branch.name,
        location: branch.location || "",
        phone: branch.phone || "",
        email: branch.email || "",
        imageUrls: [],
        mediaIds: branch.media?.map((m: any) => m.id) || [],
        operatingHours:
          branch.operatingHours?.map((h: any) => ({
            dayOfWeek: h.dayOfWeek,
            openTime: formatTimeForForm(h.openTime),
            closeTime: formatTimeForForm(h.closeTime),
          })) || [],
      });
      setImageUrls([]);
      setRemovedMediaIds([]);
      setExistingMedia(branch.media || []);
    }
  }, [branch, open, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const MAX_IMAGES = 3;
      const MAX_FILE_SIZE = 500 * 1024;

      if (imageUrls.length + files.length > MAX_IMAGES) {
        toast.error("Image limit exceeded", {
          description: `You can upload a maximum of ${MAX_IMAGES} images. You already have ${imageUrls.length} image(s).`,
        });
        return;
      }

      Array.from(files).forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error("File too large", {
            description: `${file.name} exceeds 500KB limit.`,
          });
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrls([...imageUrls, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const formatTimeForForm = (time: string): string => {
    // Convert HH:mm:ss to HH:mm or keep HH:mm as is
    if (!time) return "";
    return time.substring(0, 5); // Takes first 5 chars (HH:mm)
  };

  const base64ToBlob = (base64String: string): Blob => {
    try {
      const arr = base64String.split(",");
      if (!arr[1]) {
        throw new Error("Invalid base64 string format");
      }
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error("Error converting base64 to blob:", error);
      throw new Error(
        `Failed to process image: ${error instanceof Error ? error.message : "Invalid image data"}`,
      );
    }
  };

  const onSubmit = async (data: UpdateBranchFormData) => {
    if (!branch?.id) return;

    setIsSubmitting(true);
    try {
      // Clean up empty strings to undefined
      const cleanedData: any = {};
      if (data.name) cleanedData.name = data.name;
      if (data.location) cleanedData.location = data.location;
      if (data.phone) cleanedData.phone = data.phone;
      if (data.email) cleanedData.email = data.email;
      if (data.operatingHours && data.operatingHours.length > 0) {
        cleanedData.operatingHours = data.operatingHours;
      }

      // Handle media
      let mediaIds: string[] = [];

      // Keep existing media IDs (excluding removed ones)
      if (existingMedia.length > 0) {
        mediaIds = existingMedia
          .filter((m: any) => !removedMediaIds.includes(m.id))
          .map((m: any) => m.id);
      }

      // Upload new images if any
      if (imageUrls.length > 0) {
        try {
          const imagesToUpload: Array<{
            filename: string;
            mimeType: string;
            size: number;
          }> = [];

          for (let i = 0; i < imageUrls.length; i++) {
            const base64String = imageUrls[i];
            const blob = base64ToBlob(base64String);
            const filename = `branch-image-${i + 1}-${Date.now()}.jpg`;

            imagesToUpload.push({
              filename,
              mimeType: "image/jpeg",
              size: blob.size,
            });
          }

          // Generate presigned URLs
          const uploadUrls = await generateMediaUploadUrls(imagesToUpload);

          if (!uploadUrls || !Array.isArray(uploadUrls)) {
            throw new Error("Invalid response from server");
          }

          // Upload each image to S3
          for (let i = 0; i < imageUrls.length; i++) {
            const base64String = imageUrls[i];
            const blob = base64ToBlob(base64String);
            const uploadUrl = uploadUrls[i];

            if (!uploadUrl || !uploadUrl.url || !uploadUrl.mediaId) {
              throw new Error(`Invalid upload URL received for image ${i + 1}`);
            }

            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const fileArray = Array.from(uint8Array);
            await uploadImageToS3(uploadUrl.url, fileArray, "image/jpeg");
            mediaIds.push(uploadUrl.mediaId);
          }
        } catch (error) {
          console.error("Image upload process error:", error);
          throw error;
        }
      }

      cleanedData.mediaIds = mediaIds;

      const result = await updateBranch(branch.id, cleanedData);

      if (result.success) {
        toast.success("Branch updated successfully");
        onOpenChange(false);
        onUpdateBranch?.();
      } else {
        toast.error(result.error || "Failed to update branch");
      }
    } catch (error) {
      toast.error("An error occurred while updating the branch");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>Update branch information</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>

              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Downtown Branch"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 123 Main St, City"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., +1-234-567-8900"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="e.g., branch@spa.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold">Branch Images</h3>
              <div className="border-2 border-dashed rounded-lg p-6">
                {imageUrls.length > 0 || existingMedia.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Show existing images */}
                      {existingMedia
                        .filter((m: any) => !removedMediaIds.includes(m.id))
                        .map((image: any, index: number) => (
                          <div
                            key={`existing-${index}`}
                            className="relative group"
                          >
                            <img
                              src={image.url}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setRemovedMediaIds([
                                  ...removedMediaIds,
                                  image.id,
                                ])
                              }
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      {/* Show newly uploaded images */}
                      {imageUrls.map((image, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload-multiple"
                      />
                      <label htmlFor="image-upload-multiple">
                        <Button asChild variant="outline" size="sm">
                          <span>
                            <Plus className="h-4 w-4 mr-2" />
                            Add More Images
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload branch images (optional, max 3)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button asChild variant="outline" size="sm">
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Images
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="space-y-4">
              <OperatingHoursManager control={control} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update Branch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
