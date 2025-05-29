"use client";

import { useState } from "react";

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);

    setStatus("Uploading…");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setStatus(data.message || data.error);
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto">
      <form onSubmit={submit} className="space-y-4">
        <input
          type="file"
          name="file"
          accept=".pdf,.docx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          //   disabled={!file}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Upload & Index
        </button>
        {status && <p>{status}</p>}
      </form>
    </div>
  );
}
