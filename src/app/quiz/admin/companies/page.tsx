"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "~/components/providers/i18n-provider";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export default function CompaniesPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [open, setOpen] = useState(false);

  const utils = api.useUtils();
  const { data: companies } = api.company.list.useQuery();

  const createMutation = api.company.create.useMutation({
    onSuccess: () => {
      void utils.company.list.invalidate();
      setName("");
      setLogoUrl("");
      setOpen(false);
      toast.success(t("save"));
    },
  });

  const deleteMutation = api.company.delete.useMutation({
    onSuccess: () => void utils.company.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("companies")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="bg-accent text-accent-foreground" />}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addCompany")}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addCompany")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("companyName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("companyLogo")}</Label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button
                onClick={() =>
                  createMutation.mutate({
                    name: name.trim(),
                    logoUrl: logoUrl.trim() || undefined,
                  })
                }
                disabled={!name.trim() || createMutation.isPending}
              >
                {t("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("companyName")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium uppercase">{c.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate({ id: c.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
