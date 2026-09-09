"use client";

import { useState } from "react";
import { ArchiveRestore, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { OPTION_LETTERS } from "~/lib/constants";
import { useI18n } from "~/components/providers/i18n-provider";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

type OptionDraft = {
  labelSv: string;
  labelEn: string;
  letter: string;
  isCorrect: boolean;
  order: number;
};

type QuestionListItem = {
  id: string;
  textSv: string;
  textEn: string | null;
  type: "MULTIPLE_CHOICE" | "FREE_TEXT";
  options: {
    id: string;
    labelSv: string;
    labelEn: string | null;
    letter: string;
    isCorrect: boolean;
    order: number;
  }[];
};

const defaultOptions = (): OptionDraft[] => [
  { labelSv: "", labelEn: "", letter: "A", isCorrect: true, order: 0 },
  { labelSv: "", labelEn: "", letter: "B", isCorrect: false, order: 1 },
];

export default function QuestionBankPage() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [textSv, setTextSv] = useState("");
  const [textEn, setTextEn] = useState("");
  const [type, setType] = useState<"MULTIPLE_CHOICE" | "FREE_TEXT">(
    "MULTIPLE_CHOICE",
  );
  const [options, setOptions] = useState<OptionDraft[]>(defaultOptions());

  const utils = api.useUtils();
  const { data: questions } = api.question.listBank.useQuery();
  const { data: archivedQuestions } = api.question.listArchived.useQuery();

  const resetForm = () => {
    setEditingId(null);
    setTextSv("");
    setTextEn("");
    setType("MULTIPLE_CHOICE");
    setOptions(defaultOptions());
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (q: QuestionListItem) => {
    setEditingId(q.id);
    setTextSv(q.textSv);
    setTextEn(q.textEn ?? "");
    setType(q.type);
    setOptions(
      q.type === "MULTIPLE_CHOICE" && q.options.length > 0
        ? q.options.map((o, i) => ({
            labelSv: o.labelSv,
            labelEn: o.labelEn ?? "",
            letter: o.letter,
            isCorrect: o.isCorrect,
            order: i,
          }))
        : defaultOptions(),
    );
    setOpen(true);
  };

  const createMutation = api.question.create.useMutation({
    onSuccess: () => {
      void utils.question.listBank.invalidate();
      setOpen(false);
      resetForm();
      toast.success(t("save"));
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = api.question.update.useMutation({
    onSuccess: () => {
      invalidateQuestionLists();
      setOpen(false);
      resetForm();
      toast.success(t("save"));
    },
    onError: (e) => toast.error(e.message),
  });

  const invalidateQuestionLists = () => {
    void utils.question.listBank.invalidate();
    void utils.question.listArchived.invalidate();
  };

  const archiveMutation = api.question.archive.useMutation({
    onSuccess: invalidateQuestionLists,
    onError: (e) => toast.error(e.message),
  });

  const restoreMutation = api.question.restore.useMutation({
    onSuccess: invalidateQuestionLists,
    onError: (e) => toast.error(e.message),
  });

  const addOption = () => {
    if (options.length >= 4) return;
    const letter = OPTION_LETTERS[options.length];
    if (!letter) return;
    setOptions([
      ...options,
      {
        labelSv: "",
        labelEn: "",
        letter,
        isCorrect: false,
        order: options.length,
      },
    ]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const correctIndexBefore = options.findIndex((o) => o.isCorrect);
    const next = options
      .filter((_, i) => i !== index)
      .map((o, i) => {
        const originalIndex = i >= index ? i + 1 : i;
        return {
          ...o,
          letter: OPTION_LETTERS[i] ?? o.letter,
          order: i,
          isCorrect:
            correctIndexBefore === index
              ? i === 0
              : originalIndex === correctIndexBefore,
        };
      });
    setOptions(next);
  };

  const handleSave = () => {
    if (!textSv.trim()) {
      toast.error(t("title"));
      return;
    }

    const payload = {
      textSv: textSv.trim(),
      textEn: textEn.trim() || undefined,
      type,
      options: type === "MULTIPLE_CHOICE" ? options : undefined,
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...payload,
        textEn: textEn.trim() || null,
      });
    } else {
      createMutation.mutate({ ...payload, inBank: true });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("questionBank")}</h1>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetForm();
          }}
        >
          <DialogTrigger
            render={
              <Button
                className="bg-accent text-accent-foreground"
                onClick={openCreate}
              />
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addQuestion")}
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? t("editQuestion") : t("addQuestion")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fråga (SV)</Label>
                <Textarea
                  value={textSv}
                  onChange={(e) => setTextSv(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Question (EN)</Label>
                <Textarea
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    if (v === "MULTIPLE_CHOICE" || v === "FREE_TEXT") {
                      setType(v);
                      if (v === "MULTIPLE_CHOICE" && options.length < 2) {
                        setOptions(defaultOptions());
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">
                      {t("multipleChoice")}
                    </SelectItem>
                    <SelectItem value="FREE_TEXT">{t("freeText")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "MULTIPLE_CHOICE" && (
                <div className="space-y-3">
                  {options.map((opt, i) => (
                    <div key={`${opt.letter}-${i}`} className="flex gap-2">
                      <Badge variant="outline" className="mt-2">
                        {opt.letter}
                      </Badge>
                      <Input
                        placeholder={`Alternativ ${opt.letter}`}
                        value={opt.labelSv}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = { ...opt, labelSv: e.target.value };
                          setOptions(next);
                        }}
                      />
                      <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                        <input
                          type="radio"
                          name="correct"
                          checked={opt.isCorrect}
                          onChange={() =>
                            setOptions(
                              options.map((o, j) => ({
                                ...o,
                                isCorrect: j === i,
                              })),
                            )
                          }
                        />
                        {t("correctOption")}
                      </label>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeOption(i)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 4 && (
                    <Button variant="outline" size="sm" onClick={addOption}>
                      {t("addOption")}
                    </Button>
                  )}
                </div>
              )}

              <Button onClick={handleSave} disabled={isSaving}>
                {t("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4 bg-muted">
          <TabsTrigger value="active">{t("activeQuestions")}</TabsTrigger>
          <TabsTrigger value="archived">{t("archivedQuestions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {questions?.map((q) => (
              <Card key={q.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{q.textSv}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {q.type === "MULTIPLE_CHOICE"
                        ? t("multipleChoice")
                        : t("freeText")}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("edit")}
                      onClick={() => openEdit(q)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("archive")}
                      onClick={() => archiveMutation.mutate({ id: q.id })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                {q.options.length > 0 && (
                  <CardContent className="flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <Badge
                        key={o.id}
                        variant={o.isCorrect ? "default" : "outline"}
                      >
                        {o.letter}: {o.labelSv}
                      </Badge>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archived">
          <div className="grid gap-4">
            {archivedQuestions?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("noArchivedQuestions")}
              </p>
            )}
            {archivedQuestions?.map((q) => (
              <Card key={q.id} className="opacity-70">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{q.textSv}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {q.type === "MULTIPLE_CHOICE"
                        ? t("multipleChoice")
                        : t("freeText")}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("edit")}
                      onClick={() => openEdit(q)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={t("restore")}
                      onClick={() => restoreMutation.mutate({ id: q.id })}
                    >
                      <ArchiveRestore className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </CardHeader>
                {q.options.length > 0 && (
                  <CardContent className="flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <Badge
                        key={o.id}
                        variant={o.isCorrect ? "default" : "outline"}
                      >
                        {o.letter}: {o.labelSv}
                      </Badge>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
