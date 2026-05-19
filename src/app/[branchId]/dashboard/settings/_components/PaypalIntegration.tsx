"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getPaypalAccounts,
  createPaypalAccount,
  updatePaypalAccount,
  deletePaypalAccount,
  assignBranches,
  testPaypalConnection,
} from "@/actions/paypal.actions";
import { getBranches } from "@/actions/branch.actions";

interface PaypalAccount {
  id: string;
  label: string;
  clientId: string;
  webhookId: string | null;
  mode: "sandbox" | "live";
  isActive: boolean;
  branches: Array<{ id: string; name: string }>;
  spaId: string;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function PaypalIntegration() {
  const { data: session } = useSession();
  const spaId = (session as any)?.spaIds?.[0] || "";

  const [accounts, setAccounts] = useState<PaypalAccount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaypalAccount | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  // Form state
  const [formLabel, setFormLabel] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formClientSecret, setFormClientSecret] = useState("");
  const [formWebhookId, setFormWebhookId] = useState("");
  const [formMode, setFormMode] = useState<"sandbox" | "live">("sandbox");
  const [formBranchIds, setFormBranchIds] = useState<string[]>([]);

  useEffect(() => {
    if (spaId) {
      loadData();
    }
  }, [spaId]);

  async function loadData() {
    setLoading(true);
    const [accountsRes, branchesRes] = await Promise.all([
      getPaypalAccounts(spaId),
      getBranches(),
    ]);
    if (accountsRes.success) setAccounts(accountsRes.data || []);
    if (branchesRes.success) setBranches(branchesRes.data || []);
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingAccount(null);
    setFormLabel("");
    setFormClientId("");
    setFormClientSecret("");
    setFormWebhookId("");
    setFormMode("sandbox");
    setFormBranchIds([]);
    setDialogOpen(true);
  }

  function openEditDialog(account: PaypalAccount) {
    setEditingAccount(account);
    setFormLabel(account.label);
    setFormClientId("");
    setFormClientSecret("");
    setFormWebhookId(account.webhookId || "");
    setFormMode(account.mode);
    setFormBranchIds(account.branches.map((b) => b.id));
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formLabel.trim()) {
      toast.error("Label is required");
      return;
    }

    setSubmitting(true);

    if (editingAccount) {
      const payload: any = { label: formLabel, mode: formMode };
      if (formWebhookId) payload.webhookId = formWebhookId;
      if (formClientId) payload.clientId = formClientId;
      if (formClientSecret) payload.clientSecret = formClientSecret;

      const res = await updatePaypalAccount(editingAccount.id, payload);
      if (res.success) {
        // Update branch assignments if changed
        await assignBranches(editingAccount.id, formBranchIds);
        toast.success("PayPal account updated");
      } else {
        toast.error(res.error || "Failed to update");
      }
    } else {
      if (!formClientId || !formClientSecret) {
        toast.error("Client ID and Client Secret are required");
        setSubmitting(false);
        return;
      }
      const res = await createPaypalAccount({
        spaId,
        label: formLabel,
        clientId: formClientId,
        clientSecret: formClientSecret,
        webhookId: formWebhookId || undefined,
        mode: formMode,
        branchIds: formBranchIds.length > 0 ? formBranchIds : undefined,
      });
      if (res.success) {
        toast.success("PayPal account created");
      } else {
        toast.error(res.error || "Failed to create");
      }
    }

    setSubmitting(false);
    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this PayPal account?")) {
      return;
    }
    const res = await deletePaypalAccount(id);
    if (res.success) {
      toast.success("PayPal account deleted");
      loadData();
    } else {
      toast.error(res.error || "Failed to delete");
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    const res = await testPaypalConnection(id);
    if (res.success && res.data?.success) {
      toast.success("Connection successful!");
    } else {
      toast.error(res.data?.error || res.error || "Connection failed");
    }
    setTesting(null);
  }

  async function handleToggleActive(account: PaypalAccount) {
    const res = await updatePaypalAccount(account.id, {
      isActive: !account.isActive,
    });
    if (res.success) {
      toast.success(
        `Account ${!account.isActive ? "activated" : "deactivated"}`,
      );
      loadData();
    } else {
      toast.error(res.error || "Failed to update");
    }
  }

  function toggleBranch(branchId: string) {
    setFormBranchIds((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId],
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-[#003087]">P</span>
          </div>
          <div>
            <p className="font-medium">PayPal</p>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-border rounded-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-[#003087]">P</span>
            </div>
            <div>
              <p className="font-medium">PayPal</p>
              <p className="text-sm text-muted-foreground">Payment processing</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openCreateDialog}>
            Add Account
          </Button>
        </div>
        {accounts.length > 0 && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{account.label}</p>
                    <Badge
                      variant={account.mode === "live" ? "default" : "secondary"}
                    >
                      {account.mode}
                    </Badge>
                    {!account.isActive && (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Client ID: {account.clientId}
                  </p>
                  {account.branches.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {account.branches.map((b) => (
                        <Badge key={b.id} variant="outline" className="text-xs">
                          {b.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={account.isActive}
                    onCheckedChange={() => handleToggleActive(account)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {testing === account.id ? "Testing..." : "Actions"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={testing === account.id}
                        onClick={() => handleTest(account.id)}
                      >
                        Test Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(account)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(account.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit PayPal Account" : "Add PayPal Account"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount
                ? "Update your PayPal credentials. Leave Client ID and Secret empty to keep existing values."
                : "Enter your PayPal API credentials from the PayPal Developer Dashboard."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pp-label">Label</Label>
              <Input
                id="pp-label"
                placeholder="e.g. Phuket PayPal"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp-client-id">
                Client ID{editingAccount ? " (leave empty to keep)" : ""}
              </Label>
              <Input
                id="pp-client-id"
                placeholder={editingAccount ? "Leave empty to keep current" : "PayPal Client ID"}
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp-client-secret">
                Client Secret{editingAccount ? " (leave empty to keep)" : ""}
              </Label>
              <Input
                id="pp-client-secret"
                type="password"
                placeholder={editingAccount ? "Leave empty to keep current" : "PayPal Client Secret"}
                value={formClientSecret}
                onChange={(e) => setFormClientSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pp-webhook-id">Webhook ID (optional)</Label>
              <Input
                id="pp-webhook-id"
                placeholder="WH-..."
                value={formWebhookId}
                onChange={(e) => setFormWebhookId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={formMode}
                onValueChange={(v) => setFormMode(v as "sandbox" | "live")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="live">Live (Production)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {branches.length > 0 && (
              <div className="space-y-2">
                <Label>Assign to Branches</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`branch-${branch.id}`}
                        checked={formBranchIds.includes(branch.id)}
                        onCheckedChange={() => toggleBranch(branch.id)}
                      />
                      <Label
                        htmlFor={`branch-${branch.id}`}
                        className="font-normal cursor-pointer"
                      >
                        {branch.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingAccount
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
