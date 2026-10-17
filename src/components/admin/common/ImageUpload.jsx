"use client";

import ImagePreview from "@/components/common/ImagePreview";
import { useEffect, useRef, useState } from "react";

export { ImagePreview, getImageUrl } from "@/components/common/ImagePreview";

export default function ImageUpload({ id, label, existingImageUrl, selectedFile, onChange, inputProps, error, disabled }) {
  const inputRef = useRef(null);
  const filesRef = useRef(selectedFile ? [selectedFile] : []);
  const [preview, setPreview] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseFiles(files) {
    if (disabled) return;
    filesRef.current = files;
    if (onChange(files) === false) return;
    setPreview(files[0] ? URL.createObjectURL(files[0]) : "");
  }

  const currentImage = selectedFile ? preview : existingImageUrl;
  return (
    <>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFiles(Array.from(event.dataTransfer.files));
        }}
        className="relative flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 bg-[#f8faff] p-4 text-center focus-within:ring-3 focus-within:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/40"
      >
        {currentImage ? (
          <ImagePreview src={currentImage} alt={label} className="mb-4 max-h-48 w-full rounded-lg object-contain" />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4 size-12 text-[#53699b]">
            <path d="M13 33a10 10 0 0 1-1-20 13 13 0 0 1 25-1 10 10 0 0 1-1 21M24 42V22m-8 8 8-8 8 8" />
          </svg>
        )}
        <label htmlFor={id} className="cursor-pointer text-sm font-medium">
          <span className="sr-only">{label}: </span>
          {currentImage ? "Replace image" : "Click to upload"}
          <span className="font-normal text-[#53699b] dark:text-gray-400"> or drag and drop</span>
        </label>
        <p id={`${id}-hint`} className="mt-2 text-xs text-[#53699b] dark:text-gray-400">PNG, JPG or WebP. Up to 2 MB (optional)</p>
        {/* RHF clears native inputs on setValue; keep selected/drop files on blur. */}
        <input
          {...inputProps}
          ref={(element) => { inputRef.current = element; inputProps.ref(element); }}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => chooseFiles(Array.from(event.target.files ?? []))}
          onBlur={() => inputProps.onBlur({ type: "blur", target: { name: inputProps.name, value: filesRef.current } })}
          aria-required="false"
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}
      {selectedFile && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (disabled) return; inputRef.current.value = ""; chooseFiles([]); }}
          className="text-sm text-red-600 hover:underline focus-visible:outline-2 focus-visible:outline-red-600 disabled:opacity-50 dark:text-red-400"
        >Discard selected image</button>
      )}
    </>
  );
}
