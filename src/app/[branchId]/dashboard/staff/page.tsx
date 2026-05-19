import { getStaffMembers, getRoles } from "@/actions/staff.actions";
import { Role, Staff, StaffListResponse } from "@/types";
import { StaffPageClient } from "./_components/staff-page-client";

interface StaffPageServerProps {
  branchId: string;
}

export default async function StaffPage(props: {
  params: Promise<{ branchId: string }>;
}) {
  const params = await props.params;
  let staffData: Staff[] = [];
  let roles: Role[] = [];
  let error: string | null = null;
  let paginationMeta: any = null;

  // Fetch staff data server-side with pagination (page 1, 10 items per page by default)
  const staffResult: StaffListResponse = await getStaffMembers(
    params.branchId,
    1,
    10,
  );
  if (staffResult.success && staffResult.data) {
    staffData = staffResult.data;
    paginationMeta = staffResult.meta || null;
  } else {
    error = staffResult.error || "Failed to load staff data";
  }

  // Fetch roles
  const rolesResult = await getRoles();
  if (rolesResult.success && rolesResult.data) {
    roles = rolesResult.data;
  }

  return (
    <StaffPageClient
      branchId={params.branchId}
      staffData={staffData}
      roles={roles}
      error={error}
      paginationMeta={paginationMeta}
    />
  );
}
