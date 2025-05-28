"use client";

import React from "react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileIcon, UploadIcon, XIcon, Loader2 } from "lucide-react";
import { parseSBCFile } from "@/actions/parse";
import { toast } from "sonner";
import { ParsedPolicy, usePolicy } from "./policy-context";
import { useComposerRuntime } from "@assistant-ui/react";

interface FileUploadProps {
  acceptedFileTypes?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  acceptedFileTypes = ".pdf",
  maxSizeMB = 10,
}: FileUploadProps) {
  const { setPolicy } = usePolicy();
  const composerRuntime = useComposerRuntime();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): boolean => {
    if (acceptedFileTypes && !file.type.includes("pdf")) {
      setError(`Please upload a PDF file.`);
      return false;
    }
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setError(null);
      setSelectedFile(file);
      setUploadProgress(0);
      
      // Add file to formData
     
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
  };

  // This is the server action wrapper
  async function handleServerAction() {
    setUploadProgress(10);
    try {
      setUploadProgress(30);
      const fileFormData = new FormData();
      if (selectedFile) {
        fileFormData.append("file", selectedFile);
      }
      const startTime = performance.now();
      const result = await parseSBCFile(fileFormData);
      const endTime = performance.now();
      console.log(`File parsing took ${(endTime - startTime) / 1000} seconds`);
      setPolicy(result as unknown as ParsedPolicy);
      setUploadProgress(100);
      console.log("Server action result:", result);
      toast.success("File parsed successfully!");
    } catch (err) {
      setError("Failed to parse file");
      toast.error("Failed to parse file");
      setUploadProgress(0);
      console.error(err);
    }
  }
  // Simulate progress for UX
  React.useEffect(() => {
    if (isPending && uploadProgress < 90) {
      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 1 : p));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPending, uploadProgress]);

  return (
    <div className="w-full">
      <form
        ref={formRef}
        action={async () => {
          setError(null);
          setUploadProgress(0);
          startTransition(() => handleServerAction());
        }}
        className="flex flex-col gap-2"
      >
        {!selectedFile ? (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <UploadIcon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">
                Upload your Summary of Benefits Health and Coverage (SBC) PDF here
              </p>
              <input
                type="file"
                id="file-upload"
                name="file"
                className="hidden"
                accept={acceptedFileTypes}
                onChange={handleChange}
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="mt-2"
              >
                Click to Browse File
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum file size: {maxSizeMB}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[180px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" type="button" onClick={handleCancel}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2 inline" /> : null}
              {isPending ? "Parsing..." : "Parse PDF"}
            </Button>
          </div>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
