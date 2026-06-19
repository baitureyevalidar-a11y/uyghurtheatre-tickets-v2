"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";

type PosterUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function PosterUpload({ value, onChange }: PosterUploadProps) {
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showDropzone = !value || replacing;

  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="flex items-start gap-4">
          <div className="relative h-[280px] w-[200px] shrink-0 overflow-hidden rounded-md border border-border-default bg-bg-elevated">
            <Image
              src={value}
              alt="Постер события"
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReplacing((r) => !r);
              }}
              className="h-9 rounded-md border border-border-default px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-elevated"
            >
              {replacing ? "Отменить замену" : "Заменить"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReplacing(false);
                onChange(null);
              }}
              className="h-9 rounded-md px-3 text-sm font-medium text-state-error transition-colors hover:bg-state-error-bg"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {showDropzone && (
        <UploadDropzone
          endpoint="eventPoster"
          config={{ mode: "auto" }}
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.ufsUrl ?? null;
            if (url) {
              onChange(url);
              setReplacing(false);
              setError(null);
            }
          }}
          onUploadError={(e) => {
            setError(
              e.message === "Unauthorized"
                ? "Недостаточно прав для загрузки"
                : "Не удалось загрузить файл. Попробуйте ещё раз.",
            );
          }}
          content={{
            label: "Перетащи постер сюда или нажми для выбора",
            allowedContent: "PNG, JPG или WEBP, до 4 МБ",
          }}
          appearance={{
            container:
              "rounded-md border border-dashed border-border-default bg-bg-surface p-6",
            uploadIcon: "text-text-tertiary",
            label: "text-sm font-medium text-text-primary",
            allowedContent: "text-xs text-text-tertiary",
            button:
              "h-9 rounded-md bg-brand-teal px-4 text-sm font-medium text-white after:bg-brand-teal-dark ut-uploading:cursor-not-allowed",
          }}
        />
      )}

      {!value && !replacing && (
        <p className="flex items-center gap-1.5 text-xs text-text-tertiary">
          <ImageOff className="h-3.5 w-3.5" aria-hidden />
          Постер не обязателен, но рекомендуется
        </p>
      )}

      {error && <p className="text-sm text-state-error">{error}</p>}
    </div>
  );
}
