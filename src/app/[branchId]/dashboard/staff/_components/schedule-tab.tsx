"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schedule = [
  {
    day: "Monday",
    slots: [
      {
        time: "09:00",
        staff: "Emma Wilson",
        booking: "Swedish Massage",
        customer: "Sarah J.",
      },
      {
        time: "10:30",
        staff: "Lisa Anderson",
        booking: "Thai Massage",
        customer: "Michael C.",
      },
      {
        time: "14:00",
        staff: "John Smith",
        booking: "Deep Tissue",
        customer: "David P.",
      },
    ],
  },
  {
    day: "Tuesday",
    slots: [
      {
        time: "09:00",
        staff: "John Smith",
        booking: "Sports Massage",
        customer: "Tom R.",
      },
      {
        time: "11:00",
        staff: "Emma Wilson",
        booking: "Hot Stone",
        customer: "Emily D.",
      },
      {
        time: "15:00",
        staff: "Maria Garcia",
        booking: "Facial",
        customer: "Jessica L.",
      },
    ],
  },
  {
    day: "Wednesday",
    slots: [
      {
        time: "10:00",
        staff: "Maria Garcia",
        booking: "Skin Treatment",
        customer: "Anna M.",
      },
      {
        time: "13:00",
        staff: "Lisa Anderson",
        booking: "Aromatherapy",
        customer: "Chris W.",
      },
    ],
  },
];

export function ScheduleTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Weekly Schedule"}</CardTitle>
        <CardDescription>
          {"Staff availability and appointments"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {schedule.map((day) => (
            <div key={day.day}>
              <h3 className="font-semibold text-sm mb-3">{day.day}</h3>
              <div className="space-y-2">
                {day.slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border"
                  >
                    <div className="w-16 text-sm font-medium">{slot.time}</div>
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {slot.staff
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{slot.staff}</p>
                        <p className="text-xs text-muted-foreground">
                          {slot.booking}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {slot.customer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
