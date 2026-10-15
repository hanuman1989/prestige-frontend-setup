"use client";

import { useEffect, useRef, useState } from "react";

// Limit saved/pasted markup to the formatting offered by this editor.
function safeMarkup(value) {
  const document = new DOMParser().parseFromString(value || "", "text/html");
  document
    .querySelectorAll("script,style,iframe,object,embed,svg,math")
    .forEach((element) => element.remove());
  document.body.querySelectorAll("*").forEach((element) => {
    if (
      ![
        "P",
        "DIV",
        "BR",
        "STRONG",
        "B",
        "EM",
        "I",
        "UL",
        "OL",
        "LI",
        "A",
        "BLOCKQUOTE",
      ].includes(element.tagName)
    ) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const href = element.getAttribute("href");
    Array.from(element.attributes).forEach((attribute) =>
      element.removeAttribute(attribute.name),
    );
    if (
      element.tagName === "A" &&
      href &&
      /^(https?:\/\/|mailto:|\/(?!\/))/i.test(href)
    ) {
      element.setAttribute("href", href);
      element.setAttribute("rel", "noopener noreferrer");
    }
  });
  return document.body.innerHTML;
}

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  required,
  disabled,
  placeholder,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const contentRef = useRef({
    html: null,
    initialHTML: null,
    initialValue: value ?? "",
  });
  const [addingLink, setAddingLink] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = safeMarkup(value);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    contentRef.current.html = editor.innerHTML;
    contentRef.current.initialHTML ??= editor.innerHTML;
  }, [value]);

  function reportChange() {
    if (disabled || readOnly) return;
    const html = editorRef.current.innerHTML;
    const content = contentRef.current;
    if (html === content.html) return;
    content.html = html;
    // Browser serialization/sanitization must not count as a user edit.
    // Undoing back to the initial display restores the exact saved value.
    onChange(html === content.initialHTML ? content.initialValue : html);
  }

  function command(name, argument) {
    if (disabled || readOnly) return;
    editorRef.current.focus();
    // Browser editing commands preserve the native undo stack and selection.
    document.execCommand(name, false, argument);
    reportChange();
  }

  return (
    <div>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="mb-2 block text-sm font-medium"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ms-1 text-red-500">
            *
          </span>
        ) : (
          !readOnly && (
            <span className="ms-1 font-normal text-gray-400">(optional)</span>
          )
        )}
      </label>
      <div
        className={`overflow-hidden rounded-md border ${error ? "border-red-500" : "border-[#dce3f1] dark:border-gray-700"} bg-white focus-within:ring-3 focus-within:ring-blue-500/10 dark:bg-gray-900`}
      >
        {!readOnly && (
          <div
            role="toolbar"
            aria-label={`${label} formatting`}
            className="flex flex-wrap items-center border-b border-[#dce3f1] bg-[#f8faff] dark:border-gray-700 dark:bg-gray-800/50"
          >
            <button
              type="button"
              disabled={disabled}
              aria-label="Bold"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command("bold")}
              className="size-10 text-lg font-bold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
            >
              B
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label="Italic"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command("italic")}
              className="size-10 text-lg italic hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
            >
              I
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label="Bulleted list"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command("insertUnorderedList")}
              className="h-10 px-3 text-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
            >
              • List
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label="Numbered list"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => command("insertOrderedList")}
              className="h-10 px-3 text-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
            >
              1. List
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label="Insert link"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const selection = window.getSelection();
                selectionRef.current = selection.rangeCount
                  ? selection.getRangeAt(0).cloneRange()
                  : null;
                setAddingLink(true);
              }}
              className="h-10 px-3 text-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
            >
              Link
            </button>
          </div>
        )}
        {addingLink && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#dce3f1] p-2 dark:border-gray-700">
            <label htmlFor={`${id}-link`} className="sr-only">
              Link URL
            </label>
            <input
              id={`${id}-link`}
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-2 py-1 text-sm"
            />
            <button
              type="button"
              disabled={
                disabled || !/^(https?:\/\/|mailto:|\/(?!\/))/i.test(url)
              }
              onClick={() => {
                const selection = window.getSelection();
                if (selectionRef.current) {
                  selection.removeAllRanges();
                  selection.addRange(selectionRef.current);
                  command("createLink", url);
                }
                setAddingLink(false);
                setUrl("");
              }}
              className="px-2 text-sm text-blue-600 disabled:opacity-50"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => setAddingLink(false)}
              className="px-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}
        <div
          id={id}
          ref={(element) => {
            editorRef.current = element;
            if (inputRef) inputRef(element);
          }}
          role={readOnly ? undefined : "textbox"}
          tabIndex={readOnly ? undefined : 0}
          contentEditable={!disabled && !readOnly}
          suppressContentEditableWarning
          aria-labelledby={`${id}-label`}
          aria-multiline={!readOnly || undefined}
          aria-required={required || undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          data-placeholder={placeholder}
          onInput={reportChange}
          onBlur={onBlur}
          onPaste={(event) => {
            if (disabled || readOnly) return;
            event.preventDefault();
            command("insertText", event.clipboardData.getData("text/plain"));
          }}
          className="min-h-36 p-4 text-sm outline-none empty:before:pointer-events-none empty:before:text-[#8a9ac0] empty:before:content-[attr(data-placeholder)] [&_a]:text-blue-600 [&_a]:underline [&_ol]:ms-6 [&_ol]:list-decimal [&_ul]:ms-6 [&_ul]:list-disc"
        />
      </div>
      {error?.message && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}
