"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceData {
  id: string;
  name: string;
  duration?: string;
  service?: { name: string };
  onlyPackage?: boolean;
}

interface ServiceSelectionCardProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  selectedServiceId: string;
  onServiceSelect: (serviceId: string) => void;
  onAddService: () => void;
  treatments: ServiceData[];
  packages: ServiceData[];
  programmes: ServiceData[];
  isLoading: boolean;
  serviceSearchOpen: boolean;
  onServiceSearchOpenChange: (open: boolean) => void;
}

export function ServiceSelectionCard({
  selectedTab,
  onTabChange,
  selectedServiceId,
  onServiceSelect,
  onAddService,
  treatments,
  packages,
  programmes,
  isLoading,
  serviceSearchOpen,
  onServiceSearchOpenChange,
}: ServiceSelectionCardProps) {
  const dataSource =
    selectedTab === "treatments"
      ? treatments.filter(
          (t) => t.service?.name !== "PACKAGE ONLY" && !t.onlyPackage,
        )
      : selectedTab === "packages"
        ? packages
        : programmes;

  const serviceLabel = selectedTab.slice(0, -1);

  const getSelectedServiceName = (): string => {
    if (!selectedServiceId) {
      return `Select a ${serviceLabel}`;
    }
    const service = dataSource.find((s) => s.id === selectedServiceId);
    if (selectedTab === "treatments") {
      return `${service?.name} (${service?.service?.name || "N/A"})`;
    }
    return service?.name || `Select a ${serviceLabel}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Services</CardTitle>
        <CardDescription>
          Select and add services to this booking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={selectedTab}
          onValueChange={onTabChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="programmes">Programmes</TabsTrigger>
          </TabsList>
          <TabsContent value={selectedTab}>
            <div className="flex gap-2">
              <Popover
                open={serviceSearchOpen}
                onOpenChange={onServiceSearchOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={serviceSearchOpen}
                    className="flex-1 justify-between"
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : getSelectedServiceName()}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                    >
                      <path d="m7 15 5 5 5-5"></path>
                      <path d="m7 9 5-5 5 5"></path>
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-162 p-0" align="start">
                  <Command
                    filter={(value, search) => {
                      const service = dataSource.find(
                        (s) => s.id === value || s.serviceId === value,
                      );

                      if (!service) return false;

                      // 2. Reconstruct the searchable name exactly as it appears in your UI
                      const displayName =
                        selectedTab === "treatments"
                          ? `${service.name} (${service?.service?.name || "N/A"})`
                          : service.name;

                      // 3. Perform the case-insensitive search on the name, not the ID
                      return displayName
                        .toLowerCase()
                        .includes(search.toLowerCase());
                    }}
                  >
                    <CommandInput placeholder={`Search ${serviceLabel}s...`} />
                    <CommandList>
                      <CommandEmpty>No {serviceLabel} found.</CommandEmpty>
                      <CommandGroup>
                        {dataSource.map((service) => (
                          <CommandItem
                            key={service.id}
                            value={service.id}
                            onSelect={(currentValue) => {
                              onServiceSelect(
                                currentValue === selectedServiceId
                                  ? ""
                                  : currentValue,
                              );
                              onServiceSearchOpenChange(false);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`mr-2 h-4 w-4 ${
                                selectedServiceId === service.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <div className="flex justify-between items-center w-full">
                              <div>
                                {selectedTab === "treatments"
                                  ? `${service.name} (${service?.service?.name || "N/A"})`
                                  : service.name}
                              </div>
                              {service.duration && (
                                <div className="text-xs text-muted-foreground">
                                  {service.duration} mins
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                onClick={onAddService}
                disabled={!selectedServiceId || isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
