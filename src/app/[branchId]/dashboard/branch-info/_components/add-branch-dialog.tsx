"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Loader2, Trash2, Upload, ImageIcon } from "lucide-react";
import {
  CreateBranchSchema,
  CreateBranchFormData,
} from "../../../../../schemas/branch.schema";
import { createBranch } from "@/actions/branch.actions";
import {
  generateMediaUploadUrls,
  uploadImageToS3,
} from "@/actions/media.actions";
import { OperatingHoursManager } from "./operating-hours-manager";

interface AddBranchDialogProps {
  branchId?: string;
  spaId: string;
  onAddBranch?: (data: CreateBranchFormData) => void;
}

export const AddBranchDialog = ({
  spaId,
  onAddBranch,
}: AddBranchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const form = useForm<CreateBranchFormData>({
    resolver: zodResolver(CreateBranchSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      spaId: spaId,
      location: "",
      phone: "",
      email: "",
      imageUrls: [],
      mediaIds: [],
      operatingHours: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = form;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const MAX_IMAGES = 3;
      const MAX_FILE_SIZE = 500 * 1024; // 500 KB

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

  const onSubmit = async (data: CreateBranchFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up empty strings to undefined
      const cleanedData: any = {
        name: data.name,
        spaId: data.spaId,
      };
      if (data.location) cleanedData.location = data.location;
      if (data.phone) cleanedData.phone = data.phone;
      if (data.email) cleanedData.email = data.email;
      if (data.operatingHours && data.operatingHours.length > 0) {
        cleanedData.operatingHours = data.operatingHours;
      }

      // Upload images if any
      let mediaIds: string[] = [];
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
            await uploadImageToS3(uploadUrl.url, arrayBuffer, "image/jpeg");
            mediaIds.push(uploadUrl.mediaId);
          }
        } catch (error) {
          console.error("Image upload process error:", error);
          throw error;
        }
      }

      cleanedData.mediaIds = mediaIds;

      const result = await createBranch(cleanedData);

      if (result.success) {
        toast.success("Branch created successfully");
        reset();
        setImageUrls([]);
        setOpen(false);
        onAddBranch?.(data);
      } else {
        toast.error(result.error || "Failed to create branch");
      }
    } catch (error) {
      toast.error("An error occurred while creating the branch");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
          <DialogDescription>
            Add a new branch location for your spa
          </DialogDescription>
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
                    <FormLabel>Branch Name *</FormLabel>
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
                {imageUrls.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {imageUrls.map((image, index) => (
                        <div key={index} className="relative group">
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
                onClick={() => {
                  setOpen(false);
                  reset();
                  setImageUrls([]);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Branch
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
