"use client";

import React from "react";
import {
  useFieldArray,
  Controller,
  Control,
  FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { DAYS_OF_WEEK_CONST } from "../../../../../schemas/branch.schema";

const DEFAULT_HOURS = "09:00";
const DEFAULT_CLOSE = "18:00";

interface OperatingHoursManagerProps {
  control: Control<any>;
}

export function OperatingHoursManager({ control }: OperatingHoursManagerProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "operatingHours",
  });

  const handleAddHours = () => {
    if (fields.length < 7) {
      append({
        dayOfWeek: fields.length,
        openTime: DEFAULT_HOURS,
        closeTime: DEFAULT_CLOSE,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Operating Hours</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddHours}
          disabled={fields.length >= 7}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Day
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-end gap-3 p-3 bg-muted rounded-lg"
          >
            <div className="shrink-0 min-w-24">
              <Label className="text-xs text-muted-foreground">Day</Label>
              <div className="font-medium text-sm">
                {DAYS_OF_WEEK_CONST[field.dayOfWeek]}
              </div>
            </div>

            <Controller
              control={control}
              name={`operatingHours.${index}.openTime`}
              render={({ field }) => (
                <div className="flex-1">
                  <Label
                    htmlFor={`open-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    Open
                  </Label>
                  <Input
                    id={`open-${index}`}
                    type="time"
                    {...field}
                    className="h-9"
                  />
                </div>
              )}
            />

            <Controller
              control={control}
              name={`operatingHours.${index}.closeTime`}
              render={({ field }) => (
                <div className="flex-1">
                  <Label
                    htmlFor={`close-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    Close
                  </Label>
                  <Input
                    id={`close-${index}`}
                    type="time"
                    {...field}
                    className="h-9"
                  />
                </div>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted rounded-lg">
          No operating hours set yet. Add one to get started.
        </div>
      )}
    </div>
  );
}
