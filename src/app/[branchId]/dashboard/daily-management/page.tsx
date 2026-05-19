import { getStaffDayOffs } from "@/actions/daily-management.actions";
import { getStaffMembers } from "@/actions/staff.actions";
import { ApiResponse, Staff, StaffDayOff } from "@/types";
import { DailyManagementContent } from "./_components/daily-management-content";

export default async function DailyManagementPage(props: {
  params: Promise<{ branchId: string }>;
}) {
  const params = await props.params;

  let staffDayOffs: StaffDayOff[] = [];
  let staffMembers: Staff[] = [];
  let error: string | null = null;
  let paginationMeta: any = null;

  // Fetch staff day-offs server-side with pagination (page 1, 10 items per page)
  const result: ApiResponse<StaffDayOff[]> = await getStaffDayOffs(
    params.branchId,
    1,
    10,
  );

  if (result.success && result.data) {
    staffDayOffs = result.data;
    paginationMeta = result.meta || null;
  } else {
    error = result.error || "Failed to load staff day-offs";
  }

  // Fetch staff members server-side
  const staffResult: ApiResponse<Staff[]> = await getStaffMembers(
    params.branchId,
  );
  if (staffResult.success && staffResult.data) {
    staffMembers = staffResult.data;
  }

  return (
    <DailyManagementContent
      branchId={params.branchId}
      staffDayOffs={staffDayOffs}
      staffMembers={staffMembers}
      paginationMeta={paginationMeta}
    />
  );
}
